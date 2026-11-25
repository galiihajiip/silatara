"use client";
import { useRef, useState } from "react";
import { FileDown, Trash2 } from "lucide-react";
import { Notice } from "@/components/Notice";
import { clientRequest } from "@/lib/client-api";
import { actionLabel, formatBytes, formatDateTime, PARTNER_ACTION_LABEL, PARTNER_TYPE_LABEL } from "@/lib/format";
import { clientUpload, describeError } from "@/lib/studio-api";
import type { PartnerAction, PartnerEvent, Role, StudioPartnerDetail } from "@/lib/types";
import { btnGhost, btnPrimary, Checklist, Field, inputCls, Section } from "./bits";
import { PartnerStatusPill } from "./StatusPills";

const DOC_KIND: Record<string, string> = { approval_letter: "Surat persetujuan / penugasan", identity: "Dokumen identitas organisasi", other: "Lainnya" };
type Msg = { kind: "success" | "error"; text: string } | null;

export function PartnerWorkspace({ initial, initialHistory, traditions, viewerRole, viewerId }: {
  initial: StudioPartnerDetail; initialHistory: PartnerEvent[]; traditions: { id: string; name: string }[]; viewerRole: Role; viewerId: string;
}) {
  const [d, setD] = useState(initial);
  const [history, setHistory] = useState(initialHistory);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function reloadHistory() {
    const r = await clientRequest<PartnerEvent[]>("GET", `/studio/partners/${d.id}/history`);
    if (r.ok) setHistory(r.data);
  }
  async function call<T = StudioPartnerDetail>(key: string, method: string, path: string, body: unknown, ok: string, onData?: (x: T) => void) {
    setBusy(key);
    setMsg(null);
    const r = await clientRequest<T>(method, path, body);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    if (onData) onData(r.data); else setD(r.data as unknown as StudioPartnerDetail);
    setMsg({ kind: "success", text: ok });
    void reloadHistory();
  }

  const act = (a: PartnerAction) => call("act-" + a, "POST", `/studio/partners/${d.id}/verification`,
    { action: a, note: note.trim() || undefined, evidence_ref: evidence.trim() || undefined }, `${PARTNER_ACTION_LABEL[a]}: berhasil.`, (x: StudioPartnerDetail) => { setD(x); setNote(""); });

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, string | null> = {};
    for (const [k, v] of f.entries()) body[k] = String(v).trim() || null;
    await call("profile", "PATCH", `/studio/partners/${d.id}`, body, "Profil tersimpan.");
  }
  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // React menolkan currentTarget setelah await
    const f = new FormData(formEl);
    await call("member", "POST", `/studio/partners/${d.id}/members`, { email: String(f.get("email")).trim(), role: String(f.get("role")) }, "Anggota ditambahkan.");
    formEl.reset();
  }
  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!(form.get("file") as File)?.size) return setMsg({ kind: "error", text: "Pilih berkas terlebih dahulu." });
    setBusy("doc");
    const r = await clientUpload<StudioPartnerDetail>(`/studio/partners/${d.id}/documents`, form);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setD(r.data);
    if (fileRef.current) fileRef.current.value = "";
    setMsg({ kind: "success", text: "Dokumen tersimpan secara privat." });
    void reloadHistory();
  }

  const can = d.can_manage;
  const editable = d.can_edit_profile;
  const needsEvidence = d.allowed_actions.includes("verify");
  const needsNote = d.allowed_actions.some((a) => ["reject", "suspend"].includes(a));
  const traditionOptions = traditions.filter((t) => !d.traditions.some((x) => x.id === t.id));

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-bronze-700">Partner Workspace</p>
        <h1 className="font-serif text-3xl text-forest-900">{d.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <PartnerStatusPill status={d.verification_status} demo={d.is_demo} />
          <span>{PARTNER_TYPE_LABEL[d.partner_type]}{d.city ? ` · ${d.city}` : ""}</span>
          {d.listed_publicly && <span>· Tercantum di direktori publik</span>}
        </p>
      </header>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

      <Section id="status" title="Status kemitraan" description="Membuat profil bukan berarti menjadi mitra resmi. Status terverifikasi hanya diberikan admin berdasarkan bukti, dengan identitas dan waktu keputusan tercatat.">
        <div className="grid gap-6 md:grid-cols-2">
          <Checklist items={d.readiness} label="Kesiapan untuk diajukan" />
          <div className="space-y-2 text-sm">
            {d.verification_decided_by && <p><span className="font-medium">Diputuskan oleh:</span> {d.verification_decided_by} · {formatDateTime(d.verification_decided_at)}</p>}
            {d.approval_evidence_ref && <p><span className="font-medium">Rujukan bukti:</span> {d.approval_evidence_ref}</p>}
            {d.verification_note && <p><span className="font-medium">Catatan:</span> {d.verification_note}</p>}
            {d.submitted_at && <p><span className="font-medium">Diajukan:</span> {formatDateTime(d.submitted_at)}</p>}
            {d.is_demo && <p className="text-slate-600">[DEMO] Data contoh; bukan kemitraan nyata.</p>}
          </div>
        </div>
        {d.allowed_actions.length > 0 ? (
          <div className="space-y-3 border-t border-line-200 pt-4">
            {needsEvidence && <Field id="evidence" label="Rujukan bukti verifikasi" hint="Wajib. Mis. nomor/tanggal surat, berita acara. Jangan diisi bila belum ada bukti nyata.">
              <input id="evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} className={inputCls} /></Field>}
            {(needsNote || needsEvidence) && <Field id="vnote" label="Catatan (wajib untuk menolak/menangguhkan)">
              <textarea id="vnote" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></Field>}
            <div className="flex flex-wrap gap-2">{d.allowed_actions.map((a) => (
              <button key={a} disabled={!!busy} onClick={() => act(a)} className={["submit", "verify", "publish_listing"].includes(a) ? btnPrimary : btnGhost}>
                {busy === "act-" + a ? "…" : PARTNER_ACTION_LABEL[a]}</button>))}</div>
          </div>
        ) : <p className="border-t border-line-200 pt-4 text-sm text-slate-600">Tidak ada aksi yang tersedia untuk Anda pada status ini.{viewerRole === "admin" && d.members.some((m) => m.user_id === viewerId) ? " Anda anggota mitra ini, sehingga keputusan verifikasi harus dilakukan admin lain." : ""}</p>}
      </Section>

      <Section id="profil" title="Profil organisasi dan penanggung jawab" description={editable ? "Dapat diubah selama berstatus draf atau ditolak." : "Profil terkunci setelah diajukan. Hubungi admin bila perlu perubahan."}>
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <Field id="p-name" label="Nama organisasi"><input id="p-name" name="name" defaultValue={d.name} disabled={!editable} required className={inputCls} /></Field>
          <Field id="p-type" label="Jenis"><select id="p-type" name="partner_type" defaultValue={d.partner_type} disabled={!editable} className={inputCls}>
            {Object.entries(PARTNER_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field id="p-region" label="Wilayah"><input id="p-region" name="region" defaultValue={d.region ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="p-city" label="Kota"><input id="p-city" name="city" defaultValue={d.city ?? ""} disabled={!editable} className={inputCls} /></Field>
          <div className="sm:col-span-2"><Field id="p-desc" label="Deskripsi resmi organisasi"><textarea id="p-desc" name="official_description" rows={4} defaultValue={d.official_description ?? ""} disabled={!editable} className={inputCls} /></Field></div>
          <Field id="p-rn" label="Penanggung jawab"><input id="p-rn" name="responsible_name" defaultValue={d.responsible_name ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="p-rr" label="Peran penanggung jawab"><input id="p-rr" name="responsible_role" defaultValue={d.responsible_role ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="p-ce" label="Email kontak resmi"><input id="p-ce" name="contact_email" type="email" defaultValue={d.contact_email ?? ""} disabled={!editable} className={inputCls} /></Field>
          <Field id="p-cp" label="Telepon"><input id="p-cp" name="contact_phone" defaultValue={d.contact_phone ?? ""} disabled={!editable} className={inputCls} /></Field>
          {editable && <div className="sm:col-span-2"><button disabled={!!busy} className={btnPrimary}>{busy === "profile" ? "Menyimpan…" : "Simpan profil"}</button></div>}
        </form>
        {d.verification_status === "verified" && can && (
          <label className="flex items-start gap-2 border-t border-line-200 pt-4 text-sm">
            <input type="checkbox" checked={d.public_listing_consent} disabled={!!busy} className="mt-1"
              onChange={(e) => call("consent", "PATCH", `/studio/partners/${d.id}`, { public_listing_consent: e.target.checked }, "Preferensi direktori publik diperbarui.")} />
            <span>Organisasi menyetujui dicantumkan di direktori publik SILATARA. Pencantuman dilakukan admin setelah persetujuan ini.</span>
          </label>)}
      </Section>

      <Section id="anggota" title="Anggota dan instruktur terhubung" description="Penanggung jawab (manager) dapat menambah instruktur. Pengguna harus sudah mendaftar dan memiliki peran instruktur.">
        <ul className="divide-y divide-line-200 rounded-xl border border-line-200">
          {d.members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span><span className="font-medium">{m.name}</span> <span className="text-slate-600">· {m.email}</span></span>
              <span className="flex items-center gap-3"><span className="text-slate-600">{m.role === "manager" ? "Penanggung jawab" : "Instruktur"}</span>
                {can && <button aria-label={`Keluarkan ${m.name}`} disabled={!!busy} onClick={() => call("rm", "DELETE", `/studio/partners/${d.id}/members/${m.user_id}`, undefined, "Anggota dikeluarkan.")} className="text-clay-600 hover:underline"><Trash2 aria-hidden className="h-4 w-4" /></button>}</span>
            </li>))}
        </ul>
        {can && (
          <form onSubmit={addMember} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1"><Field id="m-email" label="Email pengguna"><input id="m-email" name="email" type="email" required className={inputCls} /></Field></div>
            <Field id="m-role" label="Peran"><select id="m-role" name="role" className={inputCls}><option value="instructor">Instruktur</option><option value="manager">Penanggung jawab</option></select></Field>
            <button disabled={!!busy} className={btnGhost}>Tambah anggota</button>
          </form>)}
      </Section>

      <Section id="tradisi" title="Cakupan tradisi" description="Gerakan hanya dapat didokumentasikan untuk tradisi yang termasuk cakupan mitra. Mengubah cakupan mitra terverifikasi memerlukan admin.">
        {d.traditions.length === 0 ? <p className="text-sm text-slate-600">Belum ada tradisi dalam cakupan.</p> : (
          <ul className="flex flex-wrap gap-2">{d.traditions.map((t) => (
            <li key={t.id} className="inline-flex items-center gap-2 rounded-full bg-parchment-100 px-3 py-1 text-sm">{t.name}
              {can && <button aria-label={`Hapus ${t.name} dari cakupan`} disabled={!!busy} onClick={() => call("tr", "DELETE", `/studio/partners/${d.id}/traditions/${t.id}`, undefined, "Tradisi dihapus dari cakupan.")} className="text-clay-600">×</button>}</li>))}</ul>)}
        {can && traditionOptions.length > 0 && (
          <div className="flex flex-wrap items-end gap-3">
            <Field id="add-trad" label="Tambah tradisi (yang sudah terbit)"><select id="add-trad" defaultValue="" className={inputCls} onChange={(e) => { if (e.target.value) { void call("tr", "PUT", `/studio/partners/${d.id}/traditions/${e.target.value}`, undefined, "Tradisi ditambahkan."); e.target.value = ""; } }}>
              <option value="">Pilih tradisi</option>{traditionOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          </div>)}
      </Section>

      <Section id="dokumen" title="Dokumen persetujuan (privat)" description="PDF, JPG, atau PNG hingga 10 MB. Dokumen tidak pernah tersedia lewat tautan publik; hanya penanggung jawab, kurator, dan admin yang dapat mengunduhnya.">
        {d.documents.length === 0 ? <p className="text-sm text-slate-600">Belum ada dokumen.</p> : (
          <ul className="divide-y divide-line-200 rounded-xl border border-line-200">{d.documents.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
              <span><span className="font-medium">{DOC_KIND[x.kind]}</span> <span className="text-slate-600">· {x.filename} · {formatBytes(x.size_bytes)} · {formatDateTime(x.created_at)}</span>{x.description && <span className="block text-slate-600">{x.description}</span>}</span>
              <span className="flex items-center gap-3">
                <a href={`/api/v1/studio/partner-documents/${x.id}/file`} className="inline-flex items-center gap-1 underline"><FileDown aria-hidden className="h-4 w-4" />Unduh</a>
                {editable && can && <button aria-label={`Hapus ${x.filename}`} disabled={!!busy} onClick={() => call("deldoc", "DELETE", `/studio/partner-documents/${x.id}`, undefined, "Dokumen dihapus.")} className="text-clay-600"><Trash2 aria-hidden className="h-4 w-4" /></button>}</span>
            </li>))}</ul>)}
        {can && d.verification_status !== "suspended" && (
          <form onSubmit={upload} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field id="d-kind" label="Jenis dokumen"><select id="d-kind" name="kind" defaultValue="approval_letter" className={inputCls}>{Object.entries(DOC_KIND).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field id="d-file" label="Berkas"><input id="d-file" ref={fileRef} name="file" type="file" accept="application/pdf,image/png,image/jpeg" required className={inputCls} /></Field>
            <button disabled={!!busy} className={btnGhost}>{busy === "doc" ? "Mengunggah…" : "Unggah"}</button>
            <div className="sm:col-span-3"><Field id="d-desc" label="Keterangan (opsional)"><input id="d-desc" name="description" maxLength={300} className={inputCls} /></Field></div>
          </form>)}
      </Section>

      <Section id="riwayat" title="Riwayat verifikasi">
        {history.length === 0 ? <p className="text-sm text-slate-600">Belum ada riwayat.</p> : (
          <ol className="space-y-3 text-sm">{history.map((e, i) => (
            <li key={i} className="border-l-2 border-line-200 pl-3"><p className="font-medium">{PARTNER_ACTION_LABEL[e.action] ?? actionLabel("partner." + e.action)}{e.from_status ? <span className="font-normal text-slate-600"> · {e.from_status} → {e.to_status}</span> : null}</p>
              <p className="text-slate-600">{e.actor ?? "-"} · {formatDateTime(e.created_at)}</p>
              {e.note && <p>Catatan: {e.note}</p>}{e.evidence_ref && <p>Bukti: {e.evidence_ref}</p>}</li>))}</ol>)}
      </Section>
    </div>
  );
}
