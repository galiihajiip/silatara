"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Activity, Camera, CameraOff, CheckCircle2, Cpu, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import {
  CAMERA_MESSAGES,
  CameraController,
  cameraReducer,
  INITIAL_CAMERA_STATE,
  isStarted,
} from "@/features/practice/camera";
import type { AsyncLandmarkerAdapter, InitInfo } from "@/features/practice/async-adapter";
import { DEFAULT_INFERENCE_CONFIG, type InferenceConfig } from "@/features/practice/config";
import { POSE_CONNECTIONS } from "@/features/practice/landmarks";
import { nowMs } from "@/features/practice/metrics";
import { createFrameBitmap, FramePump, makeFrameScheduler } from "@/features/practice/pipeline";
import {
  assessFrameQuality,
  guidanceFor,
  QualityWindow,
  type FrameQuality,
} from "@/features/practice/quality-gate";
import { ResponsivenessMonitor } from "@/features/practice/responsiveness";
import { WorkerLandmarkerAdapter } from "@/features/practice/worker-adapter";
import { Sparkline } from "@/components/Sparkline";

type Detect = "off" | "loading" | "on" | "error";
type WorkerState = "loading" | "ready" | "paused" | "disposed" | null;

interface Snapshot {
  info: InitInfo | null;
  workerState: WorkerState;
  submitted: number;
  processed: number;
  droppedBackpressure: number;
  droppedByWorker: number;
  lost: number;
  errors: number;
  latency: {
    n: number;
    mean: number | null;
    median: number | null;
    p95: number | null;
    recent: number[];
  };
  procMean: number | null;
  posesFrames: number;
  handsFrames: number;
  gap: {
    max: number | null;
    p95: number | null;
    longTasks: number;
    longTaskSupported: boolean;
    lagMax: number | null;
    lagP95: number | null;
  };
  video: { w: number | null; h: number | null };
}

const fmt = (n: number | null, d = 1) => (n === null ? "-" : n.toFixed(d));

function formatSystemReadiness(workerState: WorkerState): string {
  if (workerState === "ready") return "Siap digunakan";
  if (workerState === "paused") return "Dijeda sementara (tab tidak aktif)";
  if (workerState === "loading") return "Sedang menyiapkan…";
  return "Berhenti";
}

function formatDeviceDelegate(delegate: string | null | undefined): string {
  const upper = (delegate ?? "").toUpperCase();
  if (upper === "GPU") return "Akselerasi grafis (GPU)";
  if (upper === "CPU") return "Prosesor standar (CPU)";
  return delegate || "Otomatis di perangkat";
}

function formatLoadTime(info: InitInfo | null): string {
  if (!info) return "-";
  const total = info.initMs;
  if (total >= 1000) return `${(total / 1000).toFixed(1)} detik`;
  return `${Math.round(total)} ms`;
}

function formatCameraSpeed(meanMs: number | null): { status: string; detail: string } {
  if (meanMs === null) return { status: "Mengukur…", detail: "Menunggu beberapa gambar pertama" };
  const rounded = Math.round(meanMs);
  if (meanMs <= 90) return { status: "Sangat lancar", detail: `Sekitar ${rounded} ms per gambar` };
  if (meanMs <= 180) return { status: "Cukup baik", detail: `Sekitar ${rounded} ms per gambar` };
  return { status: "Agak lambat", detail: `Sekitar ${rounded} ms per gambar` };
}

function formatScreenSmoothness(gap: Snapshot["gap"]): { status: string; detail: string } {
  const lag = gap.lagP95 ?? 0;
  if (lag <= 50 && gap.longTasks === 0) {
    return {
      status: "Layar tetap mulus",
      detail: "Halaman tetap responsif tanpa tersendat saat kamera bekerja.",
    };
  }
  return {
    status: "Halaman tetap responsif",
    detail: "Deteksi berjalan di latar belakang sehingga tombol tetap mudah ditekan.",
  };
}

export function CameraCheck({
  createAdapter,
  config,
}: {
  createAdapter?: (cfg: InferenceConfig) => AsyncLandmarkerAdapter;
  config?: Partial<InferenceConfig>;
}) {
  const cfg: InferenceConfig = { ...DEFAULT_INFERENCE_CONFIG, ...config };
  const cfgRef = useRef(cfg);
  const [state, dispatch] = useReducer(cameraReducer, INITIAL_CAMERA_STATE);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [detect, setDetect] = useState<Detect>("off");
  const [detectError, setDetectError] = useState<string | null>(null);
  const [quality, setQuality] = useState<{ q: FrameQuality; stable: boolean } | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrl = useRef<CameraController | null>(null);
  const adapter = useRef<AsyncLandmarkerAdapter | null>(null);
  const pump = useRef<FramePump | null>(null);
  const monitor = useRef<ResponsivenessMonitor | null>(null);
  const win = useRef(new QualityWindow(15));
  const infoRef = useRef<InitInfo | null>(null);
  const workerStateRef = useRef<WorkerState>(null);
  const generation = useRef(0); // membatalkan init yang tertunda bila pengguna berhenti/keluar
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const getCtrl = () => (ctrl.current ??= new CameraController());

  const stopDetection = useCallback(async () => {
    generation.current += 1;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    pump.current?.stop();
    pump.current = null;
    monitor.current?.stop();
    monitor.current = null;
    const a = adapter.current;
    adapter.current = null;
    await a?.dispose(); // menghentikan worker + melepas handler
    infoRef.current = null;
    workerStateRef.current = null;
    win.current.reset();
    canvasRef.current
      ?.getContext("2d")
      ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSnap(null);
    setQuality(null);
    setDetect("off");
  }, []);

  const stopAll = useCallback(async () => {
    await stopDetection();
    getCtrl().stop();
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [stopDetection]);

  // Hentikan worker + kamera saat keluar halaman / tab ditutup / komponen dilepas.
  useEffect(() => {
    const onHide = () => {
      void stopAll();
      dispatch({ type: "stop" });
    };
    // Jeda inferensi (bukan kamera) saat tab tidak terlihat; lanjutkan saat terlihat.
    const onVisibility = () => {
      if (cfgRef.current.pauseWhenHidden) pump.current?.setPaused(document.hidden);
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      void stopAll();
    };
  }, [stopAll]);

  async function start() {
    dispatch({ type: "request" });
    const r = await getCtrl().start(deviceId || undefined);
    if (!isStarted(r)) return dispatch(r);
    if (videoRef.current) {
      videoRef.current.srcObject = r.stream;
      await videoRef.current.play().catch(() => undefined);
    }
    dispatch({ type: "granted", deviceId: r.deviceId, label: r.label });
    setDevices(await getCtrl().listVideoDevices());
  }

  function stop() {
    void stopAll();
    dispatch({ type: "stop" });
  }

  function draw(lm: { x: number; y: number }[], w: number, h: number) {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    c.width = w;
    c.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#B9854F";
    ctx.fillStyle = "#FCFBF7";
    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      if (!lm[a] || !lm[b]) continue;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
      ctx.stroke();
    }
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  async function toggleDetect() {
    if (detect === "on" || detect === "loading") return stopDetection();
    const video = videoRef.current;
    if (!video) return;
    const gen = ++generation.current;
    setDetect("loading");
    setDetectError(null);
    const a = createAdapter ? createAdapter(cfg) : new WorkerLandmarkerAdapter(cfg);
    adapter.current = a;
    const sched = makeFrameScheduler(video);
    const p = new FramePump({
      adapter: a,
      source: video,
      config: cfg,
      createBitmap: createFrameBitmap,
      now: nowMs,
      schedule: sched.schedule,
      cancel: sched.cancel,
      onResult: ({ frame }) => {
        const q = assessFrameQuality(frame);
        win.current.push(q);
        setQuality({ q, stable: win.current.stable });
        draw(frame.poses[0]?.landmarks ?? [], frame.meta.width, frame.meta.height);
      },
      onState: (s) => {
        workerStateRef.current = s;
      },
      onNonFatalError: () => undefined,
      onFatal: ({ message }) => {
        // Worker gagal/crash: tampilkan error. TIDAK ada fallback sinkron di main thread.
        setDetectError(message);
        void stopDetection().then(() => {
          setDetectError(message);
          setDetect("error");
        });
      },
    });
    pump.current = p;
    try {
      const info = await a.init();
      if (gen !== generation.current) {
        await a.dispose();
        return;
      } // dibatalkan saat memuat
      infoRef.current = info;
      workerStateRef.current = "ready";
      const m = new ResponsivenessMonitor();
      m.start();
      monitor.current = m;
      p.start();
      setDetect("on");
      const captureSnapshot = () => {
        const g = m.summary();
        setSnap({
          info: infoRef.current,
          workerState: workerStateRef.current,
          ...p.stats,
          latency: {
            n: p.latency.n,
            mean: p.latency.mean(),
            median: p.latency.median(),
            p95: p.latency.p95(),
            recent: p.latency.last(60),
          },
          procMean: p.proc.mean(),
          posesFrames: p.stats.posesDetectedFrames,
          handsFrames: p.stats.handsDetectedFrames,
          gap: {
            max: g.maxGapMs,
            p95: g.p95GapMs,
            longTasks: g.longTasks.count,
            longTaskSupported: g.longTasks.supported,
            lagMax: g.loopLag.maxMs,
            lagP95: g.loopLag.p95Ms,
          },
          video: { w: video.videoWidth || null, h: video.videoHeight || null },
        });
      };
      captureSnapshot();
      timer.current = setInterval(captureSnapshot, 500);
    } catch (e) {
      if (gen !== generation.current) return;
      await stopDetection();
      setDetectError(e instanceof Error ? e.message : "Model gagal dimuat.");
      setDetect("error");
    }
  }

  const active = state.status === "active";
  const label = state.status === "active" ? state.label : null;
  const synthetic = !!label && /fake|virtual|synthetic/i.test(label);
  const speedInfo = snap ? formatCameraSpeed(snap.latency.mean) : null;
  const smoothInfo = snap ? formatScreenSmoothness(snap.gap) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.28fr)_minmax(0,1fr)] lg:items-start">
      {/* Kolom Kiri / Utama: Pratinjau Kamera + Kontrol Aksi */}
      <div className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ink-950">
          <video
            ref={videoRef}
            muted
            playsInline
            aria-label="Pratinjau kamera"
            className="h-full w-full -scale-x-100 object-cover"
          />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-paper-50">
              <CameraOff aria-hidden className="h-7 w-7 text-[#fde68a]" />
              <p className="font-semibold">Kamera mati</p>
              <p className="max-w-xs text-xs text-slate-300">
                Tekan tombol di bawah saat Anda siap mencoba kamera perangkat ini.
              </p>
            </div>
          )}
        </div>

        {/* Status langsung tepat di bawah layar kamera */}
        <div
          role="status"
          aria-live="polite"
          className="mt-4 min-h-[1.5rem] rounded-2xl border border-[#ece2d8] bg-[#faf7f4] px-4 py-3 text-sm text-slate-700"
        >
          {state.status === "idle" && (
            <span>Kamera belum dinyalakan. Tekan tombol di bawah untuk memulai pemeriksaan.</span>
          )}
          {state.status === "requesting" && "Meminta izin kamera…"}
          {state.status === "denied" && (
            <span className="font-medium text-[#9a3412]">{CAMERA_MESSAGES.denied}</span>
          )}
          {state.status === "unavailable" && (
            <span className="font-medium text-[#9a3412]">{CAMERA_MESSAGES[state.reason]}</span>
          )}
          {state.status === "error" && (
            <span className="font-medium text-[#9a3412]">{state.message}</span>
          )}
          {state.status === "stopped" && "Kamera dihentikan."}
          {active && !quality && detect === "off" && (
            <span>
              Kamera aktif. Tekan <strong>Nyalakan deteksi landmark</strong> untuk memeriksa apakah
              seluruh tubuh terbaca jelas.
            </span>
          )}
          {detect === "loading" && (
            <span>Menyiapkan pendeteksi tubuh di latar belakang… Halaman tetap lancar dipakai.</span>
          )}
          {detect === "error" && (
            <span className="font-medium text-[#9a3412]" role="alert">
              Mesin landmark gagal: {detectError ?? "kesalahan tak dikenal"}. Kamera tetap dapat
              dipakai; coba nyalakan deteksi lagi atau muat ulang halaman. Tidak ada pemrosesan
              cadangan di thread utama.
            </span>
          )}
          {quality && (
            <p>
              <strong className="text-[#2e0909]">
                {quality.q.usable
                  ? quality.stable
                    ? "Siap dianalisis"
                    : "Menstabilkan…"
                  : "Belum dapat dianalisis"}
              </strong>
              {", "}
              {guidanceFor(quality.q)}{" "}
              <span className="text-slate-600">
                (keterlihatan titik tubuh utama: {Math.round(quality.q.requiredCoverage * 100)}%)
              </span>
            </p>
          )}
        </div>

        {/* Tombol kontrol utama */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          {!active && (
            <button
              type="button"
              onClick={start}
              disabled={state.status === "requesting"}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#3a0808] hover:to-[#9a3412] disabled:opacity-60"
            >
              <Camera aria-hidden className="h-4 w-4" />
              Saya mengerti, nyalakan kamera
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full bg-[#9a3412] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7c1d1d]"
            >
              <CameraOff aria-hidden className="h-4 w-4" />
              Hentikan kamera
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={toggleDetect}
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-[#6d1b11]/40 hover:bg-[#fff6ee]"
            >
              {detect === "on" || detect === "loading"
                ? "Matikan deteksi landmark"
                : "Nyalakan deteksi landmark"}
            </button>
          )}
          {devices.length > 1 && (
            <div className="min-w-[12rem]">
              <label htmlFor="cam" className="mb-1 block text-xs font-semibold text-slate-700">
                Pilih kamera
              </label>
              <select
                id="cam"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Bawaan</option>
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || d.deviceId}
                  </option>
                ))}
              </select>
              {active && (
                <p className="mt-1 text-xs text-slate-600">
                  Hentikan lalu nyalakan kembali untuk berganti kamera.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Info Privasi & Ringkasan Kondisi Perangkat yang Mudah Dipahami */}
      <div className="min-w-0 space-y-5">
        <section
          aria-labelledby="privasi"
          className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6"
        >
          <h2
            id="privasi"
            className="mb-2.5 flex items-center gap-2 text-base font-bold text-[#2e0909]"
          >
            <ShieldCheck aria-hidden className="h-5 w-5 shrink-0 text-[#6d1b11]" />
            <span>Privasi &amp; panduan singkat</span>
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
            <li>
              Kamera baru menyala setelah Anda menekan tombol di samping, dan dapat dimatikan kapan
              saja.
            </li>
            <li>
              Gambar diproses langsung <strong className="text-slate-800">di perangkat Anda</strong>.
              Video dan gambar <strong className="text-slate-800">tidak direkam, disimpan, atau dikirim</strong> ke
              server.
            </li>
            <li>
              Halaman ini hanya mengecek keterlihatan tubuh serta pencahayaan.{" "}
              <strong className="text-slate-800">Ini bukan penilaian gerakan</strong> dan bukan
              pengganti pelatih.
            </li>
            <li>Tidak ada pengenalan wajah dan mikrofon tidak digunakan.</li>
            <li>Berdirilah di ruang yang terang, lapang, dan aman sebelum mulai bergerak.</li>
          </ul>
        </section>

        {snap && speedInfo && smoothInfo ? (
          <section
            aria-labelledby="metrik"
            data-testid="cam-metrics"
            data-engine="worker"
            data-worker-state={snap.workerState ?? ""}
            data-init-ms={snap.info?.initMs ?? ""}
            data-startup-ms={snap.info?.startupMs ?? ""}
            data-delegate={snap.info?.delegate ?? ""}
            data-submitted={snap.submitted}
            data-frames={snap.processed}
            data-dropped-bp={snap.droppedBackpressure}
            data-dropped-worker={snap.droppedByWorker}
            data-errors={snap.errors}
            data-latency-mean={snap.latency.mean ?? ""}
            data-latency-median={snap.latency.median ?? ""}
            data-latency-p95={snap.latency.p95 ?? ""}
            data-proc-mean={snap.procMean ?? ""}
            data-gap-max={snap.gap.max ?? ""}
            data-gap-p95={snap.gap.p95 ?? ""}
            data-lag-max={snap.gap.lagMax ?? ""}
            data-lag-p95={snap.gap.lagP95 ?? ""}
            data-long-tasks={snap.gap.longTasks}
            data-video={`${snap.video.w ?? ""}x${snap.video.h ?? ""}`}
            data-poses-frames={snap.posesFrames}
            data-hands-frames={snap.handsFrames}
            className="space-y-4 rounded-[24px] border border-[#e7d7c8] bg-white p-5 text-sm shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6"
          >
            <div>
              <h2 id="metrik" className="text-base font-bold text-[#2e0909]">
                Kondisi kamera &amp; perangkat Anda
              </h2>
              <p className="mt-1 rounded-xl border border-[#fed7aa] bg-[#fff6ee] px-3 py-2 text-xs leading-relaxed text-slate-700">
                {synthetic
                  ? `Sumber kamera SINTETIS (${label}): hanya menguji jalur sistem, bukan deteksi manusia. `
                  : `Kamera aktif: ${label ?? "kamera bawaan"}. `}
                Informasi ini hanya menggambarkan kondisi perangkat saat ini; bukan FPS produk dan
                bukan ukuran akurasi gerakan.
              </p>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-[#6d1b11]" />
                  <span>Kesiapan Sistem</span>
                </dt>
                <dd className="mt-1 font-bold text-[#2e0909]">
                  {formatSystemReadiness(snap.workerState)}
                </dd>
              </div>

              <div className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Cpu aria-hidden className="h-3.5 w-3.5 text-[#6d1b11]" />
                  <span>Pemrosesan perangkat</span>
                </dt>
                <dd className="mt-1 font-bold text-[#2e0909]">
                  {formatDeviceDelegate(snap.info?.delegate)}
                </dd>
              </div>

              <div className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Sparkles aria-hidden className="h-3.5 w-3.5 text-[#9a3412]" />
                  <span>Waktu muat awal</span>
                </dt>
                <dd className="mt-1 font-bold text-[#2e0909]">{formatLoadTime(snap.info)}</dd>
              </div>

              <div className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Gauge aria-hidden className="h-3.5 w-3.5 text-[#9a3412]" />
                  <span>Kecepatan respons kamera</span>
                </dt>
                <dd className="mt-1 font-bold text-[#2e0909]">{speedInfo.status}</dd>
                <dd className="mt-0.5 text-xs text-slate-600">{speedInfo.detail}</dd>
              </div>

              <div className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5 sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Activity aria-hidden className="h-3.5 w-3.5 text-[#6d1b11]" />
                  <span>Kelancaran layar</span>
                </dt>
                <dd className="mt-1 font-bold text-[#2e0909]">{smoothInfo.status}</dd>
                <dd className="mt-0.5 text-xs text-slate-600">{smoothInfo.detail}</dd>
              </div>

              <div className="rounded-2xl border border-[#fed7aa]/80 bg-[#fffaf5] p-3.5 sm:col-span-2">
                <dt className="text-xs font-semibold text-[#9a3412]">Deteksi tubuh &amp; tangan</dt>
                <dd className="mt-1 font-bold text-[#2e0909]">
                  Tubuh terdeteksi {snap.posesFrames} kali · Tangan {snap.handsFrames} kali
                </dd>
                <dd className="mt-0.5 text-xs text-slate-600">
                  Dari {snap.processed} gambar kamera yang telah diperiksa sesi ini.
                </dd>
              </div>
            </dl>

            <details className="rounded-2xl border border-slate-200/80 bg-[#faf7f4] px-4 py-3">
              <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                Detail teknis lanjutan
              </summary>
              <div className="mt-3 space-y-2.5 border-t border-slate-200/80 pt-3 text-xs text-slate-700">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  <dt className="text-slate-600">Startup worker</dt>
                  <dd>{snap.info ? `${Math.round(snap.info.startupMs)} ms` : "-"}</dd>
                  <dt className="text-slate-600">Resolusi video</dt>
                  <dd className="break-words">
                    {snap.video.w ?? "-"}×{snap.video.h ?? "-"}
                    {cfg.maxFrameWidth ? ` (maks lebar ${cfg.maxFrameWidth})` : " (asli)"}
                  </dd>
                  <dt className="text-slate-600">Frame diproses / dikirim</dt>
                  <dd>
                    {snap.processed} / {snap.submitted}
                  </dd>
                  <dt className="text-slate-600">Frame dilewati / dibuang</dt>
                  <dd>
                    {snap.droppedBackpressure} / {snap.droppedByWorker} (hilang {snap.lost})
                  </dd>
                  <dt className="text-slate-600">Latensi frame (n={snap.latency.n})</dt>
                  <dd>
                    rata-rata {fmt(snap.latency.mean)} · median {fmt(snap.latency.median)} · p95{" "}
                    {fmt(snap.latency.p95)} ms
                  </dd>
                  <dt className="text-slate-600">Waktu inferensi worker</dt>
                  <dd>rata-rata {fmt(snap.procMean)} ms</dd>
                  <dt className="text-slate-600">Jeda layar &amp; antrean</dt>
                  <dd>
                    jeda rAF maks {fmt(snap.gap.max, 0)} ms (p95 {fmt(snap.gap.p95, 0)}) · jeda
                    event-loop maks {fmt(snap.gap.lagMax, 0)} ms (p95 {fmt(snap.gap.lagP95, 0)}) ·
                    long task {snap.gap.longTaskSupported ? snap.gap.longTasks : "tidak didukung"}
                  </dd>
                  <dt className="text-slate-600">Galat sistem</dt>
                  <dd>{snap.errors}</dd>
                </dl>
                <Sparkline values={snap.latency.recent} label="Tren latensi 60 frame terakhir" />
                <p className="text-slate-600">
                  Konfigurasi aktif: interval minimum {cfg.minIntervalMs} ms (≈
                  {Math.round(1000 / cfg.minIntervalMs)} fps maks), in-flight maks{" "}
                  {cfg.maxInFlight}, batas usia frame {cfg.maxFrameAgeMs} ms, maks {cfg.maxPeople}{" "}
                  orang, tangan {cfg.hands ? "aktif" : "mati"}, jeda saat tab tersembunyi{" "}
                  {cfg.pauseWhenHidden ? "ya" : "tidak"}.
                </p>
              </div>
            </details>
          </section>
        ) : (
          <section
            aria-label="Ringkasan pemeriksaan"
            className="rounded-[24px] border border-dashed border-slate-300/90 bg-white/80 p-5 text-sm text-slate-600 sm:p-6"
          >
            <p className="font-semibold text-[#2e0909]">Ringkasan kondisi perangkat</p>
            <p className="mt-1 leading-relaxed">
              Setelah kamera menyala dan tombol <strong>Nyalakan deteksi landmark</strong> ditekan,
              status kesiapan sistem, kecepatan respons kamera, serta jumlah deteksi tubuh dan
              tangan akan muncul di panel ini.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
