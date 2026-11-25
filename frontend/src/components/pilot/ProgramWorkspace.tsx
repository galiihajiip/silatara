"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Notice } from "@/components/Notice";
import { btnGhost, btnPrimary, Checklist, Field, inputCls, Section } from "@/components/studio/bits";
import { clientRequest } from "@/lib/client-api";
import { COHORT_STATUS_LABEL, formatDate, formatDateTime, PROGRAM_ACTION_LABEL, SURVEY_KIND_LABEL } from "@/lib/format";
import { describeError } from "@/lib/studio-api";
import type { CohortOut, ProgramAction, ProgramAnalytics, ProgramDetail, Role, StudioPartnerDetail, SurveyOut } from "@/lib/types";
import { LazyAnalyticsPanel } from "@/components/LazyClients";

type Msg = { kind: "success" | "error"; text: string } | null;
const KINDS = ["baseline", "endline", "feedback_learner", "feedback_instructor"] as const;

export function ProgramWorkspace({ initial, surveys: initSurveys, analytics, analyticsError, courses, viewerRole }: {
  initial: ProgramDetail; surveys: SurveyOut[]; analytics: ProgramAnalytics | null; analyticsError: string | null;
  courses: { id: string; title: string; partner: string | null }[]; viewerRole: Role;
}) {
  const [p, setP] = useState(initial);
  const [surveys, setSurveys] = useState(initSurveys);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [members, setMembers] = useState<StudioPartnerDetail["members"]>([]);
  useEffect(() => {
    let alive = true;
    clientRequest<StudioPartnerDetail>("GET", `/studio/partners/${p.partner_id}`).then((r) => { if (alive && r.ok) setMembers(r.data.members); });
    return () => { alive = false; };
  }, [p.partner_id]);

  async function call<T>(key: string, method: string, path: string, body: unknown, ok: string, apply: (d: T) => void) {
    setBusy(key); setMsg(null);
    const r = await clientRequest<T>(method, path, body);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setMsg({ kind: "success", text: ok }); apply(r.data);  // apply() pode menimpa pesan bila perlu
  }
  const reload = () => clientRequest<ProgramDetail>("GET", `/pilot/programs/${p.id}`).then((r) => { if (r.ok) setP(r.data); });
  const act = (a: ProgramAction) => call<ProgramDetail>("act-" + a, "POST", `/pilot/programs/${p.id}/transition`, { action: a, note: note.trim() || undefined, evidence_ref: evidence.trim() || undefined }, `${PROGRAM_ACTION_LABEL[a]}: berhasil.`, (d) => { setP(d); setNote(""); });
  const editable = p.status === "draft";
  const partnerCourses = courses.filter((c) => c.partner === p.partner_name);

  async function saveProgram(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const k of ["name", "objective", "description", "start_date", "end_date"]) body[k] = String(f.get(k) ?? "").trim() || null;
    body.capacity = Number(f.get("capacity") || 30);
    body.responsible_user_id = String(f.get("responsible_user_id") || "") || null;
    await call<ProgramDetail>("save", "PATCH", `/pilot/programs/${p.id}`, body, "Program tersimpan.", setP);
  }
  async function addCohort(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const body: Record<string, unknown> = { name: String(f.get("name")).trim(), course_id: String(f.get("course_id")), capacity: Number(f.get("capacity") || 30) };
    for (const k of ["instructor_user_id", "start_date", "end_date"]) { const v = String(f.get(k) ?? ""); if (v) body[k] = v; }
    await call<CohortOut>("cohort", "POST", `/pilot/programs/${p.id}/cohorts`, body, "Cohort dibuat.", () => { formEl.reset(); void reload(); });
  }
  async function announce(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const body: Record<string, unknown> = { title: String(f.get("title")).trim(), body: String(f.get("body")).trim(), notify: f.get("notify") === "on" };
    if (f.get("cohort_id")) body.cohort_id = String(f.get("cohort_id"));
    await call<{ delivery: Record<string, number> }>("announce", "POST", `/pilot/programs/${p.id}/announcements`, body, "Pengumuman dibuat.", (d) => {
      formEl.reset(); void reload();
      const q = Object.entries(d.delivery).map(([k, v]) => `${v} ${k}`).join(", ");
      setMsg({ kind: "success", text: `Pengumuman dibuat. Notifikasi email diantrekan (${q || "tidak ada penerima"}), status "pending" berarti BELUM terkirim; pengiriman oleh worker sesuai provider email yang dikonfigurasi.` });
    });
  }
  const reloadSurveys = () => clientRequest<SurveyOut[]>("GET", `/pilot/programs/${p.id}/surveys`).then((r) => { if (r.ok) setSurveys(r.data); });
  const needsEvidence = p.allowed_actions.includes("approve") && !p.is_demo;
  const needsNote = p.allowed_actions.includes("reject");

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-bronze-700">Pilot & Impact Studio</p>
        <h1 className="font-serif text-3xl text-forest-900">{p.name}{p.is_demo && <span className="ml-3 align-middle text-sm font-normal text-slate-600">[DEMO]</span>}</h1>
        <p className="mt-2 text-sm text-slate-600">{p.partner_name} · <strong>{p.status_label}</strong> · {formatDate(p.start_date)} – {formatDate(p.end_date)} · {p.member_count}/{p.capacity} peserta</p>
      </header>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

      <Section id="status" title="Status dan persetujuan" description={p.official_note}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p>{p.official ? "Program ini resmi (disetujui)." : "Program ini BELUM resmi."}</p>
            {!p.partner_verified && !p.is_demo && <p className="text-clay-600">Mitra penyelenggara belum terverifikasi: hanya draf.</p>}
            {p.approved_by && <p>Disetujui oleh {p.approved_by}, {formatDateTime(p.approved_at)}{p.approval_evidence_ref ? ` · bukti: ${p.approval_evidence_ref}` : ""}</p>}
            {p.review_note && <p>Catatan: {p.review_note}</p>}
          </div>
          {p.status === "draft" && <Checklist label="Kesiapan diajukan" items={[
            { key: "o", label: "Tujuan program", ok: !p.submit_missing.includes("Tujuan program") }, { key: "p", label: "Periode", ok: !p.submit_missing.includes("Periode (mulai & selesai)") },
            { key: "r", label: "Instruktur penanggung jawab", ok: !p.submit_missing.includes("Instruktur penanggung jawab") }, { key: "c", label: "Minimal satu cohort", ok: !p.submit_missing.includes("Minimal satu cohort") }]} />}
        </div>
        {p.allowed_actions.length > 0 ? (
          <div className="space-y-3 border-t border-line-200 pt-4">
            {needsEvidence && <Field id="ev" label="Rujukan bukti persetujuan" hint="Wajib untuk program non-demo."><input id="ev" value={evidence} onChange={(e) => setEvidence(e.target.value)} className={inputCls} /></Field>}
            {(needsNote || needsEvidence) && <Field id="nt" label="Catatan (wajib untuk menolak)"><textarea id="nt" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></Field>}
            <div className="flex flex-wrap gap-2">{p.allowed_actions.map((a) => <button key={a} disabled={!!busy} onClick={() => act(a)} className={["submit", "approve", "activate"].includes(a) ? btnPrimary : btnGhost}>{busy === "act-" + a ? "…" : PROGRAM_ACTION_LABEL[a]}</button>)}</div>
          </div>) : <p className="border-t border-line-200 pt-4 text-sm text-slate-600">Tidak ada aksi yang tersedia untuk Anda pada status ini.{viewerRole === "admin" ? " Admin yang menulis program atau anggota mitra tidak dapat menyetujui programnya sendiri." : ""}</p>}
      </Section>

      <Section id="detail" title="Detail program" description={editable ? "Dapat diubah selama draf." : "Terkunci setelah diajukan."}>
        <form onSubmit={saveProgram} className="grid gap-4 sm:grid-cols-2" key={p.updated_at}>
          <div className="sm:col-span-2"><Field id="pn" label="Nama"><input id="pn" name="name" defaultValue={p.name} disabled={!editable} className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><Field id="po" label="Tujuan"><textarea id="po" name="objective" rows={3} defaultValue={p.objective ?? ""} disabled={!editable} className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><Field id="pd" label="Deskripsi"><textarea id="pd" name="description" rows={3} defaultValue={p.description ?? ""} disabled={!editable} className={inputCls} /></Field></div>
          <Field id="ps" label="Mulai"><input id="ps" name="start_date" type="date" defaultValue={p.start_date ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="pe" label="Selesai"><input id="pe" name="end_date" type="date" defaultValue={p.end_date ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="pc" label="Kapasitas program"><input id="pc" name="capacity" type="number" min={1} defaultValue={p.capacity} disabled={!editable} className={inputCls} /></Field>
          <Field id="pr" label="Instruktur penanggung jawab"><select id="pr" name="responsible_user_id" defaultValue={p.responsible_user_id ?? ""} disabled={!editable} className={inputCls}><option value="">Pilih</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select></Field>
          {editable && <div className="sm:col-span-2"><button disabled={!!busy} className={btnPrimary}>{busy === "save" ? "Menyimpan…" : "Simpan"}</button></div>}
        </form>
      </Section>

      <Section id="cohort" title="Cohort" description="Setiap cohort memiliki instruktur, kurikulum, jadwal, kapasitas, dan peserta sendiri. Undangan dibuat dari halaman cohort setelah program disetujui.">
        {p.cohorts.length === 0 ? <p className="text-sm text-slate-600">Belum ada cohort.</p> : (
          <ul className="divide-y divide-line-200 rounded-xl border border-line-200">{p.cohorts.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span><Link className="font-medium underline" href={`/app/pilot/manage/cohorts/${c.id}`}>{c.name}</Link><span className="block text-slate-600">{c.course_title} · instruktur {c.instructor ?? "-"}</span></span>
              <span className="text-slate-600">{COHORT_STATUS_LABEL[c.status]} · {c.member_count}/{c.capacity}</span></li>))}</ul>)}
        {!["completed", "cancelled", "archived"].includes(p.status) && (
          <form onSubmit={addCohort} className="grid gap-3 rounded-xl border border-line-200 bg-parchment-100/50 p-4 sm:grid-cols-2">
            <h3 className="font-medium sm:col-span-2">Tambah cohort</h3>
            <Field id="cn" label="Nama cohort" required><input id="cn" name="name" required className={inputCls} /></Field>
            <Field id="cc" label="Kurikulum (terbit milik mitra)" required><select id="cc" name="course_id" required defaultValue="" className={inputCls}><option value="" disabled>Pilih</option>{partnerCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
            <Field id="ci" label="Instruktur cohort"><select id="ci" name="instructor_user_id" defaultValue="" className={inputCls}><option value="">Belum ditetapkan</option>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}</select></Field>
            <Field id="ck" label="Kapasitas"><input id="ck" name="capacity" type="number" min={1} defaultValue={30} className={inputCls} /></Field>
            <Field id="cs" label="Mulai"><input id="cs" name="start_date" type="date" className={inputCls} /></Field>
            <Field id="ce" label="Selesai"><input id="ce" name="end_date" type="date" className={inputCls} /></Field>
            <div className="sm:col-span-2"><button disabled={!!busy} className={btnGhost}>Tambah cohort</button></div>
          </form>)}
      </Section>

      <Section id="pengumuman" title="Pengumuman" description="Notifikasi email diantrekan lewat outbox. Status 'pending' = belum terkirim; 'dev_sink' = hanya disimpan di kotak surat pengembangan.">
        {p.announcements.length > 0 && <ul className="space-y-2">{p.announcements.slice(0, 5).map((a) => <li key={a.id} className="rounded-xl border border-line-200 px-4 py-2 text-sm"><span className="font-medium">{a.title}</span><span className="block text-slate-600">{a.author} · {formatDateTime(a.created_at)}{a.cohort_id ? " · cohort tertentu" : " · seluruh program"}</span></li>)}</ul>}
        <form onSubmit={announce} className="grid gap-3 sm:grid-cols-2">
          <Field id="at" label="Judul" required><input id="at" name="title" required className={inputCls} /></Field>
          <Field id="ac" label="Tujuan"><select id="ac" name="cohort_id" defaultValue="" className={inputCls}><option value="">Seluruh program</option>{p.cohorts.map((c) => <option key={c.id} value={c.id}>Cohort {c.name}</option>)}</select></Field>
          <div className="sm:col-span-2"><Field id="ab" label="Isi" required><textarea id="ab" name="body" rows={3} required className={inputCls} /></Field></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="notify" defaultChecked />Kirim juga lewat email (diantrekan)</label>
          <div className="sm:col-span-2"><button disabled={!!busy} className={btnGhost}>Buat pengumuman</button></div>
        </form>
      </Section>

      <Section id="survei" title="Survei" description="Templat adalah instrumen DRAF yang belum divalidasi secara akademik. Anda dapat mengubah pertanyaan lewat API sebelum dibuka.">
        <ul className="space-y-2">{KINDS.map((k) => {
          const s = surveys.find((x) => x.kind === k);
          return (
            <li key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-200 px-4 py-3 text-sm">
              <span><span className="font-medium">{SURVEY_KIND_LABEL[k]}</span>{s && <span className="block text-slate-600">{s.status === "draft" ? "Draf" : s.status === "open" ? "Terbuka" : "Ditutup"} · {s.responses ?? 0} respons · {s.questions.length} pertanyaan</span>}</span>
              {!s ? <button disabled={!!busy} onClick={() => call<SurveyOut>("tpl", "POST", `/pilot/programs/${p.id}/surveys/templates`, { kind: k }, "Survei dibuat dari templat draf.", () => void reloadSurveys())} className={btnGhost}>Buat dari templat</button>
                : s.status === "draft" ? <button disabled={!!busy} onClick={() => call<SurveyOut>("op", "POST", `/pilot/surveys/${s.id}/transition`, { action: "open" }, "Survei dibuka.", () => void reloadSurveys())} className={btnPrimary}>Buka</button>
                : s.status === "open" ? <button disabled={!!busy} onClick={() => call<SurveyOut>("cl", "POST", `/pilot/surveys/${s.id}/transition`, { action: "close" }, "Survei ditutup.", () => void reloadSurveys())} className={btnGhost}>Tutup</button> : null}
            </li>); })}</ul>
      </Section>

      <Section id="analytics" title="Analytics dan laporan" description="Penggunaan, survei, dan catatan instruktur dipisahkan. Aktivitas bukan penguasaan teknik.">
        <LazyAnalyticsPanel programId={p.id} initial={analytics} initialError={analyticsError} cohorts={p.cohorts} />
      </Section>

      <Section id="privasi" title="Data dan retensi" description="Detail: docs/PILOT_PRIVACY_RETENTION.md">
        <p className="text-sm text-slate-600">Data operasional peserta (keikutsertaan, progres, metadata sesi latihan) wajib untuk ikut; persetujuan riset/publikasi bersifat opsional dan dapat dicabut. Video dan data biometrik tidak dikumpulkan. Setelah program selesai + {p.retention_days} hari, jawaban survei dianonimkan dan catatan instruktur serta undangan dihapus.{p.anonymized_at ? ` Dianonimkan pada ${formatDateTime(p.anonymized_at)}.` : ""}</p>
      </Section>
    </div>
  );
}
