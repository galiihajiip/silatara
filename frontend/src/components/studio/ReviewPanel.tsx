"use client";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Notice } from "@/components/Notice";
import { StatusBadge } from "@/components/ui";
import { clientRequest } from "@/lib/client-api";
import { actionLabel, DOC_ACTION_LABEL, formatDateTime } from "@/lib/format";
import { describeError } from "@/lib/studio-api";
import type { DocAction, HistoryEntry, StudioMovement } from "@/lib/types";
import { btnGhost, btnPrimary, Field, inputCls } from "./bits";

export function ReviewPanel({ mv, history, onChange, beforeAction }: {
  mv: StudioMovement; history: HistoryEntry[]; onChange: (m: StudioMovement) => void; beforeAction: () => Promise<boolean>;
}) {
  const doc = mv.active_document!;
  const [note, setNote] = useState("");
  const [evidence, setEvidence] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const acts = doc.allowed_actions;
  const needsEvidence = acts.includes("approve") && !doc.is_demo;
  const needsNote = acts.some((a) => ["request_revision", "reject"].includes(a));

  async function run(a: DocAction) {
    setMsg(null);
    if (a === "submit" && !(await beforeAction())) return;
    setBusy(a);
    const r = await clientRequest<StudioMovement>("POST", `/studio/documents/${doc.id}/transition`, { action: a, note: note.trim() || undefined, evidence_ref: evidence.trim() || undefined });
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setNote("");
    onChange(r.data);
    setMsg({ kind: "success", text: `${DOC_ACTION_LABEL[a]}: berhasil.` });
  }
  const step = (ok: boolean, label: string, who: string | null, at: string | null) => (
    <li className="flex items-start gap-2 text-sm">{ok ? <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" /> : <Circle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />}
      <span>{label}{ok && (who || at) ? <span className="text-slate-600">, {[who, at ? formatDateTime(at) : null].filter(Boolean).join(", ")}</span> : <span className="text-slate-600">, belum</span>}</span></li>);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3"><StatusBadge status={doc.status} /><span className="text-sm text-slate-600">Versi {doc.version_no}{doc.is_author ? " · Anda penulis versi ini" : doc.author ? ` · penulis: ${doc.author}` : ""}</span></div>
      {doc.review_note && ["needs_revision", "rejected"].includes(doc.status) && (
        <div role="note" className="rounded-xl border border-bronze-700/30 bg-bronze-500/10 px-4 py-3 text-sm"><p className="font-medium">{doc.status === "rejected" ? "Alasan penolakan" : "Catatan revisi dari peninjau"}</p><p className="mt-1 whitespace-pre-line">{doc.review_note}</p></div>)}
      <ol className="space-y-1.5" aria-label="Tahapan review">
        {step(!["draft", "needs_revision", "rejected"].includes(doc.status), "Diajukan oleh penulis", doc.author, null)}
        {step(!!doc.curator_reviewed_at, "Kelengkapan & asal-usul ditinjau kurator", doc.curator_reviewed_by, doc.curator_reviewed_at)}
        {step(!!doc.partner_confirmed_at, "Dikonfirmasi penanggung jawab mitra", doc.partner_confirmed_by, doc.partner_confirmed_at)}
        {step(["verified", "published"].includes(doc.status) || !!doc.approved_at, "Disetujui", doc.approved_by, doc.approved_at)}
        {step(!!doc.published_at, "Diterbitkan oleh admin", null, doc.published_at)}
      </ol>
      {doc.approval_evidence_ref && <p className="text-sm"><span className="font-medium">Rujukan bukti persetujuan:</span> {doc.approval_evidence_ref}</p>}

      {acts.length > 0 ? (
        <div className="space-y-3 border-t border-line-200 pt-4">
          {needsEvidence && <Field id="rv-ev" label="Rujukan bukti persetujuan" hint="Wajib untuk konten non-demo. Mis. berita acara validasi mitra. Jangan diisi bila belum ada bukti nyata."><input id="rv-ev" value={evidence} onChange={(e) => setEvidence(e.target.value)} className={inputCls} /></Field>}
          {(needsNote || acts.includes("approve") || acts.includes("curator_review") || acts.includes("confirm_partner")) && <Field id="rv-note" label="Catatan" hint={needsNote ? "Wajib saat meminta revisi atau menolak." : "Opsional."}><textarea id="rv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></Field>}
          <div className="flex flex-wrap gap-2">{acts.map((a) => (
            <button key={a} disabled={!!busy} onClick={() => run(a)} className={["submit", "approve", "publish", "curator_review", "confirm_partner"].includes(a) ? btnPrimary : btnGhost}>{busy === a ? "…" : DOC_ACTION_LABEL[a]}</button>))}</div>
        </div>
      ) : <p className="border-t border-line-200 pt-4 text-sm text-slate-600">{doc.is_author && doc.status === "pending_review" ? "Menunggu tinjauan. Anda tidak dapat meninjau, menyetujui, atau menerbitkan tulisan Anda sendiri, termasuk sebagai admin." : "Tidak ada aksi yang tersedia untuk Anda pada status ini."}</p>}
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

      <div className="border-t border-line-200 pt-4">
        <h3 className="mb-2 font-medium">Versi</h3>
        <ul className="space-y-2 text-sm">{mv.versions.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-2"><span className="font-medium">v{v.version_no}</span><StatusBadge status={v.status} />{v.is_current && <span className="rounded-full bg-forest-700/10 px-2 py-0.5 text-xs">tayang</span>}
            <span className="text-slate-600">{v.author ?? "-"}{v.published_at ? ` · terbit ${formatDateTime(v.published_at)}` : ""}</span>{v.changelog && <span className="block w-full text-slate-600">Perubahan: {v.changelog}</span>}</li>))}</ul>
      </div>
      <div className="border-t border-line-200 pt-4">
        <h3 className="mb-2 font-medium">Riwayat keputusan dan perubahan</h3>
        {history.length === 0 ? <p className="text-sm text-slate-600">Belum ada riwayat.</p> : (
          <ol className="space-y-2 text-sm">{history.slice(0, 30).map((h, i) => (
            <li key={i} className="border-l-2 border-line-200 pl-3"><p className="font-medium">{actionLabel(h.action)}{typeof h.detail?.version === "number" ? ` · v${h.detail.version}` : ""}</p>
              <p className="text-xs text-slate-600">{h.actor ?? "-"} · {formatDateTime(h.created_at)}</p>{typeof h.detail?.note === "string" && h.detail.note && <p className="text-slate-600">“{h.detail.note}”</p>}</li>))}</ol>)}
      </div>
    </div>
  );
}
