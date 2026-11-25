"use client";
import { CheckCircle2, Circle } from "lucide-react";
import type { Readiness } from "@/lib/types";

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-bronze-500 disabled:bg-[#F4F5F7] disabled:text-slate-500";
export const btnPrimary =
  "rounded-full bg-forest-700 px-5 py-2.5 text-sm font-medium text-paper-50 shadow-sm shadow-orange-950/15 transition-all hover:bg-forest-900 disabled:opacity-60";
export const btnGhost =
  "rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-forest-700/30 hover:bg-parchment-100 hover:text-forest-900 disabled:opacity-60";

export function Field({ id, label, hint, children, required }: { id: string; label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required && <span aria-hidden className="text-clay-600"> *</span>}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-24 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6"
    >
      <h2 id={`${id}-h`} className="text-lg font-bold tracking-tight text-forest-900">{title}</h2>
      {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Checklist({ items, label }: { items: Readiness[]; label: string }) {
  const done = items.filter((i) => i.ok).length;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span aria-label={`${done} dari ${items.length} terpenuhi`} className="font-medium tabular-nums text-bronze-700">{done}/{items.length}</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#6d1b11] to-[#ea580c]" style={{ width: `${items.length ? (100 * done) / items.length : 0}%` }} />
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((i) => (
          <li key={i.key} className="flex items-start gap-2">
            {i.ok ? <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-bronze-500" /> : <Circle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
            <span className={i.ok ? "text-slate-500" : "text-slate-900"}>{i.label}<span className="sr-only">{i.ok ? ", terpenuhi" : ", belum terpenuhi"}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tag bebas (dipisah koma) -> array. */
export function splitTags(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

/** Gambar referensi dari endpoint terotorisasi (bukan aset statis, jadi `next/image` tidak relevan). */
export function RefImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
