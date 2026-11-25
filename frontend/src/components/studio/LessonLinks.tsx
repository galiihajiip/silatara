"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Notice } from "@/components/Notice";
import { StatusBadge } from "@/components/ui";
import { clientRequest } from "@/lib/client-api";
import { describeError } from "@/lib/studio-api";
import type { LinkableLesson, LinkedLesson, StudioMovement } from "@/lib/types";

export function LessonLinks({ movementId, linked, onChange, canEdit }: { movementId: string; linked: LinkedLesson[]; onChange: (m: StudioMovement) => void; canEdit: boolean }) {
  const [options, setOptions] = useState<LinkableLesson[]>([]);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    clientRequest<LinkableLesson[]>("GET", `/studio/movements/${movementId}/lessons`).then((r) => { if (alive && r.ok) setOptions(r.data); });
    return () => { alive = false; };
  }, [movementId, linked.length]);
  async function toggle(id: string, on: boolean) {
    setBusy(true); setMsg(null);
    const r = await clientRequest<StudioMovement>(on ? "PUT" : "DELETE", `/studio/movements/${movementId}/lessons/${id}`);
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    onChange(r.data);
    setMsg({ kind: "success", text: on ? "Pelajaran ditautkan." : "Tautan dilepas." });
  }
  const free = options.filter((o) => !o.linked);
  return (
    <div className="space-y-3">
      {linked.length === 0 ? <p className="text-sm text-slate-600">Belum ditautkan ke pelajaran.</p> : (
        <ul className="divide-y divide-line-200 rounded-xl border border-line-200">{linked.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
            <span><span className="font-medium">{l.title}</span> <span className="text-slate-600">· {l.course_title}</span></span>
            <span className="flex items-center gap-3"><StatusBadge status={l.status} />
              <Link className="underline" href={`/app/manage/lessons/${l.id}`}>Kelola</Link>
              {canEdit && <button disabled={busy} onClick={() => toggle(l.id, false)} className="text-clay-600 underline">Lepas</button>}</span></li>))}</ul>)}
      {canEdit && free.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1"><label htmlFor="lesson-pick" className="mb-1 block text-sm font-medium">Tautkan ke pelajaran</label>
            <select id="lesson-pick" defaultValue="" onChange={(e) => { if (e.target.value) { void toggle(e.target.value, true); e.target.value = ""; } }} className="w-full rounded-xl border border-line-200 bg-paper-50 px-3 py-2.5">
              <option value="">Pilih pelajaran (draf)</option>{free.map((o) => <option key={o.id} value={o.id}>{o.course_title} › {o.title}{o.status !== "draft" ? ` (${o.status})` : ""}</option>)}</select></div>
        </div>)}
      {canEdit && options.length === 0 && <p className="text-xs text-slate-600">Tidak ada pelajaran milik mitra dan tradisi yang sama yang dapat ditautkan. Buat kurikulum dan pelajaran di <Link className="underline" href="/app/manage/courses">Kelola Konten</Link> terlebih dahulu.</p>}
      <p className="text-xs text-slate-600">Pelajaran yang sudah diajukan/terbit harus ditarik ke draf sebelum tautan gerakannya diubah. Practice Studio hanya terbuka bila gerakan terbit dengan kategori solo pemula.</p>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>
    </div>
  );
}
