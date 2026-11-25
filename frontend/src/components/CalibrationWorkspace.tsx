"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Trash2 } from "lucide-react";
import { Notice } from "@/components/Notice";
import { btnGhost, btnPrimary, Field, inputCls } from "@/components/studio/bits";
import { fixtureFrame, FIXTURE_DURATION_MS, FIXTURE_KEY, FIXTURE_LABEL, FIXTURE_MODEL_VERSION } from "@/features/calibration/fixture";
import { ReferenceFrameDetector } from "@/features/calibration/frame-detector";
import { clampMs, formatTimeMs, markerNear, msToPct, posToMs, segmentAt, segments, sortMarkers, stepFrame } from "@/features/calibration/timeline";
import type { AsyncLandmarkerAdapter, InitInfo } from "@/features/practice/async-adapter";
import { DEFAULT_INFERENCE_CONFIG, type InferenceConfig } from "@/features/practice/config";
import type { LandmarkFrame } from "@/features/practice/landmarks";
import { drawSkeleton, fitVideoBox, type Size } from "@/features/practice/skeleton";
import { WorkerLandmarkerAdapter } from "@/features/practice/worker-adapter";
import { clientRequest } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { describeError } from "@/lib/studio-api";
import type { InstructorAnnotation, Role, StudioMedia, StudioPhase } from "@/lib/types";

const CFG: InferenceConfig = { ...DEFAULT_INFERENCE_CONFIG, hands: false, maxPeople: 1, minIntervalMs: 0, maxFrameAgeMs: 4000 };
const FIXTURE = "fixture";
type Engine = "off" | "loading" | "ready" | "error";
type Msg = { kind: "success" | "error"; text: string } | null;

/** Selesaikan durasi untuk webm hasil MediaRecorder yang melaporkan Infinity. */
async function resolveDuration(v: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(v.duration) && v.duration > 0) return v.duration * 1000;
  return new Promise((resolve) => {
    const done = () => { v.removeEventListener("timeupdate", done); const d = Number.isFinite(v.duration) ? v.duration * 1000 : 0; v.currentTime = 0; resolve(d); };
    v.addEventListener("timeupdate", done);
    v.currentTime = 1e6;
  });
}

export function CalibrationWorkspace({ movementId, movementName, isDemo, media, phases, initialAnnotations, viewerId, viewerRole, initialSource, createAdapter }: {
  movementId: string; movementName: string; isDemo: boolean; media: StudioMedia[]; phases: StudioPhase[]; initialAnnotations: InstructorAnnotation[];
  viewerId: string; viewerRole: Role; initialSource?: string; createAdapter?: (cfg: InferenceConfig) => AsyncLandmarkerAdapter;
}) {
  const videos = media.filter((m) => m.kind === "video" && !["rejected", "revoked"].includes(m.consent_status));
  const [source, setSource] = useState<string>(initialSource && (initialSource === FIXTURE || videos.some((v) => v.id === initialSource)) ? initialSource : videos[0]?.id ?? FIXTURE);
  const isFixture = source === FIXTURE;
  const current = videos.find((v) => v.id === source) ?? null;
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [durationMs, setDurationMs] = useState(isFixture ? FIXTURE_DURATION_MS : 0);
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [layout, setLayout] = useState<"side" | "stack">("side");
  const [engine, setEngine] = useState<Engine>("off");
  const [engineInfo, setEngineInfo] = useState<InitInfo | null>(null);
  const [engineMsg, setEngineMsg] = useState<string | null>(null);
  const [detectNote, setDetectNote] = useState<string | null>(null);
  const [detFrame, setFrame] = useState<LandmarkFrame | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [phaseId, setPhaseId] = useState("");
  const [busy, setBusy] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const detector = useRef<ReferenceFrameDetector | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fixtureTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [box, setBox] = useState<Size>({ width: 480, height: 360 });

  const frame = useMemo(() => (source === FIXTURE ? fixtureFrame(timeMs) : detFrame), [source, timeMs, detFrame]);
  const markers = useMemo(() => sortMarkers(annotations.filter((a) => (isFixture ? a.fixture_key === FIXTURE_KEY : a.media_id === source))), [annotations, isFixture, source]);
  const segs = useMemo(() => segments(markers, durationMs), [markers, durationMs]);
  const seg = segmentAt(segs, timeMs);
  const near = markerNear(markers, timeMs, 90);

  // ---- ukuran area ----
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const upd = () => {
      const v = videoRef.current;
      const w = layout === "side" ? Math.max(200, (el.clientWidth - 16) / 2) : el.clientWidth;
      setBox(isFixture || !v?.videoWidth ? { width: w, height: w * 0.75 } : fitVideoBox(v.videoWidth, v.videoHeight, w, 420));
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout, isFixture, source, durationMs]);

  // ---- gambar overlay ----
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(box.width * dpr); c.height = Math.round(box.height * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    if (frame) drawSkeleton(ctx, frame, box, { minVisibility: 0.5 });
  }, [frame, box]);

  // ---- fixture: timeline sintetis (tanpa video, tanpa model); frame diturunkan dari waktu ----
  useEffect(() => {
    if (!isFixture || !playing) return;
    const t0 = performance.now() - timeMs / speed;
    fixtureTimer.current = setInterval(() => {
      const t = (performance.now() - t0) * speed;
      if (t >= FIXTURE_DURATION_MS) { setTimeMs(FIXTURE_DURATION_MS); setPlaying(false); } else setTimeMs(t);
    }, 33);
    return () => { if (fixtureTimer.current) clearInterval(fixtureTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFixture, playing, speed]);

  function changeSource(next: string) {
    setPlaying(false); setTimeMs(0); setFrame(null);
    setDurationMs(next === FIXTURE ? FIXTURE_DURATION_MS : 0);
    setSource(next);
  }

  // ---- engine MediaPipe (hanya atas permintaan; berjalan di Web Worker) ----
  async function enableEngine() {
    if (detector.current) return;
    setEngine("loading"); setEngineMsg(null);
    const adapter = createAdapter ? createAdapter(CFG) : new WorkerLandmarkerAdapter(CFG);
    const d = new ReferenceFrameDetector(adapter, (f) => setFrame(f), undefined, undefined, undefined, (m) => setDetectNote(m));
    detector.current = d;
    try {
      const info = await adapter.init();
      setEngineInfo(info); setEngine("ready");
      if (videoRef.current) void d.detect(videoRef.current, CFG);
    } catch (e) {
      detector.current = null;
      await d.dispose().catch(() => undefined);
      setEngine("error"); setEngineMsg(e instanceof Error ? e.message : "Mesin deteksi gagal dimuat.");
    }
  }
  useEffect(() => () => { void detector.current?.dispose(); detector.current = null; }, []);
  const requestDetect = useCallback(() => { const v = videoRef.current; if (detector.current && v) void detector.current.detect(v, CFG); }, []);

  // ---- video: sinkron waktu + deteksi per frame saat diputar ----
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isFixture) return;
    let h = 0;
    const rv = v as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number; cancelVideoFrameCallback?: (h: number) => void };
    const loop = () => {
      setTimeMs(Math.round(v.currentTime * 1000));
      requestDetect();
      if (!v.paused && !v.ended) h = rv.requestVideoFrameCallback ? rv.requestVideoFrameCallback(loop) : requestAnimationFrame(loop);
    };
    const onPlay = () => { setPlaying(true); h = rv.requestVideoFrameCallback ? rv.requestVideoFrameCallback(loop) : requestAnimationFrame(loop); };
    const onPause = () => { setPlaying(false); setTimeMs(Math.round(v.currentTime * 1000)); requestDetect(); };
    const onSeeked = () => { setTimeMs(Math.round(v.currentTime * 1000)); requestDetect(); };
    const onMeta = async () => { setDurationMs(await resolveDuration(v)); setTimeMs(0); requestDetect(); };
    v.addEventListener("play", onPlay); v.addEventListener("pause", onPause); v.addEventListener("ended", onPause);
    v.addEventListener("seeked", onSeeked); v.addEventListener("loadedmetadata", onMeta); v.addEventListener("loadeddata", requestDetect);
    if (v.readyState >= 1) void onMeta();
    return () => {
      v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause); v.removeEventListener("ended", onPause);
      v.removeEventListener("seeked", onSeeked); v.removeEventListener("loadedmetadata", onMeta); v.removeEventListener("loadeddata", requestDetect);
      if (h) { if (rv.cancelVideoFrameCallback) rv.cancelVideoFrameCallback(h); else cancelAnimationFrame(h); }
    };
  }, [isFixture, source, requestDetect]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed, source]);

  // ---- kontrol ----
  function seek(ms: number) {
    const t = clampMs(ms, durationMs);
    setTimeMs(t);
    if (!isFixture && videoRef.current) videoRef.current.currentTime = t / 1000;
  }
  function toggle() {
    if (isFixture) { if (!playing && timeMs >= FIXTURE_DURATION_MS) setTimeMs(0); setPlaying((p) => !p); return; }
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play(); else v.pause();
  }
  function step(dir: 1 | -1) { if (playing) { if (isFixture) setPlaying(false); else videoRef.current?.pause(); } seek(stepFrame(timeMs, dir, durationMs)); }
  function onTimelineKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Home") { e.preventDefault(); seek(0); } else if (e.key === "End") { e.preventDefault(); seek(durationMs); }
  }

  // ---- anotasi ----
  async function addMarker(e: React.FormEvent) {
    e.preventDefault();
    const text = label.trim() || phases.find((p) => p.id === phaseId)?.name || "";
    if (!text) return setMsg({ kind: "error", text: "Beri label atau pilih fase untuk penanda." });
    setBusy(true); setMsg(null);
    const usedModel = isFixture ? FIXTURE_MODEL_VERSION : engine === "ready" && engineInfo ? `mediapipe-tasks-vision ${engineInfo.library}` : null;
    const r = await clientRequest<InstructorAnnotation>("POST", `/studio/movements/${movementId}/annotations`, {
      ...(isFixture ? { fixture_key: FIXTURE_KEY } : { media_id: source }), phase_id: phaseId || undefined, kind: "phase_marker",
      timestamp_ms: Math.round(timeMs), label: text, note: note.trim() || undefined, model_version: usedModel ?? undefined,
      source_note: isFixture ? FIXTURE_LABEL : `Media: ${current?.title ?? source}` });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setAnnotations((a) => [...a, r.data]); setLabel(""); setNote("");
    setMsg({ kind: "success", text: `Penanda di ${formatTimeMs(r.data.timestamp_ms)} disimpan (menunggu tinjauan).` });
  }
  async function review(a: InstructorAnnotation, status: "accepted" | "rejected") {
    const r = await clientRequest<InstructorAnnotation>("PATCH", `/studio/annotations/${a.id}`, { review_status: status });
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setAnnotations((x) => x.map((y) => (y.id === a.id ? r.data : y)));
  }
  async function remove(a: InstructorAnnotation) {
    const r = await clientRequest("DELETE", `/studio/annotations/${a.id}`);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setAnnotations((x) => x.filter((y) => y.id !== a.id));
  }

  const noBody = frame && frame.poses.length === 0;
  const overlayLabel = isFixture ? FIXTURE_LABEL : engine === "ready" ? `MediaPipe Pose (${engineInfo?.library ?? "-"}), di Web Worker` : engine === "loading" ? "Memuat model…" : "Overlay belum diaktifkan";

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-bronze-700">Movement Calibration Workspace</p>
        <h1 className="font-serif text-3xl text-forest-900">{movementName}{isDemo && <span className="ml-3 align-middle text-sm font-normal text-slate-600">[DEMO]</span>}</h1>
        <p className="mt-3 max-w-3xl rounded-xl border border-line-200 bg-parchment-100 px-4 py-3 text-sm text-slate-600">
          Ruang kerja untuk menandai fase dan timestamp pada video referensi. Penanda disimpan sebagai <strong className="text-ink-950">instructor reference annotation</strong>, bukan ground truth ilmiah dan bukan label akurasi.
          Tidak ada skor, ambang, kemiripan, atau koreksi otomatis di sini. Overlay dihitung di peramban dan tidak disimpan.
        </p>
      </header>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

      <div className="flex flex-wrap items-end gap-4">
        <Field id="cal-source" label="Sumber referensi">
          <select id="cal-source" value={source} onChange={(e) => changeSource(e.target.value)} className={inputCls}>
            {videos.map((v) => <option key={v.id} value={v.id}>{v.is_demo ? "[DEMO] " : ""}{v.title}, {v.consent_label}</option>)}
            <option value={FIXTURE}>{FIXTURE_LABEL}</option>
          </select></Field>
        <fieldset className="flex gap-4 pb-2.5"><legend className="sr-only">Tata letak perbandingan</legend>
          {(["side", "stack"] as const).map((l) => <label key={l} className="inline-flex items-center gap-1.5 text-sm"><input type="radio" name="layout" checked={layout === l} onChange={() => setLayout(l)} />{l === "side" ? "Berdampingan" : "Overlay di atas video"}</label>)}</fieldset>
        {!isFixture && engine === "off" && <button onClick={enableEngine} className={btnPrimary}>Aktifkan overlay MediaPipe</button>}
      </div>
      {videos.length === 0 && <p className="text-sm text-slate-600">Belum ada video referensi berizin untuk gerakan ini. Anda dapat mengunggahnya di bagian Media referensi (dengan deklarasi hak), atau mencoba antarmuka dengan fixture sintetis berlabel [DEMO].</p>}
      {current && current.consent_status === "declared" && <p role="note" className="text-sm text-slate-600">Izin video ini baru dideklarasikan dan belum diverifikasi; hanya anggota mitra, kurator, dan admin yang dapat melihatnya.</p>}
      {engine === "error" && <p role="alert" className="text-sm text-clay-600">Overlay gagal dimuat: {engineMsg}. Video tetap dapat diputar dan ditandai tanpa overlay.</p>}

      <div ref={boxRef} className={layout === "side" ? "grid gap-4 md:grid-cols-2" : ""}>
        <figure className="min-w-0">
          <figcaption className="mb-1 text-sm font-medium">Video referensi</figcaption>
          <div className="relative overflow-hidden rounded-xl bg-ink-950" style={{ width: layout === "stack" ? box.width : undefined, aspectRatio: layout === "side" ? `${box.width} / ${box.height}` : undefined, height: layout === "stack" ? box.height : undefined }}>
            {isFixture ? <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-paper-50/80">{FIXTURE_LABEL}. Tidak ada video, hanya kerangka sintetis untuk menguji timeline dan penanda.</p>
                : current ? <video ref={videoRef} key={current.id} src={current.url} preload="auto" playsInline muted className="h-full w-full object-contain" aria-label={`Video referensi: ${current.title}`} /> : null}
            {layout === "stack" && <canvas ref={canvasRef} aria-label="Overlay kerangka" role="img" className="pointer-events-none absolute inset-0 h-full w-full" />}
          </div>
        </figure>
        {layout === "side" && (
          <figure className="min-w-0">
            <figcaption className="mb-1 text-sm font-medium">Overlay kerangka</figcaption>
            <div className="relative overflow-hidden rounded-xl border border-line-200 bg-paper-50" style={{ aspectRatio: `${box.width} / ${box.height}` }}>
              <canvas ref={canvasRef} aria-label="Overlay kerangka MediaPipe" role="img" className="absolute inset-0 h-full w-full" />
            </div>
          </figure>)}
      </div>
      <p aria-live="polite" className="text-sm text-slate-600">{overlayLabel}{noBody ? " · Tidak ada tubuh terdeteksi pada frame ini." : ""}{frame && frame.poses.length > 1 ? " · Lebih dari satu tubuh terdeteksi." : ""}{detectNote ? ` · ${detectNote}` : ""}</p>

      <section aria-label="Kontrol putar dan timeline" className="rounded-2xl border border-line-200 bg-paper-50 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={() => step(-1)} aria-label="Mundur satu frame" className={btnGhost}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
          <button onClick={toggle} aria-label={playing ? "Jeda" : "Putar"} disabled={!isFixture && !current} className={btnPrimary}>{playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}</button>
          <button onClick={() => step(1)} aria-label="Maju satu frame" className={btnGhost}><ChevronRight aria-hidden className="h-4 w-4" /></button>
          <output aria-label="Waktu saat ini" className="font-mono text-sm tabular-nums">{formatTimeMs(timeMs)} / {formatTimeMs(durationMs)}</output>
          <label className="ml-auto inline-flex items-center gap-2 text-sm">Kecepatan
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-lg border border-line-200 bg-paper-50 px-2 py-1">{[0.25, 0.5, 1].map((s) => <option key={s} value={s}>{s}×</option>)}</select></label>
        </div>
        <div ref={timelineRef} role="slider" tabIndex={0} aria-label="Timeline referensi" aria-valuemin={0} aria-valuemax={durationMs} aria-valuenow={timeMs} aria-valuetext={formatTimeMs(timeMs)}
          onKeyDown={onTimelineKey} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(posToMs(e.clientX - r.left, r.width, durationMs)); }}
          className="relative h-10 cursor-pointer rounded-lg bg-line-200">
          {segs.map((s, i) => <div key={s.startMarkerId} aria-hidden className={`absolute inset-y-0 ${i % 2 ? "bg-sage-500/30" : "bg-bronze-500/25"}`} style={{ left: `${msToPct(s.fromMs, durationMs)}%`, width: `${msToPct(s.toMs - s.fromMs, durationMs)}%` }} />)}
          {markers.map((m) => <span key={m.id} aria-hidden title={`${formatTimeMs(m.timestamp_ms)}, ${m.label}`} className={`absolute inset-y-0 w-0.5 ${m.review_status === "accepted" ? "bg-forest-700" : m.review_status === "rejected" ? "bg-clay-600" : "bg-bronze-700"}`} style={{ left: `${msToPct(m.timestamp_ms, durationMs)}%` }} />)}
          <span aria-hidden className="absolute inset-y-0 w-1 -translate-x-1/2 rounded bg-ink-950" style={{ left: `${msToPct(timeMs, durationMs)}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-600" aria-live="polite">{seg ? `Segmen saat ini: “${seg.label}” (${formatTimeMs(seg.fromMs)}–${formatTimeMs(seg.toMs)})` : "Belum ada segmen pada posisi ini."}{near ? ` · di dekat penanda “${near.label}”` : ""}</p>
        <p className="mt-1 text-xs text-slate-600">Langkah frame bersifat nominal (≈ 1/30 detik) dan tidak mengukur fps klip. Tombol panah kiri/kanan pada timeline = satu langkah.</p>

        <form onSubmit={addMarker} className="mt-5 grid gap-3 border-t border-line-200 pt-4 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Tandai fase pada {formatTimeMs(timeMs)}</h2>
          <Field id="m-phase" label="Fase (opsional)"><select id="m-phase" value={phaseId} onChange={(e) => setPhaseId(e.target.value)} className={inputCls}><option value="">Tanpa fase</option>{phases.filter((p) => p.id).map((p, i) => <option key={p.id} value={p.id}>{i + 1}. {p.name}</option>)}</select></Field>
          <Field id="m-label" label="Label penanda" hint="Mis. “awal fase 2”."><input id="m-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} className={inputCls} /></Field>
          <div className="sm:col-span-2"><Field id="m-note" label="Catatan (opsional)"><input id="m-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><button disabled={busy} className={btnPrimary}>{busy ? "Menyimpan…" : "Simpan penanda"}</button></div>
        </form>
      </section>

      <section aria-labelledby="ann-h">
        <h2 id="ann-h" className="mb-3 font-serif text-xl text-forest-900">Anotasi referensi instruktur ({markers.length})</h2>
        {markers.length === 0 ? <p className="text-sm text-slate-600">Belum ada penanda untuk sumber ini.</p> : (
          <div className="overflow-x-auto rounded-2xl border border-line-200 bg-paper-50">
            <table className="w-full text-left text-sm"><caption className="sr-only">Anotasi referensi instruktur</caption>
              <thead className="border-b border-line-200 text-slate-600"><tr><th scope="col" className="px-4 py-3">Waktu</th><th scope="col" className="px-4 py-3">Label</th><th scope="col" className="px-4 py-3">Provenance</th><th scope="col" className="px-4 py-3">Status tinjauan</th><th scope="col" className="px-4 py-3"><span className="sr-only">Aksi</span></th></tr></thead>
              <tbody className="divide-y divide-line-200">{markers.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-mono tabular-nums"><button onClick={() => seek(a.timestamp_ms)} className="underline">{formatTimeMs(a.timestamp_ms)}</button></td>
                  <td className="px-4 py-3">{a.label}{a.note && <span className="block text-xs text-slate-600">{a.note}</span>}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{a.annotator ?? "-"} · {formatDateTime(a.created_at)}<br />Model: {a.model_version ?? "tanpa overlay"}<br />{a.source_note}</td>
                  <td className="px-4 py-3">{a.review_status === "pending" ? "Menunggu tinjauan" : a.review_status === "accepted" ? `Diterima (${a.reviewed_by ?? "-"})` : `Ditolak (${a.reviewed_by ?? "-"})`}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2">
                    {a.annotator_user_id !== viewerId && a.review_status !== "accepted" && <button onClick={() => review(a, "accepted")} className="underline">Terima</button>}
                    {a.annotator_user_id !== viewerId && a.review_status !== "rejected" && <button onClick={() => review(a, "rejected")} className="underline">Tolak</button>}
                    {(a.annotator_user_id === viewerId || viewerRole !== "instructor") && <button aria-label={`Hapus penanda ${a.label}`} onClick={() => remove(a)} className="text-clay-600"><Trash2 aria-hidden className="h-4 w-4" /></button>}</div></td>
                </tr>))}</tbody></table></div>)}
        <p className="mt-2 text-xs text-slate-600">“Diterima” berarti peninjau setuju penanda sesuai arahan instruktur, bukan pernyataan bahwa gerakan benar atau akurat secara teknis.</p>
      </section>
    </div>
  );
}
