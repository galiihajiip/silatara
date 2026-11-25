"use client";
import { useState } from "react";
import { AlertTriangle, Copy, Trash2 } from "lucide-react";
import { Notice } from "@/components/Notice";
import { btnGhost, btnPrimary, Field, inputCls, Section } from "@/components/studio/bits";
import { clientRequest } from "@/lib/client-api";
import { COHORT_STATUS_LABEL, formatDate, formatDateTime, formatPct, INVITE_STATUS_LABEL } from "@/lib/format";
import { describeError } from "@/lib/studio-api";
import type { CohortDashboard, CohortManage, CohortOut, InvitationOut } from "@/lib/types";

type Msg = { kind: "success" | "error"; text: string } | null;
type Note = { id: string; participant_user_id: string; participant: string; note: string; created_at: string };
const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function CohortManager({ initial, dashboard: initDash, notes: initNotes }: { initial: CohortManage; dashboard: CohortDashboard; notes: Note[] }) {
  const [c, setC] = useState(initial);
  const [d, setD] = useState(initDash);
  const [notes, setNotes] = useState(initNotes);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ token: string; email: string | null } | null>(null);
  const [sessions, setSessions] = useState(c.sessions.map((s) => ({ title: s.title, starts_at: toLocal(s.starts_at), ends_at: toLocal(s.ends_at), location_note: s.location_note ?? "" })));
  const link = fresh ? `${typeof window !== "undefined" ? window.location.origin : ""}/undangan?token=${fresh.token}` : "";

  async function reload() {
    const [a, b] = await Promise.all([clientRequest<CohortManage>("GET", `/pilot/cohorts/${c.id}`), clientRequest<CohortDashboard>("GET", `/pilot/cohorts/${c.id}/dashboard`)]);
    if (a.ok) setC(a.data);
    if (b.ok) setD(b.data);
  }
  async function run<T>(method: string, path: string, body: unknown, ok: string, after?: (x: T) => void) {
    setBusy(true); setMsg(null);
    const r = await clientRequest<T>(method, path, body);
    setBusy(false);
    if (!r.ok) { setMsg({ kind: "error", text: describeError(r) }); return false; }
    after?.(r.data); setMsg({ kind: "success", text: ok }); await reload();
    return true;
  }
  const setStatus = (s: "open" | "closed" | "completed") => run<CohortOut>("POST", `/pilot/cohorts/${c.id}/status`, { status: s }, "Status cohort diperbarui.");
  async function createInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const email = String(f.get("email") ?? "").trim();
    await run<InvitationOut>("POST", `/pilot/cohorts/${c.id}/invitations`, { ...(email ? { email } : {}), days: Number(f.get("days") || 14) }, "Undangan dibuat.", (x) => { setFresh({ token: x.token!, email: x.email }); formEl.reset(); });
  }
  async function saveSessions() {
    const body = { sessions: sessions.filter((s) => s.title.trim() && s.starts_at).map((s) => ({ title: s.title.trim(), starts_at: new Date(s.starts_at).toISOString(), ends_at: s.ends_at ? new Date(s.ends_at).toISOString() : null, location_note: s.location_note.trim() || null })) };
    await run("PUT", `/pilot/cohorts/${c.id}/sessions`, body, "Jadwal tersimpan.");
  }
  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    await run<Note[]>("POST", `/pilot/cohorts/${c.id}/notes`, { participant_user_id: String(f.get("p")), note: String(f.get("note")).trim() }, "Catatan disimpan.", (x) => { setNotes(x); formEl.reset(); });
  }
  const open = c.status === "open";

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-bronze-700">Instructor Cohort Dashboard</p>
        <h1 className="font-serif text-3xl text-forest-900">{c.name}</h1>
        <p className="mt-2 text-sm text-slate-600">{c.program.name} · {c.course_title} · {COHORT_STATUS_LABEL[c.status]} · {c.member_count}/{c.capacity} peserta · {formatDate(c.start_date)} – {formatDate(c.end_date)}</p>
      </header>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

      <Section id="ringkasan" title="Peserta dan aktivitas" description={d.disclaimer}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-[#F4F5F7] p-4"><dt className="text-xs font-medium text-slate-500">Peserta aktif</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-forest-900">{d.summary.members}</dd></div>
          <div className="rounded-2xl border border-slate-200/80 bg-[#F4F5F7] p-4"><dt className="text-xs font-medium text-slate-500">Belum memulai</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-forest-900">{d.summary.not_started}</dd></div>
          <div className="rounded-2xl border border-orange-200/80 bg-parchment-100 p-4"><dt className="text-xs font-medium text-bronze-700">Perlu perhatian</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-clay-600">{d.summary.needs_attention}</dd></div>
          <div className="rounded-2xl border border-slate-200/80 bg-[#F4F5F7] p-4"><dt className="text-xs font-medium text-slate-500">Selesai semua</dt><dd className="mt-1 text-2xl font-bold tabular-nums text-forest-900">{d.summary.completed_all}</dd></div>
        </dl>
        <p className="text-xs text-slate-600">&ldquo;Perlu perhatian&rdquo; = belum memulai ≥ {d.thresholds.no_start_days} hari sejak bergabung, atau tanpa aktivitas ≥ {d.thresholds.inactive_days} hari padahal belum selesai (program berjalan). Ini sinyal untuk menghubungi peserta, bukan penilaian.</p>
        {d.participants.length === 0 ? <p className="text-sm text-slate-600">Belum ada peserta.</p> : (
          <div className="overflow-x-auto rounded-xl border border-line-200"><table className="w-full text-left text-sm"><caption className="sr-only">Peserta cohort</caption>
            <thead className="border-b border-line-200 text-slate-600"><tr><th scope="col" className="px-4 py-2">Peserta</th><th scope="col" className="px-4 py-2">Pelajaran</th><th scope="col" className="px-4 py-2">Latihan</th><th scope="col" className="px-4 py-2">Aktivitas terakhir</th><th scope="col" className="px-4 py-2">Status</th><th scope="col" className="px-4 py-2"><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody className="divide-y divide-line-200">{d.participants.map((p) => (
              <tr key={p.user_id}><th scope="row" className="px-4 py-2 font-medium">{p.name}</th>
                <td className="px-4 py-2">{p.lessons_completed}/{p.lessons_total} ({formatPct(p.completion)})</td>
                <td className="px-4 py-2">{p.practice_sessions} sesi · {p.practice_minutes} mnt</td>
                <td className="px-4 py-2">{p.last_activity_at ? formatDateTime(p.last_activity_at) : "belum ada"}</td>
                <td className="px-4 py-2">{p.needs_attention ? <span className="inline-flex items-center gap-1 text-clay-600"><AlertTriangle aria-hidden className="h-4 w-4" />Perlu perhatian: {p.attention_reasons.join("; ")}</span> : !p.started ? "Belum mulai" : "Berjalan"}{p.surveys_pending > 0 && <span className="block text-xs text-slate-600">{p.surveys_pending} survei belum diisi</span>}</td>
                <td className="px-4 py-2"><button aria-label={`Keluarkan ${p.name}`} disabled={busy} onClick={() => { if (window.confirm(`Keluarkan ${p.name} dari cohort?`)) void run("DELETE", `/pilot/cohorts/${c.id}/members/${p.user_id}`, undefined, "Peserta dikeluarkan."); }} className="text-clay-600"><Trash2 aria-hidden className="h-4 w-4" /></button></td></tr>))}</tbody></table></div>)}
      </Section>

      <Section id="status" title="Status cohort dan undangan" description="Undangan hanya dapat dibuat saat cohort terbuka dan program disetujui/berjalan. Token hanya ditampilkan sekali dan disimpan sebagai hash.">
        <div className="flex flex-wrap gap-2">
          {!open && c.status !== "completed" && <button disabled={busy} onClick={() => setStatus("open")} className={btnPrimary}>Buka untuk undangan</button>}
          {open && <button disabled={busy} onClick={() => setStatus("closed")} className={btnGhost}>Tutup</button>}
          {c.status !== "completed" && <button disabled={busy} onClick={() => setStatus("completed")} className={btnGhost}>Tandai selesai</button>}
        </div>
        {open && (
          <form onSubmit={createInvite} className="grid gap-3 rounded-xl border border-line-200 bg-parchment-100/50 p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
            <Field id="ie" label="Email peserta (opsional)" hint="Bila diisi, hanya akun dengan email terverifikasi itu yang dapat menerima."><input id="ie" name="email" type="email" className={inputCls} /></Field>
            <Field id="id" label="Berlaku (hari)"><input id="id" name="days" type="number" min={1} max={60} defaultValue={14} className={inputCls} /></Field>
            <button disabled={busy} className={btnPrimary}>Buat undangan</button>
          </form>)}
        {fresh && (
          <div role="status" className="rounded-xl border border-forest-700/30 bg-forest-700/5 p-4 text-sm">
            <p className="font-medium">Tautan undangan (hanya ditampilkan sekali)</p>
            <p className="mt-1 break-all font-mono text-xs">{link}</p>
            <div className="mt-2 flex items-center gap-3"><button onClick={() => void navigator.clipboard.writeText(link)} className={`${btnGhost} inline-flex items-center gap-2`}><Copy aria-hidden className="h-4 w-4" />Salin</button>
              <span className="text-slate-600">{fresh.email ? `Email ke ${fresh.email} diantrekan di outbox (status pada daftar bawah tidak menjamin terkirim).` : "Bagikan secara pribadi; undangan sekali pakai."}</span></div>
          </div>)}
        <h3 className="font-medium">Status undangan</h3>
        {c.invitations.length === 0 ? <p className="text-sm text-slate-600">Belum ada undangan.</p> : (
          <ul className="divide-y divide-line-200 rounded-xl border border-line-200">{c.invitations.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"><span>{i.email ?? "Tautan terbuka"} <span className="text-slate-600">· berlaku s.d. {formatDate(i.expires_at)}</span></span>
              <span className="flex items-center gap-3"><span className="rounded-full bg-line-200 px-2.5 py-0.5 text-xs">{INVITE_STATUS_LABEL[i.status]}</span>
                {i.status === "pending" && <button disabled={busy} onClick={() => void run("DELETE", `/pilot/invitations/${i.id}`, undefined, "Undangan dicabut.")} className="text-clay-600 underline">Cabut</button>}</span></li>))}</ul>)}
      </Section>

      <Section id="jadwal" title="Jadwal pertemuan">
        <ul className="space-y-3">{sessions.map((s, i) => (
          <li key={i} className="grid gap-2 rounded-xl border border-line-200 p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] sm:items-end">
            <Field id={`s-t-${i}`} label="Judul"><input id={`s-t-${i}`} value={s.title} onChange={(e) => setSessions(sessions.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className={inputCls} /></Field>
            <Field id={`s-s-${i}`} label="Mulai"><input id={`s-s-${i}`} type="datetime-local" value={s.starts_at} onChange={(e) => setSessions(sessions.map((x, k) => (k === i ? { ...x, starts_at: e.target.value } : x)))} className={inputCls} /></Field>
            <Field id={`s-e-${i}`} label="Selesai"><input id={`s-e-${i}`} type="datetime-local" value={s.ends_at} onChange={(e) => setSessions(sessions.map((x, k) => (k === i ? { ...x, ends_at: e.target.value } : x)))} className={inputCls} /></Field>
            <Field id={`s-l-${i}`} label="Lokasi/catatan"><input id={`s-l-${i}`} value={s.location_note} onChange={(e) => setSessions(sessions.map((x, k) => (k === i ? { ...x, location_note: e.target.value } : x)))} className={inputCls} /></Field>
            <button type="button" aria-label={`Hapus pertemuan ${i + 1}`} onClick={() => setSessions(sessions.filter((_, k) => k !== i))} className="pb-2 text-clay-600"><Trash2 aria-hidden className="h-4 w-4" /></button></li>))}</ul>
        <div className="flex gap-2"><button type="button" onClick={() => setSessions([...sessions, { title: "", starts_at: "", ends_at: "", location_note: "" }])} className={btnGhost}>+ Tambah pertemuan</button><button disabled={busy} onClick={saveSessions} className={btnPrimary}>Simpan jadwal</button></div>
      </Section>

      <Section id="catatan" title="Catatan instruktur (privat)" description="Terpisah dari analytics: tidak masuk laporan atau ekspor, dan dihapus saat retensi berakhir.">
        {notes.length > 0 && <ul className="space-y-2">{notes.map((n) => <li key={n.id} className="rounded-xl border border-line-200 px-4 py-2 text-sm"><span className="font-medium">{n.participant}</span> <span className="text-slate-600">· {formatDateTime(n.created_at)}</span><p className="mt-1 whitespace-pre-line">{n.note}</p></li>)}</ul>}
        <form onSubmit={addNote} className="grid gap-3 sm:grid-cols-[14rem_1fr_auto] sm:items-end">
          <Field id="np" label="Peserta"><select id="np" name="p" required defaultValue="" className={inputCls}><option value="" disabled>Pilih</option>{d.participants.map((p) => <option key={p.user_id} value={p.user_id}>{p.name}</option>)}</select></Field>
          <Field id="nn" label="Catatan"><input id="nn" name="note" required maxLength={4000} className={inputCls} /></Field>
          <button disabled={busy} className={btnGhost}>Simpan</button>
        </form>
      </Section>
    </div>
  );
}
