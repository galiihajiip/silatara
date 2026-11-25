"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Image as ImageIcon, Trash2 } from "lucide-react";
import { Notice } from "@/components/Notice";
import { clientRequest } from "@/lib/client-api";
import { CONSENT_TONE, formatBytes, LICENSE_LABEL } from "@/lib/format";
import { clientUpload, describeError } from "@/lib/studio-api";
import type { StudioMedia } from "@/lib/types";
import { btnGhost, btnPrimary, Field, inputCls, RefImage } from "./bits";

const ACCESS_LABEL: Record<string, string> = {
  private: "Privat: pengunggah, penanggung jawab, kurator, admin", reviewers: "Peninjau: semua anggota mitra, kurator, admin", public: "Publik: setelah gerakan terbit",
};

export function MediaPanel({ movementId, canUpload, onCount }: { movementId: string; canUpload: boolean; onCount: (n: number) => void }) {
  const [items, setItems] = useState<StudioMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const [tick, setTick] = useState(0);
  const load = useCallback(async () => { setTick((t) => t + 1); }, []);
  useEffect(() => {
    let alive = true;
    clientRequest<StudioMedia[]>("GET", `/studio/movements/${movementId}/media`).then((r) => {
      if (!alive) return;
      if (r.ok) { setItems(r.data); onCount(r.data.length); }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [movementId, onCount, tick]);

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // React menolkan currentTarget setelah await
    const form = new FormData(formEl);
    if (!(form.get("file") as File)?.size) return setMsg({ kind: "error", text: "Pilih berkas terlebih dahulu." });
    form.set("declaration_confirmed", form.get("declaration_confirmed") ? "true" : "false");
    setBusy("upload"); setMsg(null);
    const r = await clientUpload<StudioMedia>(`/studio/movements/${movementId}/media`, form);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    formEl.reset();
    setMsg({ kind: "success", text: "Media tersimpan secara privat dan menunggu verifikasi izin." });
    await load();
  }
  async function patch(id: string, body: Record<string, unknown>, ok: string) {
    setBusy(id); setMsg(null);
    const r = await clientRequest<StudioMedia>("PATCH", `/studio/media/${id}`, body);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setMsg({ kind: "success", text: ok });
    await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus media ini beserta berkasnya? Tindakan ini tidak dapat dibatalkan.")) return;
    setBusy(id);
    const r = await clientRequest("DELETE", `/studio/media/${id}`);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setMsg({ kind: "success", text: "Media dihapus." });
    await load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Media referensi bersifat opsional, dokumentasi teks tanpa media tetap sah. Berkas disimpan privat, tidak pernah lewat tautan publik, dan hanya dapat dibuka lewat otorisasi. Jangan mengunggah rekaman orang lain tanpa izin.</p>
      {loading ? <p className="text-sm text-slate-600">Memuat…</p> : items.length === 0 ? <p className="text-sm text-slate-600">Belum ada media.</p> : (
        <ul className="space-y-3">{items.map((m) => (
          <li key={m.id} className="rounded-xl border border-line-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">{m.kind === "video" ? <Film aria-hidden className="h-4 w-4 text-sage-500" /> : <ImageIcon aria-hidden className="h-4 w-4 text-sage-500" />}{m.is_demo ? "[DEMO] " : ""}{m.title}</p>
                <p className="text-xs text-slate-600">{m.filename} · {formatBytes(m.size_bytes)} · diunggah {m.uploader ?? "-"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${CONSENT_TONE[m.consent_status]}`}>{m.consent_label}</span>
            </div>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div><dt className="inline font-medium">Pemegang hak: </dt><dd className="inline">{m.rights_holder}</dd></div>
              <div><dt className="inline font-medium">Jenis izin: </dt><dd className="inline">{LICENSE_LABEL[m.license_type]}</dd></div>
              <div className="sm:col-span-2"><dt className="inline font-medium">Sumber: </dt><dd className="inline">{m.source_description}</dd></div>
              <div className="sm:col-span-2"><dt className="inline font-medium">Lingkup penggunaan: </dt><dd className="inline">{m.usage_scope}</dd></div>
              <div><dt className="inline font-medium">Akses: </dt><dd className="inline">{ACCESS_LABEL[m.access_level]}</dd></div>
              {m.retention_until && <div><dt className="inline font-medium">Disimpan hingga: </dt><dd className="inline">{m.retention_until}</dd></div>}
              {m.permission_evidence_ref && <div className="sm:col-span-2"><dt className="inline font-medium">Bukti izin: </dt><dd className="inline">{m.permission_evidence_ref}</dd></div>}
            </dl>
            {m.kind === "video" && m.consent_status !== "rejected" && m.consent_status !== "revoked" && (
              <video controls preload="metadata" src={m.url} aria-label={`Pratinjau ${m.title}`} className="mt-3 max-h-64 w-full rounded-lg bg-ink-950" />)}
            {m.kind === "image" && <RefImage src={m.url} alt={m.title} className="mt-3 max-h-64 rounded-lg" />}
            <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-line-200 pt-3">
              {m.can_decide && m.consent_status === "declared" && (
                <>
                  <div className="min-w-[14rem] flex-1"><Field id={`ev-${m.id}`} label="Bukti izin untuk verifikasi"><input id={`ev-${m.id}`} value={evidence[m.id] ?? ""} onChange={(e) => setEvidence({ ...evidence, [m.id]: e.target.value })} className={inputCls} placeholder="mis. surat izin, tanggal" /></Field></div>
                  <button disabled={busy === m.id} onClick={() => patch(m.id, { consent_status: "verified", permission_evidence_ref: evidence[m.id] || undefined }, "Izin media diverifikasi.")} className={btnPrimary}>Verifikasi izin</button>
                  <button disabled={busy === m.id} onClick={() => patch(m.id, { consent_status: "rejected" }, "Izin media ditolak.")} className={btnGhost}>Tolak</button>
                </>)}
              {m.can_decide && m.consent_status === "verified" && (
                <>
                  <div><label htmlFor={`ac-${m.id}`} className="mb-1 block text-sm font-medium">Akses</label>
                    <select id={`ac-${m.id}`} value={m.access_level} disabled={busy === m.id} onChange={(e) => patch(m.id, { access_level: e.target.value }, "Akses media diperbarui.")} className={inputCls}>
                      {Object.entries(ACCESS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                  <button disabled={busy === m.id} onClick={() => patch(m.id, { consent_status: "revoked" }, "Izin media dicabut; media ditutup.")} className={btnGhost}>Cabut izin</button>
                </>)}
              {!m.can_decide && m.consent_status === "declared" && <p className="text-xs text-slate-600">Verifikasi izin dilakukan penanggung jawab mitra atau kurator selain pengunggah.</p>}
              {m.kind === "video" && m.consent_status !== "rejected" && m.consent_status !== "revoked" && <Link href={`/app/studio/movements/${movementId}/calibration?media=${m.id}`} className="text-sm underline">Buka di Calibration Workspace</Link>}
              {m.can_delete && <button aria-label={`Hapus ${m.title}`} disabled={busy === m.id} onClick={() => remove(m.id)} className="ml-auto text-clay-600"><Trash2 aria-hidden className="h-4 w-4" /></button>}
            </div>
          </li>))}</ul>)}

      {canUpload && (
        <form onSubmit={upload} className="space-y-3 rounded-xl border border-line-200 bg-parchment-100/50 p-4">
          <h3 className="font-medium">Unggah media referensi</h3>
          <p className="text-xs text-slate-600">MP4/WebM hingga 100 MB, atau JPEG/PNG/WebP hingga 10 MB. Jenis berkas diperiksa dari isinya.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="mu-title" label="Judul" required><input id="mu-title" name="title" required maxLength={200} className={inputCls} /></Field>
            <Field id="mu-file" label="Berkas" required><input id="mu-file" ref={fileRef} name="file" type="file" accept="video/mp4,video/webm,image/jpeg,image/png,image/webp" required className={inputCls} /></Field>
            <Field id="mu-holder" label="Pemegang hak" required><input id="mu-holder" name="rights_holder" required maxLength={300} className={inputCls} /></Field>
            <Field id="mu-lic" label="Jenis izin" required><select id="mu-lic" name="license_type" required defaultValue="" className={inputCls}><option value="" disabled>Pilih</option>{Object.entries(LICENSE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field id="mu-src" label="Sumber media" required hint="Siapa/kapan/di mana direkam atau dibuat."><textarea id="mu-src" name="source_description" required rows={2} className={inputCls} /></Field></div>
            <div className="sm:col-span-2"><Field id="mu-scope" label="Lingkup penggunaan yang diizinkan" required><textarea id="mu-scope" name="usage_scope" required rows={2} className={inputCls} /></Field></div>
            <Field id="mu-ret" label="Simpan hingga (opsional)" hint="Berkas dihapus setelah tanggal ini."><input id="mu-ret" name="retention_until" type="date" className={inputCls} /></Field>
          </div>
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="declaration_confirmed" required className="mt-1" /><span>Saya menyatakan berhak atau berizin menggunakan media ini sesuai lingkup di atas, dan orang yang tampil di dalamnya telah menyetujui.</span></label>
          <button disabled={!!busy} className={btnPrimary}>{busy === "upload" ? "Mengunggah…" : "Unggah media"}</button>
        </form>)}
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>
    </div>
  );
}
