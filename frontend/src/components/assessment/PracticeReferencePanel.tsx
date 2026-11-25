"use client";
import { useState, type ReactNode } from "react";
import { ShieldAlert, Sparkles, Video } from "lucide-react";
import type { CriterionSpec } from "@/features/assessment/types";

type TabId = "player" | "criteria" | "safety";

export function PracticeReferencePanel({
  criteria,
  phaseCompletionWeight,
  disclaimer,
  children,
}: {
  criteria: CriterionSpec[];
  phaseCompletionWeight: number;
  disclaimer: string;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("player");
  const criteriaCount = criteria.length + 1;

  const tabs: { id: TabId; label: string; icon: typeof Video }[] = [
    { id: "player", label: "Peraga 3D", icon: Video },
    { id: "criteria", label: `Kriteria (${criteriaCount})`, icon: Sparkles },
    { id: "safety", label: "Keselamatan", icon: ShieldAlert },
  ];

  return (
    <section
      aria-label="Referensi latihan"
      className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-xs"
    >
      <div
        role="tablist"
        aria-label="Panel referensi"
        className="mb-3.5 grid grid-cols-3 gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`ref-tab-${id}`}
              aria-selected={active}
              aria-controls={`ref-panel-${id}`}
              onClick={() => setTab(id)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white shadow-xs"
                  : "text-slate-600 hover:bg-white/80 hover:text-[#6d1b11]"
              }`}
            >
              <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {tab === "player" && (
        <div role="tabpanel" id="ref-panel-player" aria-labelledby="ref-tab-player">
          {children}
        </div>
      )}

      {tab === "criteria" && (
        <div role="tabpanel" id="ref-panel-criteria" aria-labelledby="ref-tab-criteria" className="space-y-3">
          <ul className="space-y-2 text-xs sm:text-sm">
            {criteria.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2"
              >
                <span className="text-slate-700">{c.label}</span>
                <span className="shrink-0 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#9a3412]">
                  bobot {c.weight}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
              <span className="text-slate-700">Kelengkapan fase</span>
              <span className="shrink-0 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#9a3412]">
                bobot {phaseCompletionWeight}
              </span>
            </li>
          </ul>
          <p className="text-xs leading-relaxed text-slate-500">{disclaimer}</p>
        </div>
      )}

      {tab === "safety" && (
        <div
          role="tabpanel"
          id="ref-panel-safety"
          aria-labelledby="ref-tab-safety"
          className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4"
        >
          <p className="mb-1.5 flex items-center gap-2 font-serif text-base font-semibold text-amber-950">
            <ShieldAlert aria-hidden className="h-4 w-4 text-amber-700" />
            Panduan Keselamatan
          </p>
          <p className="text-xs leading-relaxed text-amber-900/90 sm:text-sm">
            Lakukan hanya gerak solo ini di area lapang dan lantai yang tidak licin. Hentikan bila nyeri. Latihan teknik lanjutan, sparring, dan senjata hanya bersama pelatih.
          </p>
        </div>
      )}
    </section>
  );
}
