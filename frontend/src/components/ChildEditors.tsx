"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientRequest } from "@/lib/client-api";
import { Notice } from "@/components/Notice";

const inp = "rounded-xl border border-line-200 bg-paper-50 px-3 py-2";
type Row = Record<string, unknown>;

export function ModulesEditor({ courseId, modules, canEdit }: { courseId: string; modules: Row[]; canEdit: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(String(modules.length + 1));
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await clientRequest("POST", "/manage/modules", { course_id: courseId, title: title.trim(), order_index: Number(order) });
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    setTitle(""); setMsg({ kind: "success", text: "Modul ditambahkan." }); router.refresh();
  }
  async function del(id: string) {
    const r = await clientRequest("DELETE", `/manage/modules/${id}`);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    router.refresh();
  }
  return (
    <section aria-labelledby="mod"><h2 id="mod" className="mb-2 font-semibold">Modul</h2>
      {modules.length === 0 ? <p className="text-sm text-slate-600">Belum ada modul.</p> :
        <ol className="mb-3 space-y-1">{modules.map((m) => <li key={String(m.id)} className="flex items-center justify-between rounded-lg border border-line-200 px-3 py-2">
          <span>{String(m.order_index)}. {String(m.title)}</span>
          {canEdit && <button className="text-sm text-clay-600 underline" onClick={() => del(String(m.id))}>Hapus</button>}</li>)}</ol>}
      {canEdit && <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <div><label htmlFor="mt" className="block text-sm">Judul modul</label><input id="mt" className={inp} required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label htmlFor="mo" className="block text-sm">Urutan</label><input id="mo" type="number" min={0} className={`${inp} w-24`} value={order} onChange={(e) => setOrder(e.target.value)} /></div>
        <button className="rounded-xl border border-line-200 px-4 py-2 hover:bg-parchment-100">Tambah modul</button></form>}
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice></section>
  );
}

export function MaterialsEditor({ lessonId, materials, canEdit }: { lessonId: string; materials: Row[]; canEdit: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ title: "", content: "", attribution_text: "" });
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await clientRequest("POST", "/manage/materials", { lesson_id: lessonId, kind: "text", title: f.title.trim(), content: f.content.trim() || undefined, attribution_text: f.attribution_text.trim() });
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    setF({ title: "", content: "", attribution_text: "" }); setMsg({ kind: "success", text: "Materi ditambahkan." }); router.refresh();
  }
  async function del(id: string) {
    const r = await clientRequest("DELETE", `/manage/materials/${id}`);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    router.refresh();
  }
  return (
    <section aria-labelledby="mat"><h2 id="mat" className="mb-2 font-semibold">Materi pendukung (teks)</h2>
      <p className="mb-2 text-xs text-slate-600">Hanya teks beratribusi. Unggah media/tautan menunggu mekanisme izin mitra.</p>
      {materials.length === 0 ? <p className="text-sm text-slate-600">Belum ada materi.</p> :
        <ul className="mb-3 space-y-1">{materials.map((m) => <li key={String(m.id)} className="flex items-center justify-between rounded-lg border border-line-200 px-3 py-2">
          <span>{String(m.title)} <span className="text-xs text-slate-600">Atribusi: {String(m.attribution_text)}</span></span>
          {canEdit && <button className="text-sm text-clay-600 underline" onClick={() => del(String(m.id))}>Hapus</button>}</li>)}</ul>}
      {canEdit && <form onSubmit={add} className="space-y-2">
        <div><label htmlFor="xt" className="block text-sm">Judul</label><input id="xt" className={`${inp} w-full`} required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><label htmlFor="xc" className="block text-sm">Isi</label><textarea id="xc" rows={3} className={`${inp} w-full`} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} /></div>
        <div><label htmlFor="xa" className="block text-sm">Atribusi (wajib)</label><input id="xa" className={`${inp} w-full`} required value={f.attribution_text} onChange={(e) => setF({ ...f, attribution_text: e.target.value })} /></div>
        <button className="rounded-xl border border-line-200 px-4 py-2 hover:bg-parchment-100">Tambah materi</button></form>}
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice></section>
  );
}
