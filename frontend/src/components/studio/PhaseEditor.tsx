"use client";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { StudioPhase } from "@/lib/types";
import { btnGhost, Field, inputCls, splitTags } from "./bits";

export const emptyPhase = (): StudioPhase => ({ name: "", instruction: "", body_focus: [], safety_note: null, start_ms: null, end_ms: null });

/** Fase berurutan; jumlah dan definisi sepenuhnya ditentukan instruktur (tidak ada fase bawaan). */
export function PhaseEditor({ phases, onChange, disabled }: { phases: StudioPhase[]; onChange: (p: StudioPhase[]) => void; disabled: boolean }) {
  const set = (i: number, patch: Partial<StudioPhase>) => onChange(phases.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const move = (i: number, d: -1 | 1) => { const n = [...phases]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); };
  const secs = (v: number | null) => (v === null ? "" : String(v / 1000));
  const toMs = (s: string) => (s.trim() === "" || Number.isNaN(Number(s)) ? null : Math.max(0, Math.round(Number(s) * 1000)));
  return (
    <div className="space-y-4">
      {phases.length === 0 && <p className="rounded-xl border border-dashed border-line-200 px-4 py-6 text-center text-sm text-slate-600">Belum ada fase. Tambahkan fase sesuai cara perguruan Anda memecah gerakan, jumlah dan namanya sepenuhnya Anda tentukan.</p>}
      <ol className="space-y-4">
        {phases.map((p, i) => (
          <li key={i} className="rounded-xl border border-line-200 bg-parchment-100/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">Fase {i + 1}</h3>
              {!disabled && <div className="flex items-center gap-1">
                <button type="button" aria-label={`Naikkan fase ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg p-1.5 hover:bg-line-200 disabled:opacity-40"><ArrowUp aria-hidden className="h-4 w-4" /></button>
                <button type="button" aria-label={`Turunkan fase ${i + 1}`} disabled={i === phases.length - 1} onClick={() => move(i, 1)} className="rounded-lg p-1.5 hover:bg-line-200 disabled:opacity-40"><ArrowDown aria-hidden className="h-4 w-4" /></button>
                <button type="button" aria-label={`Hapus fase ${i + 1}`} onClick={() => onChange(phases.filter((_, k) => k !== i))} className="rounded-lg p-1.5 text-clay-600 hover:bg-line-200"><Trash2 aria-hidden className="h-4 w-4" /></button></div>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id={`ph-name-${i}`} label="Nama fase" required><input id={`ph-name-${i}`} value={p.name} disabled={disabled} maxLength={200} onChange={(e) => set(i, { name: e.target.value })} className={inputCls} /></Field>
              <Field id={`ph-focus-${i}`} label="Fokus bagian tubuh" hint="Pisahkan dengan koma."><input id={`ph-focus-${i}`} value={p.body_focus.join(", ")} disabled={disabled} onChange={(e) => set(i, { body_focus: splitTags(e.target.value) })} className={inputCls} /></Field>
              <div className="sm:col-span-2"><Field id={`ph-ins-${i}`} label="Instruksi (ditulis instruktur)" required><textarea id={`ph-ins-${i}`} rows={3} value={p.instruction} disabled={disabled} onChange={(e) => set(i, { instruction: e.target.value })} className={inputCls} /></Field></div>
              <div className="sm:col-span-2"><Field id={`ph-safe-${i}`} label="Catatan keselamatan fase (opsional)"><input id={`ph-safe-${i}`} value={p.safety_note ?? ""} disabled={disabled} onChange={(e) => set(i, { safety_note: e.target.value || null })} className={inputCls} /></Field></div>
              <Field id={`ph-s-${i}`} label="Mulai di video referensi (detik)" hint="Opsional; dapat diisi dari Calibration Workspace."><input id={`ph-s-${i}`} inputMode="decimal" value={secs(p.start_ms)} disabled={disabled} onChange={(e) => set(i, { start_ms: toMs(e.target.value) })} className={inputCls} /></Field>
              <Field id={`ph-e-${i}`} label="Selesai di video referensi (detik)"><input id={`ph-e-${i}`} inputMode="decimal" value={secs(p.end_ms)} disabled={disabled} onChange={(e) => set(i, { end_ms: toMs(e.target.value) })} className={inputCls} /></Field>
            </div>
          </li>))}
      </ol>
      {!disabled && <button type="button" onClick={() => onChange([...phases, emptyPhase()])} className={`${btnGhost} inline-flex items-center gap-2`}><Plus aria-hidden className="h-4 w-4" />Tambah fase</button>}
    </div>
  );
}
