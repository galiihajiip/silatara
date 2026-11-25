"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, CircleDashed, RotateCcw, ShieldCheck, Square } from "lucide-react";
import { apiGet } from "@/lib/api";
import { clientRequest } from "@/lib/client-api";
import { assess, ENGINE_VERSION, referenceFrames, type ReferenceJson } from "@/features/assessment/engine";
import { positioningCheck, toMeasureFrame } from "@/features/assessment/capture";
import type { AssessmentOutcome, MeasureFrame, Protocol } from "@/features/assessment/types";
import type { AsyncLandmarkerAdapter } from "@/features/practice/async-adapter";
import { CAMERA_MESSAGES, CameraController, isStarted } from "@/features/practice/camera";
import { DEFAULT_INFERENCE_CONFIG, MEDIAPIPE_VERSION, type InferenceConfig } from "@/features/practice/config";
import type { LandmarkFrame } from "@/features/practice/landmarks";
import { nowMs } from "@/features/practice/metrics";
import { createFrameBitmap, FramePump, makeFrameScheduler } from "@/features/practice/pipeline";
import { drawSkeleton, fitVideoBox, LandmarkSmoother, type DrawCtx, type Size } from "@/features/practice/skeleton";
import { WorkerLandmarkerAdapter } from "@/features/practice/worker-adapter";

type Step = "intro" | "starting" | "positioning" | "countdown" | "recording" | "analyzing" | "result" | "error";
const btn = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const primary = `${btn} bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white shadow-sm shadow-orange-950/15 hover:from-[#3a0808] hover:to-[#9a3412]`;
const secondary = `${btn} border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-[#fed7aa] hover:bg-[#fffaf5] hover:text-[#6d1b11]`;
const MIN_RECORD_S = 3;

export function AssessmentPractice({ protocol, movementTitle, loggedIn, lessonRef, createAdapter }: {
  protocol: Protocol; movementTitle: string; loggedIn: boolean; lessonRef?: string;
  createAdapter?: (cfg: InferenceConfig) => AsyncLandmarkerAdapter;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [posMsg, setPosMsg] = useState("Menyiapkan kamera…");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [mirror, setMirror] = useState(true);
  const [box, setBox] = useState<Size>({ width: 640, height: 480 });
  const [result, setResult] = useState<AssessmentOutcome | null>(null);
  const [saveBreakdown, setSaveBreakdown] = useState(true);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const stepRef = useRef<Step>("intro");
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrl = useRef<CameraController | null>(null);
  const adapter = useRef<AsyncLandmarkerAdapter | null>(null);
  const pump = useRef<FramePump | null>(null);
  const frames = useRef<MeasureFrame[]>([]);
  const recStart = useRef(0);
  const okSince = useRef<number | null>(null);
  const reference = useRef<ReferenceJson | null>(null);
  const smoother = useRef(new LandmarkSmoother());
  const boxRef = useRef(box);
  const mirrorRef = useRef(mirror);
  const libRef = useRef("");
  const cfg: InferenceConfig = { ...DEFAULT_INFERENCE_CONFIG, hands: true };
  const refDuration = useRef(10);
  const maxRecord = () => Math.min(40, Math.max(8, refDuration.current * 2.2));
  const go = (s: Step) => { stepRef.current = s; setStep(s); };

  const render = useCallback((frame: LandmarkFrame | null) => {
    const c = canvasRef.current, g = c?.getContext("2d");
    if (!c || !g) return;
    const dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!frame) { g.clearRect(0, 0, boxRef.current.width, boxRef.current.height); return; }
    drawSkeleton(g as unknown as DrawCtx, smoother.current.smooth(frame), boxRef.current, { mirror: mirrorRef.current, showHands: true });
  }, []);

  useEffect(() => { boxRef.current = box; mirrorRef.current = mirror; }, [box, mirror]);

  const teardown = useCallback(async () => {
    pump.current?.stop(); pump.current = null;
    const a = adapter.current; adapter.current = null;
    await a?.dispose();
    ctrl.current?.stop();
    if (videoRef.current) videoRef.current.srcObject = null;
    smoother.current.reset();
    render(null);
  }, [render]);

  // pastikan kamera & worker berhenti saat keluar halaman
  useEffect(() => {
    const onHide = () => { void teardown(); };
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("pagehide", onHide); void teardown(); };
  }, [teardown]);

  // ukuran video tanpa crop
  const live = step === "starting" || step === "positioning" || step === "countdown" || step === "recording";
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !live) return;
    const update = () => {
      const v = videoRef.current;
      setBox(fitVideoBox(v?.videoWidth || 640, v?.videoHeight || 480, el.clientWidth, Math.max(240, window.innerHeight * 0.62)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    videoRef.current?.addEventListener("loadedmetadata", update);
    return () => ro.disconnect();
  }, [live]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr);
  }, [box]);

  const onFrame = useCallback((frame: LandmarkFrame) => {
    render(frame);
    const s = stepRef.current;
    const t = nowMs() / 1000;
    const mf = toMeasureFrame(frame, t);
    if (s === "positioning") {
      const p = positioningCheck(mf, protocol.required_view);
      setPosMsg(p.message);
      if (p.ok) {
        okSince.current ??= t;
        if (t - okSince.current > 1.2) { okSince.current = null; setCount(3); go("countdown"); }
      } else okSince.current = null;
    } else if (s === "recording") {
      frames.current.push(mf);
    }
  }, [protocol.required_view, render]);

  async function start() {
    setMessage(null); setResult(null); setSaved("idle"); frames.current = [];
    go("starting");
    try {
      if (!reference.current) {
        const r = await apiGet<ReferenceJson>(`/research/character/reference/${encodeURIComponent(protocol.movement_id)}`);
        if (!r.ok) throw new Error("Referensi gerak tidak dapat dimuat.");
        reference.current = r.data;
        refDuration.current = r.data.frames.length ? r.data.frames[r.data.frames.length - 1].t : 10;
      }
      ctrl.current ??= new CameraController();
      const cam = await ctrl.current.start();
      if (!isStarted(cam)) {
        const text = cam.type === "denied" ? CAMERA_MESSAGES.denied : cam.type === "unavailable" ? CAMERA_MESSAGES[cam.reason] : cam.type === "error" ? cam.message : "Kamera tidak dapat dimulai.";
        throw new Error(text);
      }
      const video = videoRef.current!;
      video.srcObject = cam.stream;
      await video.play().catch(() => undefined);
      const a = createAdapter ? createAdapter(cfg) : new WorkerLandmarkerAdapter(cfg);
      adapter.current = a;
      const sched = makeFrameScheduler(video);
      const p = new FramePump({
        adapter: a, source: video, config: cfg, createBitmap: createFrameBitmap, now: nowMs, schedule: sched.schedule, cancel: sched.cancel,
        onResult: ({ frame }) => onFrame(frame),
        onFatal: ({ message: m }) => { void teardown().then(() => { setMessage(m); go("error"); }); },
      });
      pump.current = p;
      const info = await a.init();
      libRef.current = `${info.library ?? `@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`}/pose_landmarker_lite+hand_landmarker`;
      p.start();
      setPosMsg("Atur posisi Anda…");
      go("positioning");
    } catch (e) {
      await teardown();
      setMessage(e instanceof Error ? e.message : "Kamera atau mesin deteksi gagal dimuat.");
      go("error");
    }
  }

  // hitung mundur → rekam
  useEffect(() => {
    if (step !== "countdown") return;
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(id); frames.current = []; recStart.current = nowMs(); setElapsed(0); go("recording"); }
      else setCount(n);
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const finish = useCallback(async () => {
    if (stepRef.current !== "recording") return;
    go("analyzing");
    const captured = frames.current;
    frames.current = [];
    await teardown(); // kamera mati SEBELUM analisis; frame hanya ada di memori
    const ref = reference.current!;
    const t0 = captured.length ? captured[0].t : 0;
    const out = assess(protocol, referenceFrames(ref, protocol.required_view), captured.map((f) => ({ ...f, t: f.t - t0 })));
    setResult(out);
    go("result");
  }, [protocol, teardown]);

  useEffect(() => {
    if (step !== "recording") return;
    const id = setInterval(() => {
      const s = (nowMs() - recStart.current) / 1000;
      setElapsed(s);
      if (s >= maxRecord()) void finish();
    }, 200);
    return () => clearInterval(id);
  }, [step, finish]);

  async function stopAll() { await teardown(); frames.current = []; go("intro"); }

  async function save() {
    if (!result) return;
    setSaved("saving");
    const scored = result.status === "scored";
    const body = {
      movement_id: protocol.movement_id, lesson_ref: lessonRef, protocol_id: result.protocol_id, protocol_version: result.protocol_version,
      reference_id: result.reference_id, engine_version: ENGINE_VERSION, model_version: libRef.current || "mediapipe",
      status: result.status, not_assessable_reason: scored ? null : result.reason, total_score: scored ? result.total_score : null,
      input_quality: result.input_quality, duration_ms: scored ? Math.round(result.duration_s * 1000) : null, frames_analyzed: result.frames_analyzed,
      consent_breakdown: scored && saveBreakdown,
      criteria: scored && saveBreakdown ? result.criteria.map((c) => ({ id: c.id, label: c.label, score: c.score, actual: c.actual, target: c.target, weight: c.weight, status: c.status })) : null,
      phases: scored && saveBreakdown ? result.phases.map((p) => ({ keyframe: p.keyframe, label: p.label, detected: p.detected, score: p.score })) : null,
      feedback: scored ? result.suggestions.slice(0, 3) : null,
    };
    const r = await clientRequest("POST", "/assessments", body);
    setSaved(r.ok ? "saved" : "error");
  }

  // ---------------------------------------------------------------- tampilan
  if (step === "intro" || step === "error") {
    return (
      <section aria-labelledby="mulai" className="space-y-4 rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs sm:p-6" data-testid="assess" data-step={step}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#fed7aa]/80 bg-[#fff6ee] text-[#6d1b11]">
            <ShieldCheck aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">Persiapan &amp; Privasi</p>
            <h2 id="mulai" className="font-serif text-xl text-[#2e0909] sm:text-2xl">Sebelum mencoba</h2>
          </div>
        </div>

        {message && (
          <p role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-900">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{message}</span>
          </p>
        )}

        <ul className="grid gap-2 text-xs leading-relaxed text-slate-600 sm:grid-cols-2 sm:text-sm">
          {protocol.body_positioning.map((b) => (
            <li key={b} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2410c]" />
              <span>{b}</span>
            </li>
          ))}
          <li className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a3412]" />
            <span>Kamera hanya menyala setelah Anda setuju dan <strong className="font-semibold text-slate-800">dapat dihentikan kapan saja</strong>. Mikrofon tidak digunakan.</span>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9a3412]" />
            <span>Gambar diproses <strong className="font-semibold text-slate-800">di perangkat Anda</strong>. Video dan posisi tubuh tidak direkam atau dikirim. Data gerak dihapus dari memori setelah skor dihitung.</span>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />
            <span>Hentikan latihan bila terasa nyeri atau tidak nyaman.</span>
          </li>
        </ul>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#fed7aa] bg-[#fffaf5] px-4 py-3 text-xs leading-relaxed text-slate-700 transition-colors hover:border-[#f59e0b]/60 sm:text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#7c1d1d]" />
          <span>Saya memahami hal di atas dan <strong className="font-semibold text-[#2e0909]">setuju kamera dinyalakan</strong> untuk latihan {movementTitle}.</span>
        </label>

        <div>
          <button onClick={() => void start()} disabled={!consent} className={primary}>
            <Camera aria-hidden className="h-4 w-4" />
            Coba Latihan Sekarang
          </button>
        </div>
      </section>
    );
  }

  if (step === "result" && result) return <ResultView result={result} protocol={protocol} loggedIn={loggedIn} onRetry={() => void start()}
    saveBreakdown={saveBreakdown} setSaveBreakdown={setSaveBreakdown} saved={saved} onSave={() => void save()} />;

  return (
    <section aria-label="Latihan kamera" className="space-y-4" data-testid="assess" data-step={step}>
      <div ref={stageRef} className="w-full">
        <div className="relative mx-auto overflow-hidden rounded-[24px] border border-slate-200/80 bg-[#1a0505] shadow-md" style={{ width: box.width, height: box.height }}>
          <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-contain" style={{ transform: mirror ? "scaleX(-1)" : undefined }} />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center">
            <div aria-live="polite" className="rounded-full border border-white/15 bg-[#1a0505]/75 px-4 py-1.5 text-center text-xs font-medium text-white shadow-sm backdrop-blur-md sm:text-sm">
              {step === "starting" && "Menyalakan kamera dan memuat model deteksi…"}
              {step === "positioning" && posMsg}
              {step === "countdown" && `Bersiap… ${count}`}
              {step === "recording" && `Lakukan gerakan: ${protocol.phases.map((p) => p.label).join(" → ")} · ${Math.floor(elapsed)} dtk`}
              {step === "analyzing" && "Menganalisis gerakan…"}
            </div>
          </div>
          {step === "countdown" && (
            <div className="absolute inset-0 grid place-items-center bg-[#1a0505]/25 font-serif text-8xl font-bold text-white drop-shadow-md">
              {count}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {step === "recording" && (
          <button onClick={() => void finish()} disabled={elapsed < MIN_RECORD_S} className={primary}>
            <Square aria-hidden className="h-4 w-4" />
            Selesai, nilai gerakan
          </button>
        )}
        <button onClick={() => void stopAll()} className={secondary}>
          <CameraOff aria-hidden className="h-4 w-4" />
          Hentikan kamera
        </button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:border-[#fed7aa] hover:bg-[#fffaf5]">
          <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} className="h-4 w-4 accent-[#7c1d1d]" />
          Tampilan cermin
        </label>
      </div>
    </section>
  );
}

function ResultView({ result, protocol, loggedIn, onRetry, saveBreakdown, setSaveBreakdown, saved, onSave }: {
  result: AssessmentOutcome; protocol: Protocol; loggedIn: boolean; onRetry: () => void;
  saveBreakdown: boolean; setSaveBreakdown: (v: boolean) => void; saved: "idle" | "saving" | "saved" | "error"; onSave: () => void;
}) {
  if (result.status === "not_assessable") {
    return (
      <section className="space-y-4 rounded-[24px] border border-[#e7d7c8] bg-white p-6 shadow-xs sm:p-7" data-testid="assess" data-step="result" data-status="not_assessable">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <AlertTriangle aria-hidden className="h-5 w-5" />
          </span>
          <h2 className="font-serif text-2xl text-[#2e0909]">Gerakan belum dapat dinilai</h2>
        </div>
        <p className="text-slate-700">{result.message}</p>
        <p className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Kualitas masukan: {Math.round(result.input_quality * 100)}%. Skor tidak diberikan agar tidak menyesatkan.
        </p>
        <div>
          <button onClick={onRetry} className={primary}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      </section>
    );
  }
  const tone = result.total_score >= 80 ? "text-[#6d1b11]" : result.total_score >= 50 ? "text-[#9a3412]" : "text-red-700";
  const fmt = (v: number | null, unit: string) => (v === null ? "-" : unit === "deg" ? `${Math.round(v)}°` : v.toFixed(2).replace(".", ","));
  const fmtT = (t: number | [number, number], unit: string) => (Array.isArray(t) ? `${fmt(t[0], unit)}–${fmt(t[1], unit)}` : fmt(t, unit));
  return (
    <section className="space-y-6" data-testid="assess" data-step="result" data-status="scored">
      <div className="grid gap-5 rounded-[24px] border border-[#e7d7c8] bg-white p-6 shadow-xs sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="rounded-2xl border border-[#fed7aa] bg-[#fff6ee] px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9a3412]">Skor kesesuaian</p>
          <p className={`mt-1 font-serif text-6xl font-semibold ${tone}`} data-testid="total-score">{result.total_score}</p>
          <p className="mt-1 text-xs text-slate-600">dari 100</p>
        </div>
        <div className="space-y-2.5">
          <h2 className="font-serif text-2xl text-[#2e0909]">Saran perbaikan</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
            {result.suggestions.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <p className="text-xs text-slate-500">
            {result.best_phase && <>Fase terbaik: <strong className="text-slate-700">{result.best_phase}</strong>. </>}
            {result.weakest_phase && <>Perlu diperbaiki: <strong className="text-slate-700">{result.weakest_phase}</strong>. </>}
            Kualitas masukan {Math.round(result.input_quality * 100)}% · {result.frames_analyzed} frame · {result.duration_s.toString().replace(".", ",")} dtk.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="border-b border-slate-100 px-5 py-3.5 text-left font-serif text-base font-semibold text-[#2e0909]">
            Rincian per kriteria
          </caption>
          <thead className="bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Kriteria</th>
              <th className="px-4 py-3">Panduan</th>
              <th className="px-4 py-3">Terukur</th>
              <th className="px-4 py-3">Bobot</th>
              <th className="px-5 py-3">Skor</th>
            </tr>
          </thead>
          <tbody>
            {result.criteria.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    {c.status === "ok" ? (
                      <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0 text-[#6d1b11]" />
                    ) : c.status === "unmeasured" ? (
                      <CircleDashed aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <AlertTriangle aria-hidden className="h-4 w-4 shrink-0 text-amber-600" />
                    )}
                    {c.label}
                  </span>
                  <span className="mt-0.5 block pl-6 text-xs text-slate-500">{c.feedback}</span>
                </td>
                <td className="px-4 py-3.5 tabular-nums text-slate-700">{fmtT(c.target, c.unit)} (±{fmt(c.tolerance, c.unit)})</td>
                <td className="px-4 py-3.5 tabular-nums text-slate-700">{fmt(c.actual, c.unit)}</td>
                <td className="px-4 py-3.5 tabular-nums text-slate-600">{c.weight}</td>
                <td className="px-5 py-3.5 font-semibold tabular-nums text-[#2e0909]">{c.score ?? "tidak terukur"}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-100 bg-slate-50/40">
              <td className="px-5 py-3.5 font-medium text-slate-800">Kelengkapan fase</td>
              <td className="px-4 py-3.5 text-slate-700" colSpan={2}>{result.phases.filter((p) => p.detected).length}/{result.phases.length} fase terlihat</td>
              <td className="px-4 py-3.5 tabular-nums text-slate-600">{protocol.phase_completion_weight}</td>
              <td className="px-5 py-3.5" />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
        {result.phases.map((p) => (
          <span
            key={p.keyframe}
            className={`rounded-full border px-3.5 py-1.5 font-medium ${
              p.detected
                ? "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]"
                : "border-red-200 bg-red-50/70 text-red-700"
            }`}
          >
            {p.label}: {p.detected ? (p.score !== null ? `${p.score}` : "terlihat") : "belum terlihat"}{p.tempo_ratio ? ` · tempo ${p.tempo_ratio.toString().replace(".", ",")}×` : ""}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onRetry} className={primary}>
          <RotateCcw aria-hidden className="h-4 w-4" />
          Coba lagi
        </button>
        {loggedIn ? (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-xs">
              <input type="checkbox" checked={saveBreakdown} onChange={(e) => setSaveBreakdown(e.target.checked)} className="h-4 w-4 accent-[#7c1d1d]" />
              Simpan juga rincian per kriteria
            </label>
            <button onClick={onSave} disabled={saved === "saving" || saved === "saved"} className={secondary}>
              {saved === "saved" ? "Tersimpan di riwayat" : saved === "saving" ? "Menyimpan…" : "Simpan ke riwayat"}
            </button>
            {saved === "saved" && <Link className="text-sm font-medium text-[#6d1b11] underline" href="/app/latihan/riwayat">Lihat riwayat</Link>}
            {saved === "error" && <span role="alert" className="text-sm font-medium text-red-700">Gagal menyimpan. Coba lagi.</span>}
          </>
        ) : (
          <p className="text-sm text-slate-600"><Link className="font-medium text-[#6d1b11] underline" href="/masuk">Masuk</Link> untuk menyimpan riwayat dan melihat perkembangan Anda.</p>
        )}
      </div>
      <p className="text-xs text-slate-500">{protocol.disclaimer} Protokol {result.protocol_version} · mesin {result.engine_version}.</p>
    </section>
  );
}
