"use client";
import { useState } from "react";
import type { ClipMeta } from "@/lib/character";
import { LazyMovement3DPlayer } from "@/components/LazyClients";

/** Panggung gerak: peraga 3D (bila klip lolos pemeriksaan) dengan pilihan ilustrasi 2D. */
export function MovementStage({
  clip,
  title,
  twoD,
  variant = "default",
}: {
  clip: ClipMeta | null;
  title: string;
  twoD: React.ReactNode;
  variant?: "default" | "hero";
}) {
  const [mode, setMode] = useState<"3d" | "2d">(clip ? "3d" : "2d");
  const hero = variant === "hero";

  if (!clip) {
    return hero ? (
      <div className="w-full rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-5">
        {twoD}
      </div>
    ) : (
      <>{twoD}</>
    );
  }

  const tab = (m: "3d" | "2d", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={
        hero
          ? `rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              mode === m
                ? "bg-forest-700 text-paper-50 shadow-xs"
                : "text-slate-600 hover:text-forest-900"
            }`
          : `rounded-lg px-3 py-1.5 text-sm ${
              mode === m ? "bg-forest-700 text-paper-50" : "hover:bg-parchment-100"
            }`
      }
    >
      {label}
    </button>
  );

  if (hero) {
    return (
      <div className="w-full rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-5">
        <div className="mb-3.5 flex justify-center">
          <div
            role="tablist"
            aria-label="Jenis peraga"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-1"
          >
            {tab("3d", "Peraga 3D")}
            {tab("2d", "Ilustrasi 2D")}
          </div>
        </div>
        <div role="tabpanel">
          {mode === "3d" ? (
            <LazyMovement3DPlayer clip={clip} title={title} fallback={twoD} variant="hero" />
          ) : (
            twoD
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Jenis peraga"
        className="mb-2 inline-flex rounded-xl border border-line-200 bg-paper-50 p-1"
      >
        {tab("3d", "Peraga 3D")}
        {tab("2d", "Ilustrasi 2D")}
      </div>
      <div role="tabpanel">
        {mode === "3d" ? <LazyMovement3DPlayer clip={clip} title={title} fallback={twoD} /> : twoD}
      </div>
    </div>
  );
}
