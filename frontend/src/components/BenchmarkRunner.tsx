"use client";
import { useEffect, useRef, useState } from "react";
import { CameraController, isStarted } from "@/features/practice/camera";
import { collectEnv, runBaselineMain, runWorker, summarizeRuns, type BenchEnv, type RunResult } from "@/features/practice/benchmark";
import { DEFAULT_INFERENCE_CONFIG } from "@/features/practice/config";

const fmt = (n: number | null | undefined, d = 1) => (n === null || n === undefined ? "-" : n.toFixed(d));

export function BenchmarkRunner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ctrl = useRef<CameraController | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [frames, setFrames] = useState(30);
  const [repeats, setRepeats] = useState(3);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<RunResult[]>([]);
  const [env, setEnv] = useState<BenchEnv | null>(null);
  const [busy, setBusy] = useState(false);
  const getCtrl = () => (ctrl.current ??= new CameraController());

  useEffect(() => () => { getCtrl().stop(); }, []);

  async function startCam() {
    const r = await getCtrl().start();
    if (!isStarted(r)) { setStatus("Kamera tidak dapat dimulai: " + r.type); return; }
    if (videoRef.current) { videoRef.current.srcObject = r.stream; await videoRef.current.play().catch(() => undefined); }
    setLabel(r.label); setActive(true); setStatus("Kamera aktif.");
  }
  function stopCam() { getCtrl().stop(); if (videoRef.current) videoRef.current.srcObject = null; setActive(false); }

  async function run() {
    const v = videoRef.current;
    if (!v || busy) return;
    setBusy(true); setResults([]);
    const cfg = DEFAULT_INFERENCE_CONFIG;
    const e = collectEnv(v, label, cfg, frames, repeats);
    setEnv(e);
    const acc: RunResult[] = [];
    for (let i = 1; i <= repeats; i++) {
      // A/B bergantian agar drift termal/beban tidak memihak satu mesin.
      const order = i % 2 ? (["main-thread-baseline", "worker"] as const) : (["worker", "main-thread-baseline"] as const);
      for (const eng of order) {
        setStatus(`Run ${i}/${repeats}: ${eng === "worker" ? "Web Worker" : "baseline main-thread (tab dapat membeku)"}…`);
        const o = { frames, cfg, timeoutMs: 180_000, run: i };
        acc.push(eng === "worker" ? await runWorker(v, o) : await runBaselineMain(v, o));
        setResults([...acc]);
      }
    }
    setStatus("Selesai."); setBusy(false);
  }

  const summary = summarizeRuns(results);
  const payload = env ? JSON.stringify({ environment: env, runs: results, summary, disclaimer: "Pengukuran jalur komputasi di perangkat ini; bukan akurasi, bukan FPS produk." }, null, 2) : "";
  const done = !busy && results.length === repeats * 2;
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-clay-600/30 bg-clay-600/5 p-4 text-sm">
        <p><strong>Peringatan:</strong> benchmark <em>baseline</em> menjalankan inferensi di thread utama dan dapat <strong>membekukan tab</strong> beberapa detik hingga puluhan detik di perangkat lambat. Itulah yang diukur. Kamera hanya menyala setelah Anda menekan tombol; tidak ada frame yang disimpan atau dikirim.</p>
      </section>
      <video ref={videoRef} muted playsInline aria-label="Pratinjau kamera benchmark" className="aspect-[4/3] w-full max-w-md rounded-2xl bg-ink-950 object-cover" />
      <div className="flex flex-wrap items-end gap-3">
        {!active ? <button onClick={startCam} className="rounded-xl bg-forest-700 px-5 py-3 font-medium text-paper-50">Saya mengerti, nyalakan kamera</button>
          : <button onClick={stopCam} disabled={busy} className="rounded-xl bg-clay-600 px-5 py-3 font-medium text-paper-50 disabled:opacity-60">Hentikan kamera</button>}
        <div><label htmlFor="frames" className="block text-sm">Frame per run</label><input id="frames" type="number" min={10} max={300} value={frames} onChange={(e) => setFrames(Number(e.target.value))} className="w-28 rounded-xl border border-line-200 bg-paper-50 px-3 py-2" /></div>
        <div><label htmlFor="repeats" className="block text-sm">Ulangan</label><input id="repeats" type="number" min={1} max={7} value={repeats} onChange={(e) => setRepeats(Number(e.target.value))} className="w-24 rounded-xl border border-line-200 bg-paper-50 px-3 py-2" /></div>
        <button onClick={run} disabled={!active || busy} className="rounded-xl border border-line-200 px-5 py-3 font-medium hover:bg-parchment-100 disabled:opacity-60">{busy ? "Berjalan…" : "Jalankan benchmark"}</button>
      </div>
      <p role="status" aria-live="polite" className="text-sm">{status}</p>

      {summary.length > 0 && (
        <section aria-labelledby="hasil" data-testid="bench-summary" className="space-y-3">
          <h2 id="hasil" className="font-serif text-xl text-forest-900">Hasil (median antar-run, n={repeats} ulangan, {frames} frame/run)</h2>
          {env && (
            <p className="rounded-lg bg-parchment-100 p-3 text-xs text-slate-600">
              {env.source.synthetic ? "Sumber SINTETIS (" + env.source.label + "): hanya memvalidasi jalur komputasi, BUKAN benchmark pose manusia." : "Sumber: " + (env.source.label ?? "kamera") + " (kehadiran manusia tidak diverifikasi otomatis)."}
              {" "}Lingkungan: {env.userAgent}; {env.hardwareConcurrency ?? "?"} thread; RAM ≈{env.deviceMemoryGB ?? "?"} GB; {env.library}; model {env.models.pose} + {env.models.hand}; video {env.video.width}×{env.video.height}; interval {env.config.minIntervalMs} ms; in-flight {env.config.maxInFlight}; tangan {env.config.hands ? "ya" : "tidak"}.
              Angka hanya berlaku untuk perangkat ini pada saat ini; jangan dikutip sebagai FPS produk.
            </p>
          )}
          <div className="overflow-x-auto rounded-2xl border border-line-200 bg-paper-50">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Perbandingan baseline main-thread dan Web Worker</caption>
              <thead className="border-b border-line-200 text-slate-600"><tr><th scope="col" className="px-3 py-2">Metrik</th><th scope="col" className="px-3 py-2">Baseline (main thread)</th><th scope="col" className="px-3 py-2">Web Worker</th></tr></thead>
              <tbody className="divide-y divide-line-200">
                {([
                  ["Run valid / total", (s: typeof summary[0]) => `${s.okRuns}/${s.runs}`],
                  ["Inisialisasi model (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.initMs, 0)],
                  ["Startup worker (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.workerStartupMs, 0)],
                  ["Latensi median (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.latencyMedianMs)],
                  ["Latensi rata-rata (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.latencyMeanMs)],
                  ["Latensi p95 (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.latencyP95Ms)],
                  ["Frame diproses", (s: typeof summary[0]) => fmt(s.medianOfRuns.processed, 0)],
                  ["Frame video dilewati (engine sibuk)", (s: typeof summary[0]) => (s.medianOfRuns.droppedBackpressure === null ? "n/a (memblokir)" : fmt(s.medianOfRuns.droppedBackpressure, 0))],
                  ["Jeda event-loop terbesar (ms): blokir main thread", (s: typeof summary[0]) => fmt(s.medianOfRuns.maxLoopLagMs, 0)],
                  ["Jeda event-loop p95 (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.p95LoopLagMs, 0)],
                  ["Jeda rAF terbesar (ms): kehalusan visual", (s: typeof summary[0]) => fmt(s.medianOfRuns.maxUiGapMs, 0)],
                  ["Jeda rAF p95 (ms)", (s: typeof summary[0]) => fmt(s.medianOfRuns.p95UiGapMs, 0)],
                  ["Long task (jumlah)", (s: typeof summary[0]) => fmt(s.medianOfRuns.longTasks, 0)],
                ] as const).map(([name, f]) => (
                  <tr key={name}><th scope="row" className="px-3 py-2 font-normal text-slate-600">{name}</th>
                    {(["main-thread-baseline", "worker"] as const).map((eng) => { const s = summary.find((x) => x.engine === eng); return <td key={eng} className="px-3 py-2">{s ? f(s) : "-"}</td>; })}</tr>))}
              </tbody>
            </table>
          </div>
          {results.some((r) => r.error) && <p role="alert" className="text-sm text-clay-600">Beberapa run gagal: {results.filter((r) => r.error).map((r) => `${r.engine}#${r.run}: ${r.error}`).join("; ")}</p>}
        </section>
      )}
      {done && <details className="text-sm"><summary className="cursor-pointer">Data mentah (JSON, tanpa gambar/landmark)</summary>
        <pre data-testid="bench-json" className="mt-2 max-h-96 overflow-auto rounded-xl bg-paper-50 p-3 text-xs">{payload}</pre></details>}
    </div>
  );
}
