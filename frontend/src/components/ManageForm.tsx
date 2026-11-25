"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clientRequest } from "@/lib/client-api";
import { MANAGE_FIELDS, toPayload, type Field } from "@/lib/manage-config";
import { Notice } from "@/components/Notice";
import type { ManageDetail, Page } from "@/lib/types";

type Opt = { value: string; label: string };
const cls = "w-full rounded-xl border border-line-200 bg-paper-50 px-3 py-2.5 disabled:bg-parchment-100";
// Instruktur tidak boleh mengelola tradisi/mitra -> pakai katalog publik (hanya yang sudah terbit).
const PUBLIC_REF: Record<string, string> = { traditions: "/traditions", partners: "/partners", instructors: "/instructors", movements: "/movements" };

function useOptions(f: Field, role: string, courseId: string | undefined) {
  const [opts, setOpts] = useState<Opt[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (f.ref === "modules") {
        if (!courseId) return setOpts([]);
        const r = await clientRequest<ManageDetail>("GET", `/manage/courses/${courseId}`);
        if (!alive) return;
        if (!r.ok) return setErr(r.error);
        setOpts((r.data.modules ?? []).map((m) => ({ value: String(m.id), label: String(m.title) })));
        return;
      }
      const staff = role === "curator" || role === "admin";
      const canManage = (staff || f.ref === "courses") && f.ref !== "movements"; // gerakan dikelola di Studio; di sini hanya yang terbit
      const path = canManage ? `/manage/${f.ref}?page_size=100` : `${PUBLIC_REF[f.ref!]}?page_size=100`;
      const r = await clientRequest<Page<Record<string, unknown>>>("GET", path);
      if (!alive) return;
      if (!r.ok) return setErr(r.error);
      const key = f.labelKey ?? "title";
      setOpts(r.data.items.map((i) => ({ value: String(i.id), label: String(i[key] ?? i.title ?? i.name ?? i.id) })));
    })();
    return () => { alive = false; };
  }, [f.ref, f.labelKey, role, courseId]);
  return { opts, err };
}

function RefSelect({ f, value, onChange, role, courseId, disabled }: {
  f: Field; value: string; onChange: (v: string) => void; role: string; courseId?: string; disabled: boolean;
}) {
  const { opts, err } = useOptions(f, role, courseId);
  return (
    <>
      <select id={f.name} className={cls} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} required={f.required}>
        <option value="">{f.required ? "Pilih" : "Tidak ada"}</option>
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {err && <p className="mt-1 text-sm text-clay-600">Gagal memuat pilihan: {err}</p>}
      {!err && opts.length === 0 && <p className="mt-1 text-xs text-slate-600">Belum ada pilihan tersedia{role === "instructor" && f.ref !== "courses" ? " (hanya konten yang sudah terbit yang dapat dirujuk)" : ""}.</p>}
    </>
  );
}

export function ManageForm({ kind, role, detail }: { kind: string; role: string; detail?: ManageDetail }) {
  const router = useRouter();
  const fields = MANAGE_FIELDS[kind];
  const editing = !!detail;
  const readOnly = editing && !detail.can_edit;
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const v: Record<string, unknown> = {};
    for (const f of fields) {
      const cur = detail?.fields[f.name];
      v[f.name] = cur ?? (f.type === "checkbox" ? false : f.type === "select" ? f.options?.[0]?.value ?? "" : "");
    }
    return v;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const set = (n: string, v: unknown) => setValues((s) => ({ ...s, [n]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const errs: Record<string, string> = {};
    for (const f of fields) if (f.required && (values[f.name] === "" || values[f.name] == null)) errs[f.name] = "Wajib diisi.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return setMsg({ kind: "error", text: "Lengkapi kolom yang wajib." });
    setBusy(true);
    const payload = toPayload(fields, values, editing ? "patch" : "create");
    const r = editing
      ? await clientRequest<ManageDetail>("PATCH", `/manage/${kind}/${detail.fields.id}`, payload)
      : await clientRequest<ManageDetail>("POST", `/manage/${kind}`, payload);
    setBusy(false);
    if (!r.ok) {
      if (Array.isArray(r.details)) setFieldErrors(Object.fromEntries((r.details as { field: string; message: string }[]).map((d) => [d.field, d.message])));
      return setMsg({ kind: "error", text: r.error });
    }
    if (!editing) return router.push(`/app/manage/${kind}/${r.data.fields.id}`);
    setMsg({ kind: "success", text: "Perubahan disimpan." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {readOnly && <p className="rounded-xl bg-parchment-100 p-3 text-sm">Konten berstatus ini tidak dapat diedit. Tarik dari publik / kembalikan ke draf terlebih dahulu.</p>}
      {fields.map((f) => (
        <div key={f.name}>
          {f.type !== "checkbox" && <label htmlFor={f.name} className="mb-1 block text-sm font-medium">{f.label}{f.required && <span aria-hidden className="text-clay-600"> *</span>}</label>}
          {f.type === "textarea" ? <textarea id={f.name} rows={f.name === "body" ? 10 : 4} className={cls} disabled={readOnly} value={String(values[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} />
            : f.type === "select" ? <select id={f.name} className={cls} disabled={readOnly} value={String(values[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)}>{f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : f.type === "checkbox" ? <label className="flex items-center gap-2"><input id={f.name} type="checkbox" disabled={readOnly} checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked)} />{f.label}</label>
            : f.type === "ref" ? <RefSelect f={f} role={role} disabled={readOnly} value={String(values[f.name] ?? "")} onChange={(v) => set(f.name, v)} courseId={f.ref === "modules" ? String(values.course_id ?? "") || undefined : undefined} />
            : <input id={f.name} type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"} min={f.type === "number" ? 0 : undefined} className={cls} disabled={readOnly} value={String(values[f.name] ?? "")} onChange={(e) => set(f.name, e.target.value)} />}
          {f.help && <p className="mt-1 text-xs text-slate-600">{f.help}</p>}
          {fieldErrors[f.name] && <p className="mt-1 text-sm text-clay-600">{fieldErrors[f.name]}</p>}
        </div>
      ))}
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>
      {!readOnly && <button disabled={busy} className="rounded-xl bg-forest-700 px-5 py-3 font-medium text-paper-50 hover:bg-forest-900 disabled:opacity-60">{busy ? "Menyimpan…" : editing ? "Simpan perubahan" : "Simpan sebagai draf"}</button>}
    </form>
  );
}
