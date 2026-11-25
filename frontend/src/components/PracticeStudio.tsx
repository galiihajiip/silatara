"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, FlaskConical, Pause, Play, ShieldCheck, Square } from "lucide-react";
import type { AsyncLandmarkerAdapter, InitInfo } from "@/features/practice/async-adapter";
import { CAMERA_MESSAGES, CameraController, isStarted } from "@/features/practice/camera";
import { DEFAULT_INFERENCE_CONFIG, type InferenceConfig } from "@/features/practice/config";
import type { LandmarkFrame } from "@/features/practice/landmarks";
import { nowMs } from "@/features/practice/metrics";
import { createFrameBitmap, FramePump, makeFrameScheduler } from "@/features/practice/pipeline";
import { assessFrameQuality, type QualityReason } from "@/features/practice/quality-gate";
import { drawSkeleton, fitVideoBox, type DrawCtx, type Size } from "@/features/practice/skeleton";
import {
  deriveDetectionState, QualityAggregator, SessionClock, StateSmoother, STATE_LABEL, studioGuidance,
  type DetectionState, type StudioState,
} from "@/features/practice/studio-state";
import { SyntheticLandmarkAdapter } from "@/features/practice/synthetic-adapter";
import type { SyntheticScenario } from "@/features/practice/synthetic-pose";
import { WorkerLandmarkerAdapter } from "@/features/practice/worker-adapter";
import { formatClock } from "@/lib/format";
import { completePracticeSession, startPracticeSession, type CompleteBody } from "@/lib/practice-api";
import { Notice } from "@/components/Notice";

export interface StudioLesson {
  id: string; title: string; slug: string; courseSlug: string; courseTitle: string;
  isDemo: boolean; practiceLabel: string; verificationLabel: string; objective: string | null; safetyNotes: string | null;
}
type Phase = "intro" | "initializing" | "ready" | "running" | "paused" | "saving" | "error";
type SimScenario = SyntheticScenario | "cycle";

const CYCLE: SyntheticScenario[] = ["waiting", "full", "partial", "out_of_frame", "multiple", "full"];
const cycleScript = (i: number): SyntheticScenario => (i < 6 ? "waiting" : CYCLE[Math.floor((i - 6) / 12) % CYCLE.length]);

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium disabled:opacity-60";
const primary = `${btn} bg-forest-700 text-paper-50 hover:bg-forest-900`;
const secondary = `${btn} border border-line-200 bg-paper-50 hover:bg-parchment-100`;

export function SafetyNotice() {
  return (
    <section aria-labelledby="keselamatan" className="rounded-2xl border border-bronze-500/40 bg-bronze-500/10 p-4 text-sm">
      <h2 id="keselamatan" className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden className="h-4 w-4 text-bronze-700" />Keselamatan</h2>
      <ul className="list-disc space-y-1 pl-5 text-slate-600">
        <li>Hanya lakukan <strong>latihan solo tingkat pemula</strong> yang disediakan dan disetujui instruktur.</li>
        <li>Gunakan area yang cukup lapang dan aman. Singkirkan benda di sekitar Anda.</li>
        <li><strong>Jangan</strong> melakukan sparring, teknik senjata, bantingan, atau gerakan kontak tanpa pengawasan instruktur.</li>
        <li>Hentikan latihan kapan saja bila nyeri atau tidak nyaman. Tombol <em>Hentikan</em> selalu tersedia.</li>
      </ul>
    </section>
  );
}

export function PracticeStudio({ lesson, synthetic = false, scenario = "cycle", createAdapter, config }: {
  lesson: StudioLesson; synthetic?: boolean; scenario?: SimScenario;
  createAdapter?: (cfg: InferenceConfig) => AsyncLandmarkerAdapter; config?: Partial<InferenceConfig>;
}) {
  const router = useRouter();
  const cfg: InferenceConfig = { ...DEFAULT_INFERENCE_CONFIG, ...config };
  const [phase, setPhase] = useState<Phase>("intro");
  const [consent, setConsent] = useState(false);
  const [detection, setDetection] = useState<DetectionState>("waiting_for_subject");
  const [reasons, setReasons] = useState<QualityReason[]>(["NO_POSE"]);
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [mirror, setMirror] = useState(true);
  const [showHands, setShowHands] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [box, setBox] = useState<Size>({ width: 640, height: 480 });
  const [info, setInfo] = useState<InitInfo | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrl = useRef<CameraController | null>(null);
  const adapter = useRef<AsyncLandmarkerAdapter | null>(null);
  const pump = useRef<FramePump | null>(null);
  const clock = useRef(new SessionClock(nowMs));
  const agg = useRef(new QualityAggregator());
  const smoother = useRef(new StateSmoother(5));
  const phaseRef = useRef<Phase>("intro");
  const sessionId = useRef<string | null>(null);
  const lastFrame = useRef<LandmarkFrame | null>(null);
  const boxRef = useRef<Size>(box);
  const mirrorRef = useRef(mirror);
  const handsRef = useRef(showHands);
  const infoRef = useRef<InitInfo | null>(null);
  const payload = useRef<CompleteBody | null>(null);
  const getCtrl = () => (ctrl.current ??= new CameraController());
  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  // ---------- rendering overlay ----------
  const render = useCallback((frame: LandmarkFrame | null) => {
    const c = canvasRef.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const dpr = window.devicePixelRatio || 1;
    const b = boxRef.current;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!frame) { g.clearRect(0, 0, b.width, b.height); c.dataset.points = "0"; return; }
    const r = drawSkeleton(g as unknown as DrawCtx, frame, b, { mirror: mirrorRef.current, showHands: handsRef.current });
    c.dataset.points = String(r.points); c.dataset.bones = String(r.bones);
  }, []);

  useEffect(() => { boxRef.current = box; mirrorRef.current = mirror; handsRef.current = showHands; render(lastFrame.current); }, [box, mirror, showHands, render]);

  // Layout studio (berisi <video>/<canvas>) baru ada setelah fase "intro"; efek ukuran harus menunggunya.
  const inStudio = phase !== "intro";

  // ukuran area video mengikuti rasio asli, tanpa crop; ikut berubah saat viewport berubah
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !inStudio) return;
    const update = () => {
      const v = videoRef.current;
      setBox(fitVideoBox(v?.videoWidth || 640, v?.videoHeight || 480, el.clientWidth, Math.max(240, window.innerHeight * 0.68)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    const v = videoRef.current;
    v?.addEventListener("loadedmetadata", update);
    return () => { ro.disconnect(); window.removeEventListener("resize", update); v?.removeEventListener("loadedmetadata", update); };
  }, [inStudio]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !inStudio) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr);
    c.dataset.w = String(Math.round(box.width)); c.dataset.h = String(Math.round(box.height));
    render(lastFrame.current);
  }, [box, render, inStudio]);

  // ---------- timer tampilan ----------
  useEffect(() => {
    if (phase !== "running" && phase !== "paused") return;
    const id = setInterval(() => setElapsed(clock.current.read().activeMs), 250);
    return () => clearInterval(id);
  }, [phase]);

  // ---------- teardown (kamera + worker) ----------
  const teardown = useCallback(async () => {
    pump.current?.stop(); pump.current = null;
    const a = adapter.current; adapter.current = null;
    await a?.dispose();
    getCtrl().stop();
    if (videoRef.current) videoRef.current.srcObject = null;
    lastFrame.current = null; render(null);
  }, [render]);

  const buildPayload = useCallback((status: CompleteBody["status"], errorCode?: string): CompleteBody => {
    const { activeMs, pausedMs } = clock.current.stop();
    const t = nowMs();
    const dropped = (pump.current?.stats.droppedBackpressure ?? 0) + (pump.current?.stats.droppedByWorker ?? 0);
    const d = infoRef.current?.delegate;
    return {
      status, active_duration_ms: activeMs, paused_duration_ms: pausedMs, error_code: errorCode,
      quality_summary: agg.current.snapshot(t, { dropped, engine: synthetic ? "synthetic" : "worker", delegate: d === "GPU" || d === "CPU" ? d : null, simulated: synthetic }),
    };
  }, [synthetic]);

  /** Tutup sesi di server (best effort) lalu lepas semua resource. Dipakai saat keluar halaman. */
  const abandonIfActive = useCallback((keepalive: boolean) => {
    const id = sessionId.current;
    if (id && (phaseRef.current === "running" || phaseRef.current === "paused")) {
      sessionId.current = null;
      const body = buildPayload("abandoned");
      void completePracticeSession(id, body, { keepalive });
    }
    void teardown();
  }, [buildPayload, teardown]);

  useEffect(() => {
    const onHide = () => abandonIfActive(true);
    const onVisibility = () => { if (cfg.pauseWhenHidden) pump.current?.setPaused(document.hidden || phaseRef.current === "paused"); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pagehide", onHide); document.removeEventListener("visibilitychange", onVisibility); abandonIfActive(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- alur ----------
  async function attachStream(deviceIdArg?: string): Promise<boolean> {
    const r = await getCtrl().start(deviceIdArg || undefined);
    if (!isStarted(r)) {
      const text = r.type === "denied" ? CAMERA_MESSAGES.denied : r.type === "unavailable" ? CAMERA_MESSAGES[r.reason] : r.type === "error" ? r.message : "Kamera tidak dapat dimulai.";
      setMessage(text); setPhaseBoth("error");
      return false;
    }
    if (videoRef.current) { videoRef.current.srcObject = r.stream; await videoRef.current.play().catch(() => undefined); }
    setDevices(await getCtrl().listVideoDevices());
    return true;
  }

  /** Memulai: cukup pindah ke fase "initializing"; layout studio (berisi <video>) dirender dulu, lalu effect menjalankan bootstrap. */
  function begin() { setMessage(null); setPhaseBoth("initializing"); }

  const booting = useRef(false);
  useEffect(() => {
    if (phase !== "initializing" || booting.current) return;
    booting.current = true;
    void (async () => {
      try {
        if (await attachStream(deviceId)) await initEngine();
      } finally {
        booting.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function initEngine() {
    const video = videoRef.current;
    if (!video) return;
    const a: AsyncLandmarkerAdapter = createAdapter ? createAdapter(cfg)
      : synthetic ? new SyntheticLandmarkAdapter(scenario === "cycle" ? (i) => cycleScript(i) : () => scenario)
      : new WorkerLandmarkerAdapter(cfg);
    adapter.current = a;
    const sched = makeFrameScheduler(video);
    const p = new FramePump({
      adapter: a, source: video, config: cfg, createBitmap: createFrameBitmap, now: nowMs, schedule: sched.schedule, cancel: sched.cancel,
      onResult: ({ frame }) => {
        lastFrame.current = frame;
        const q = assessFrameQuality(frame);
        const cand = deriveDetectionState(q);
        const shown = smoother.current.push(cand);
        setDetection((prev) => (prev === shown ? prev : shown));
        setReasons((prev) => (prev.join() === q.reasons.join() ? prev : q.reasons));
        if (phaseRef.current === "running") agg.current.record(cand, q, nowMs());
        if (phaseRef.current !== "paused") render(frame);
      },
      onFatal: ({ message: m }) => {
        void teardown().then(() => { setMessage(m); setPhaseBoth("error"); });
      },
    });
    pump.current = p;
    try {
      const i = await a.init();
      infoRef.current = i; setInfo(i);
      p.start();
      setPhaseBoth("ready");
    } catch (e) {
      await teardown();
      setMessage(e instanceof Error ? e.message : "Mesin deteksi gagal dimuat.");
      setPhaseBoth("error");
    }
  }

  async function switchCamera(id: string) {
    setDeviceId(id);
    getCtrl().stop();
    await attachStream(id);
  }

  async function startSession() {
    setSaveError(null);
    const modelVersion = synthetic ? "synthetic-simulation" : `${infoRef.current?.library ?? "mediapipe"}/pose_landmarker_lite${cfg.hands ? "+hand_landmarker" : ""}`;
    const r = await startPracticeSession(lesson.id, modelVersion);
    if (!r.ok) { setSaveError(r.error); return; }
    sessionId.current = r.data.id;
    smoother.current.reset(); setDetection("waiting_for_subject");
    clock.current = new SessionClock(nowMs); clock.current.start();
    agg.current = new QualityAggregator(); agg.current.start(nowMs());
    setElapsed(0); setPhaseBoth("running");
  }

  function pauseSession() {
    clock.current.pause(); agg.current.pause(nowMs());
    setElapsed(clock.current.read().activeMs); // segarkan tampilan tepat saat jeda
    pump.current?.setPaused(true); render(null); setPhaseBoth("paused");
  }
  function resumeSession() {
    clock.current.resume(); agg.current.resume(nowMs());
    setElapsed(clock.current.read().activeMs);
    pump.current?.setPaused(false); setPhaseBoth("running");
  }

  async function finish(status: "completed" | "error" = "completed", errorCode?: string) {
    const id = sessionId.current;
    if (!id) return;
    setPhaseBoth("saving"); setSaveError(null);
    payload.current = buildPayload(status, errorCode);
    sessionId.current = null;
    await teardown(); // kamera + worker berhenti SEBELUM menyimpan
    await save(id);
  }

  async function save(id: string) {
    const r = await completePracticeSession(id, payload.current!);
    if (!r.ok) { sessionId.current = id; setSaveError(r.error); setPhaseBoth("error"); setMessage("Sesi berakhir, tetapi ringkasan belum tersimpan."); return; }
    router.push(`/app/practice/sessions/${r.data.id}`);
  }

  const state: StudioState =
    phase === "running" ? detection : phase === "intro" || phase === "initializing" || phase === "ready" || phase === "paused" || phase === "error" ? phase : "completed";
  const guide = studioGuidance(detection, reasons);
  const live = phase === "ready" || phase === "running";
  const hasPreview = phase === "initializing" || phase === "ready" || phase === "running" || phase === "paused";

  // ---------------------------------------------------------------- INTRO
  if (phase === "intro") {
    return (
      <div data-testid="studio" data-state="intro" className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border border-line-200 bg-paper-50 p-6">
          <p className="text-sm text-slate-600">{lesson.courseTitle}</p>
          <h2 className="font-serif text-2xl text-forest-900">{lesson.title}</h2>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-bronze-500/15 px-3 py-1 text-xs"><FlaskConical aria-hidden className="h-3.5 w-3.5" />{lesson.isDemo ? lesson.verificationLabel : lesson.practiceLabel}</p>
          {lesson.isDemo && <p className="mt-2 text-sm text-slate-600">{lesson.practiceLabel}</p>}
          {lesson.objective && <p className="mt-3 text-slate-600"><strong className="text-ink-950">Tujuan pelajaran:</strong> {lesson.objective}</p>}
        </section>
        {synthetic && <div role="note" className="rounded-xl border border-clay-600/40 bg-clay-600/5 p-3 text-sm"><strong>MODE SIMULASI.</strong> Skeleton yang tampil adalah data sintetis buatan kode, bukan tubuh Anda. Untuk menguji tampilan dan alur saja.</div>}
        <section aria-labelledby="persiapan" className="rounded-2xl border border-line-200 bg-paper-50 p-6">
          <h2 id="persiapan" className="mb-2 flex items-center gap-2 font-semibold"><ShieldCheck aria-hidden className="h-5 w-5 text-forest-700" />Sebelum menyalakan kamera</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Berdirilah 1,5–2 meter dari kamera sehingga kepala hingga kaki terlihat, dengan cahaya cukup dan hanya Anda di bingkai.</li>
            <li>Kamera hanya menyala setelah Anda menyetujui di bawah, dan <strong>dapat dihentikan kapan saja</strong>. Mikrofon tidak digunakan.</li>
            <li>Gambar diproses <strong>di perangkat Anda</strong>. Video, foto, dan data posisi tubuh <strong>tidak direkam, disimpan, atau dikirim</strong>. Yang tersimpan hanya: waktu mulai/selesai, durasi, status sesi, versi model, dan ringkasan kualitas deteksi (angka agregat).</li>
            <li>Studio ini <strong>tidak menilai gerakan</strong>: tidak ada skor, koreksi, atau penghitung repetisi. Ia hanya membantu memastikan tubuh Anda terlihat jelas.</li>
          </ul>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Saya memahami hal di atas dan <strong>setuju kamera dinyalakan</strong> untuk sesi latihan ini.</span>
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => begin()} disabled={!consent} className={primary}><Camera aria-hidden className="h-4 w-4" />Saya setuju, nyalakan kamera</button>
            <Link href={`/app/courses/${lesson.courseSlug}/lessons/${lesson.slug}`} className={secondary}>Kembali ke materi</Link>
          </div>
        </section>
        <SafetyNotice />
      </div>
    );
  }

  // ---------------------------------------------------------------- STUDIO
  const chipTone = state === "detecting" ? "bg-forest-700/10 text-forest-900" : state === "paused" ? "bg-line-200 text-slate-600"
    : state === "error" ? "border border-clay-600/40 bg-clay-600/10 text-ink-950" : "bg-bronze-500/15 text-ink-950";
  return (
    <div data-testid="studio" data-state={state} data-phase={phase} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-4">
        {synthetic && <div role="note" className="rounded-xl border border-clay-600/40 bg-clay-600/5 p-3 text-sm"><strong>MODE SIMULASI</strong>: landmark sintetis, bukan tubuh Anda.</div>}
        <div ref={stageRef} className="w-full">
          <div className="relative mx-auto overflow-hidden rounded-2xl bg-ink-950" style={{ width: box.width, height: box.height }} data-testid="stage">
            <video ref={videoRef} muted playsInline aria-label="Pratinjau kamera" className="absolute inset-0 h-full w-full object-fill"
              style={{ transform: mirror ? "scaleX(-1)" : undefined, visibility: hasPreview ? "visible" : "hidden" }} />
            <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" style={{ width: box.width, height: box.height }} data-testid="overlay" data-mirror={String(mirror)} />
            {phase === "initializing" && <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 p-4 text-center text-paper-50" role="status">Menyiapkan kamera dan mesin deteksi… (halaman tetap dapat dipakai)</div>}
            {phase === "paused" && <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950/70 p-4 text-center text-paper-50"><Pause aria-hidden className="mb-2 h-8 w-8" /><p className="text-lg font-medium">Latihan dijeda</p><p className="text-sm">Waktu tidak bertambah. Tekan Lanjutkan bila siap.</p></div>}
            {phase === "error" && <div className="absolute inset-0 flex items-center justify-center bg-ink-950/80 p-4 text-center text-paper-50"><CameraOff aria-hidden className="mr-2 h-6 w-6" />Kamera berhenti</div>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Kontrol sesi">
          {phase === "ready" && <button onClick={startSession} className={primary}><Play aria-hidden className="h-4 w-4" />Mulai latihan</button>}
          {phase === "running" && <button onClick={pauseSession} className={secondary}><Pause aria-hidden className="h-4 w-4" />Jeda</button>}
          {phase === "paused" && <button onClick={resumeSession} className={primary}><Play aria-hidden className="h-4 w-4" />Lanjutkan</button>}
          {(phase === "running" || phase === "paused") && <button onClick={() => void finish("completed")} className={`${btn} bg-clay-600 text-paper-50`}><Square aria-hidden className="h-4 w-4" />Hentikan latihan</button>}
          {phase === "ready" && <Link href={`/app/courses/${lesson.courseSlug}/lessons/${lesson.slug}`} className={secondary} onClick={() => void teardown()}>Batal</Link>}
          {live && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />Cermin tampilan</label>}
          {live && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showHands} onChange={(e) => setShowHands(e.target.checked)} />Tampilkan tangan</label>}
          {phase === "ready" && devices.length > 1 && (
            <div><label htmlFor="cam" className="sr-only">Pilih kamera</label>
              <select id="cam" value={deviceId} onChange={(e) => void switchCamera(e.target.value)} className="rounded-xl border border-line-200 bg-paper-50 px-3 py-2.5">
                <option value="">Kamera bawaan</option>{devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>)}</select></div>)}
        </div>
        <Notice kind={saveError ? "error" : null}>{saveError}</Notice>

        {phase === "error" && (
          <div role="alert" className="rounded-2xl border border-clay-600/30 bg-clay-600/5 p-4">
            <p className="font-semibold text-clay-600">Terjadi masalah</p>
            <p className="text-sm text-slate-600">{message}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {sessionId.current && payload.current ? <button onClick={() => void save(sessionId.current!)} className={primary}>Coba simpan lagi</button>
                : <button onClick={() => begin()} className={primary}>Coba lagi</button>}
              <Link href="/app/practice" className={secondary}>Lihat riwayat latihan</Link>
              <Link href={`/app/courses/${lesson.courseSlug}/lessons/${lesson.slug}`} className={secondary}>Kembali ke materi</Link>
            </div>
          </div>)}
      </div>

      <aside className="min-w-0 space-y-4" aria-label="Panduan dan status">
        <section className="rounded-2xl border border-line-200 bg-paper-50 p-4" aria-labelledby="status">
          <h2 id="status" className="mb-2 text-sm font-semibold text-slate-600">Status deteksi</h2>
          <p data-testid="state-chip" className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${chipTone}`}>{STATE_LABEL[state]}</p>
          <div role="status" aria-live="polite" className="mt-3">
            {(phase === "ready" || phase === "running") && <><p data-testid="guidance-title" className="font-medium">{guide.title}</p><p className="text-sm text-slate-600">{guide.hint}</p></>}
            {phase === "initializing" && <p className="text-sm text-slate-600">Mohon tunggu sebentar…</p>}
            {phase === "paused" && <p className="text-sm text-slate-600">Deteksi dijeda selama latihan dijeda.</p>}
          </div>
          {phase === "ready" && <p className="mt-3 text-xs text-slate-600">Pratinjau: belum ada sesi yang direkam. Tekan <em>Mulai latihan</em> bila tubuh Anda sudah terlihat.</p>}
        </section>

        <section className="rounded-2xl border border-line-200 bg-paper-50 p-4" aria-labelledby="sesi">
          <h2 id="sesi" className="mb-2 text-sm font-semibold text-slate-600">Sesi</h2>
          <p data-testid="timer" className="font-serif text-4xl tabular-nums text-forest-900" aria-label="Waktu latihan aktif">{formatClock(elapsed)}</p>
          <p className="mt-1 text-sm" data-testid="session-indicator">{phase === "running" ? "● Sesi aktif" : phase === "paused" ? "❚❚ Dijeda" : phase === "saving" ? "Menyimpan…" : "Belum dimulai"}</p>
          <p className="mt-3 text-xs text-slate-600">{info ? `Mesin: ${synthetic ? "simulasi sintetis" : `Web Worker${info.delegate ? ` (${info.delegate})` : ""}`}.` : "Mesin belum siap."} Tidak ada penilaian gerakan; hanya kualitas input.</p>
        </section>

        <section className="rounded-2xl border border-line-200 bg-paper-50 p-4 text-sm" aria-labelledby="materi">
          <h2 id="materi" className="mb-1 text-sm font-semibold text-slate-600">Materi</h2>
          <p className="font-medium">{lesson.title}</p>
          <p className="text-slate-600">{lesson.courseTitle}</p>
          <p className="mt-1 text-xs text-slate-600">{lesson.verificationLabel}</p>
          {lesson.safetyNotes && <p className="mt-2 text-xs text-slate-600"><strong>Catatan keselamatan materi:</strong> {lesson.safetyNotes}</p>}
        </section>
        <SafetyNotice />
      </aside>
    </div>
  );
}
