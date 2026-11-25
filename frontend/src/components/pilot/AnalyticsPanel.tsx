"use client";
import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { Notice } from "@/components/Notice";
import { btnGhost, btnPrimary, inputCls } from "@/components/studio/bits";
import { clientRequest } from "@/lib/client-api";
import { formatPct, INVITE_STATUS_LABEL, SURVEY_KIND_LABEL } from "@/lib/format";
import type { CohortOut, ProgramAnalytics } from "@/lib/types";

function Bar({ value, label, max = 1 }: { value: number | null; label: string; max?: number }) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="img" aria-label={`${label}: ${value === null ? "disembunyikan" : value}`} className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-slate-600">{label}</span>
      <span className="h-3 flex-1 overflow-hidden rounded-full bg-line-200"><span className="block h-full bg-forest-700" style={{ width: `${pct}%` }} /></span>
      <span className="w-12 text-right tabular-nums">{value === null ? "-" : max === 1 ? formatPct(value) : value}</span>
    </div>
  );
}

export function AnalyticsPanel({ programId, initial, initialError, cohorts }: { programId: string; initial: ProgramAnalytics | null; initialError: string | null; cohorts: CohortOut[] }) {
  const [a, setA] = useState(initial);
  const [err, setErr] = useState<string | null>(initialError);
  const [cohort, setCohort] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const qs = new URLSearchParams();
  if (cohort) qs.set("cohort_id", cohort);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  async function apply(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setErr(null);
    const r = await clientRequest<ProgramAnalytics>("GET", `/pilot/programs/${programId}/analytics${qs.toString() ? `?${qs}` : ""}`);
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setA(r.data);
  }
  return (
    <div className="space-y-8">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-3 print:hidden" aria-label="Filter analytics">
        <div><label htmlFor="an-c" className="mb-1 block text-sm font-medium">Cohort</label><select id="an-c" value={cohort} onChange={(e) => setCohort(e.target.value)} className={inputCls}><option value="">Semua</option>{cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label htmlFor="an-f" className="mb-1 block text-sm font-medium">Dari</label><input id="an-f" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} /></div>
        <div><label htmlFor="an-t" className="mb-1 block text-sm font-medium">Sampai</label><input id="an-t" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} /></div>
        <button disabled={busy} className={btnPrimary}>{busy ? "Memuat…" : "Terapkan"}</button>
        <a href={`/api/v1/pilot/programs/${programId}/report.csv${qs.toString() ? `?${qs}` : ""}`} className={`${btnGhost} inline-flex items-center gap-2`}><Download aria-hidden className="h-4 w-4" />Ekspor CSV (agregat)</a>
        <button type="button" onClick={() => window.print()} className={`${btnGhost} inline-flex items-center gap-2`}><Printer aria-hidden className="h-4 w-4" />Cetak / simpan PDF</button>
      </form>
      <Notice kind={err ? "error" : null}>{err}</Notice>
      {a && (
        <>
          <p role="note" className="rounded-xl border border-line-200 bg-parchment-100 px-4 py-3 text-sm text-slate-600">{a.disclaimer} Kelompok &lt; {a.min_respondents} orang disembunyikan. Dibuat {new Date(a.generated_at).toLocaleString("id-ID")}.</p>

          <section aria-labelledby="an-enr"><h3 id="an-enr" className="mb-3 font-serif text-xl text-forest-900">Keikutsertaan</h3>
            <div className="overflow-x-auto rounded-xl border border-line-200"><table className="w-full text-left text-sm"><caption className="sr-only">Keikutsertaan per cohort</caption>
              <thead className="border-b border-line-200 text-slate-600"><tr><th scope="col" className="px-4 py-2">Cohort</th><th scope="col" className="px-4 py-2">Aktif</th><th scope="col" className="px-4 py-2">Kapasitas</th><th scope="col" className="px-4 py-2">Keluar/dikeluarkan</th></tr></thead>
              <tbody className="divide-y divide-line-200">{a.enrollment.cohorts.map((c) => <tr key={c.cohort_id}><th scope="row" className="px-4 py-2 font-medium">{c.cohort_name}</th><td className="px-4 py-2">{c.active}</td><td className="px-4 py-2">{c.capacity}</td><td className="px-4 py-2">{c.withdrawn + c.removed}</td></tr>)}</tbody></table></div>
            <p className="mt-2 text-sm text-slate-600">Undangan: {Object.entries(a.enrollment.invitations).filter(([k]) => k !== "total").map(([k, v]) => `${INVITE_STATUS_LABEL[k] ?? k} ${v}`).join(" · ")} (total {a.enrollment.invitations.total})</p></section>

          <section aria-labelledby="an-use"><h3 id="an-use" className="mb-1 font-serif text-xl text-forest-900">Data penggunaan (sistem)</h3>
            <p className="mb-3 text-sm text-slate-600">Sumber: enrollments, lesson_progress, practice_sessions (metadata saja). Mengukur aktivitas, bukan kemampuan.</p>
            <div className="space-y-5">{a.usage.cohorts.map((u) => (
              <div key={u.cohort_id} className="rounded-xl border border-line-200 bg-paper-50 p-4"><h4 className="font-medium">{u.cohort_name} <span className="font-normal text-slate-600">· {u.active_members} peserta aktif · {u.lessons_total} pelajaran</span></h4>
                {u.suppressed ? <p className="mt-2 text-sm text-slate-600">{u.note}</p> : (
                  <div className="mt-3 space-y-2">
                    <Bar value={u.completion_rate} label="Penyelesaian pelajaran" />
                    <Bar value={u.active_rate ?? null} label="Peserta aktif" />
                    <p className="text-sm text-slate-600">Sesi latihan: {u.practice?.sessions} (selesai {u.practice?.by_status.completed ?? 0}, ditinggalkan {u.practice?.by_status.abandoned ?? 0}) · {u.practice?.active_minutes} menit aktif · rata-rata {u.practice?.sessions_per_active_participant ?? "-"} sesi per peserta aktif</p>
                  </div>)}</div>))}</div>
            <h4 className="mb-2 mt-6 font-medium">Retensi mingguan</h4>
            {a.usage.retention.map((r) => { const name = a.usage.cohorts.find((c) => c.cohort_id === r.cohort_id)?.cohort_name; return (
              <div key={r.cohort_id} className="mb-4"><p className="mb-1 text-sm font-medium">{name}</p>
                {r.suppressed ? <p className="text-sm text-slate-600">Disembunyikan (peserta &lt; {a.min_respondents}).</p> : r.weeks.length === 0 ? <p className="text-sm text-slate-600">Belum ada pekan yang dapat dihitung.</p> : <div className="space-y-1">{r.weeks.map((w) => <Bar key={w.week} value={w.rate} label={`Pekan ${w.week}`} />)}</div>}</div>); })}
            <p className="text-xs text-slate-600">Aktif pada suatu pekan = ≥1 progres pelajaran atau sesi latihan pada pekan itu.</p></section>

          <section aria-labelledby="an-sv"><h3 id="an-sv" className="mb-1 font-serif text-xl text-forest-900">Survei (persepsi peserta)</h3>
            <p className="mb-3 text-sm text-slate-600">Instrumen draf, belum divalidasi secara akademik. Menampilkan jumlah responden dan response rate.</p>
            {a.surveys.length === 0 ? <p className="text-sm text-slate-600">Belum ada survei.</p> : a.surveys.map((s) => (
              <div key={s.survey_id} className="mb-5 rounded-xl border border-line-200 bg-paper-50 p-4"><h4 className="font-medium">{SURVEY_KIND_LABEL[s.kind] ?? s.title}</h4>
                <p className="text-sm text-slate-600">{s.responses} responden dari {s.eligible} · response rate {formatPct(s.response_rate)}</p>
                {s.suppressed ? <p className="mt-2 text-sm text-slate-600">{s.note}</p> : s.questions.filter((q) => q.type !== "open_text").map((q) => (
                  <div key={q.id} className="mt-3"><p className="text-sm font-medium">{q.text} <span className="font-normal text-slate-600">(n={q.answered}{q.mean != null ? `, rata-rata ${q.mean}` : ""})</span></p>
                    <div className="mt-1 space-y-1">{Object.entries(q.distribution ?? {}).map(([k, v]) => <Bar key={k} value={q.answered ? v / q.answered : 0} label={k} />)}</div></div>))}
              </div>))}</section>

          <section aria-labelledby="an-con"><h3 id="an-con" className="mb-1 font-serif text-xl text-forest-900">Persetujuan opsional</h3>
            <p className="text-sm text-slate-600">{a.consent.research_aggregate === null ? `Disembunyikan (peserta < ${a.min_respondents}).` : `${a.consent.research_aggregate} dari ${a.consent.members} peserta mengizinkan data masuk laporan agregat riset; ${a.consent.publication_quote} mengizinkan kutipan tanpa nama.`}</p></section>
        </>)}
    </div>
  );
}
