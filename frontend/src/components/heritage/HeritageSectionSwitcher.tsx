"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, ScrollText } from "lucide-react";
import { cleanTraditionSummary } from "@/components/heritage/TraditionShowcaseCard";
import { cleanDashes } from "@/lib/text";
import type { Entity, Inventory } from "@/lib/research";
import { CATEGORY_ENTITY_LABEL, HERITAGE_CATEGORIES } from "@/lib/research";

type JurusGroup = Inventory["groups"][number];

interface Props {
  entities: Entity[];
  regionalJurus: JurusGroup[];
  initialCategory?: string;
  initialTab?: "ragam" | "jurus";
}

const INITIAL_CARD_LIMIT = 12;

function cleanJurusLabel(label: string): string {
  return cleanDashes(
    label
      .replace(
        /\s*\(nama saja\)|\s*[\u2014\u2015]\s*nama saja|\s*\(nama dari Wikipedia; sumber primer belum diverifikasi\)/g,
        "",
      )
      .trim(),
    ": ",
  );
}

export function HeritageSectionSwitcher({
  entities,
  regionalJurus,
  initialCategory = "",
  initialTab = "ragam",
}: Props) {
  const [activeTab, setActiveTab] = useState<"ragam" | "jurus">(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [showAllCards, setShowAllCards] = useState<boolean>(false);
  const [showAllJurus, setShowAllJurus] = useState<boolean>(false);

  // Filter entities by selected category
  const filteredEntities = useMemo(() => {
    if (!selectedCategory) return entities;
    return entities.filter((e) => e.category === selectedCategory);
  }, [entities, selectedCategory]);

  const visibleEntities = showAllCards
    ? filteredEntities
    : filteredEntities.slice(0, INITIAL_CARD_LIMIT);

  // Active jurus groups (with non-restricted items)
  const validJurusGroups = useMemo(() => {
    return regionalJurus.filter(
      (g) => g.tradition !== "trd.psdp" && g.items.some((i) => i.safety !== "restricted")
    );
  }, [regionalJurus]);

  const visibleJurus = showAllJurus
    ? validJurusGroups
    : validJurusGroups.slice(0, 8);

  return (
    <section id="khazanah-jurus" aria-labelledby="switcher-heading" className="scroll-mt-6">
      {/* Top Primary Switcher Buttons */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e7d7c8] pb-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a3412]">
            Eksplorasi Khazanah
          </p>
          <h2
            id="switcher-heading"
            className="mt-1 font-serif text-2xl font-extrabold tracking-tight text-[#2e0909] sm:text-[1.75rem]"
          >
            {activeTab === "ragam"
              ? "Ragam tradisi, aliran, dan sebutan lokal"
              : "Nama jurus dari tradisi daerah"}
          </h2>
        </div>

        {/* Tab Switcher Pills */}
        <div
          role="tablist"
          aria-label="Pilih tampilan khazanah atau jurus"
          className="inline-flex rounded-full border border-[#e7d7c8] bg-white p-1 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ragam"}
            onClick={() => setActiveTab("ragam")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "ragam"
                ? "bg-[#6d1b11] text-white shadow-xs"
                : "text-slate-700 hover:bg-[#fff6ee] hover:text-[#2e0909]"
            }`}
          >
            <span>Ragam Tradisi</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                activeTab === "ragam" ? "bg-white/20 text-white" : "bg-[#fff6ee] text-[#9a3412]"
              }`}
            >
              {entities.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "jurus"}
            onClick={() => setActiveTab("jurus")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
              activeTab === "jurus"
                ? "bg-[#6d1b11] text-white shadow-xs"
                : "text-slate-700 hover:bg-[#fff6ee] hover:text-[#2e0909]"
            }`}
          >
            <span>Indeks Nama Jurus</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                activeTab === "jurus" ? "bg-white/20 text-white" : "bg-[#fff6ee] text-[#9a3412]"
              }`}
            >
              {validJurusGroups.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Ragam Tradisi, Aliran & Sebutan Lokal */}
      {activeTab === "ragam" && (
        <div role="tabpanel" aria-label="Ragam Tradisi" className="space-y-6">
          <p className="max-w-prose text-sm leading-relaxed text-slate-600 sm:text-base">
            Pencak silat dikenal dengan banyak nama: silek di Sumatera Barat, maenpo dan ulin di
            Jawa Barat, maen pukulan di Betawi, kuntau di Kalimantan, langga di Gorontalo, hingga
            manca&apos; di Sulawesi Selatan.
          </p>

          {/* Sub-Filters Pill Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "", label: "Semua", count: entities.length },
              ...HERITAGE_CATEGORIES.map((c) => ({
                id: c,
                label: CATEGORY_ENTITY_LABEL[c] ?? c,
                count: entities.filter((e) => e.category === c).length,
              })),
            ].map(({ id, label, count }) => {
              const isActive = selectedCategory === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(id);
                    setShowAllCards(false);
                  }}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                    isActive
                      ? "border-[#6d1b11] bg-[#6d1b11] text-white shadow-2xs"
                      : "border-[#e7d7c8] bg-white text-slate-700 hover:border-[#ea580c]/50 hover:bg-[#fff6ee]"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive ? "bg-white/20 text-white" : "bg-[#fff6ee] text-[#9a3412]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleEntities.map((e) => {
              const cleanNotes = e.notes ? cleanTraditionSummary(e.notes) : "";
              return (
                <li key={e.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[#e7d7c8] bg-white bg-gradient-to-b from-[#FFFDF9] to-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#ea580c]/50 hover:shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                        {CATEGORY_ENTITY_LABEL[e.category] ?? e.category}
                      </p>
                      {e.wbtb?.inventory_ref && (
                        <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-[11px] font-semibold text-[#9a3412]">
                          WBTb{e.wbtb.recorded ? ` ${e.wbtb.recorded.slice(0, 4)}` : ""}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-serif text-lg font-bold text-[#2e0909]">{cleanDashes(e.name, ": ")}</h3>
                    {e.aliases && e.aliases.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-600">
                        Juga disebut {e.aliases.map((a) => cleanDashes(a)).join(", ")}
                      </p>
                    )}
                    <p className="mt-2.5 inline-flex items-start gap-1.5 text-sm font-medium text-slate-800">
                      <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ea580c]" />
                      <span>
                        {e.provinces.filter((x) => x !== "needs_verification").join(", ") ||
                          "Wilayah belum dipastikan"}
                        {e.localities?.length ? (
                          <span className="font-normal text-slate-600">
                            {" "}
                            · {e.localities.map((l) => cleanDashes(l)).join("; ")}
                          </span>
                        ) : null}
                      </span>
                    </p>
                    {cleanNotes && (
                      <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                        {cleanNotes}
                      </p>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>

          {/* Compact View Toggle Button */}
          {filteredEntities.length > INITIAL_CARD_LIMIT && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAllCards((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#e7d7c8] bg-white px-5 py-2.5 text-xs font-bold text-[#6d1b11] shadow-2xs transition-all hover:border-[#ea580c] hover:bg-[#fff6ee] hover:shadow-xs sm:text-sm"
              >
                <span>
                  {showAllCards
                    ? "Tampilkan lebih ringkas"
                    : `Tampilkan semua (${filteredEntities.length} catatan)`}
                </span>
                {showAllCards ? (
                  <ChevronUp className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Indeks Nama Jurus Tradisi Daerah */}
      {activeTab === "jurus" && (
        <div role="tabpanel" aria-label="Indeks Nama Jurus" className="space-y-6">
          <p className="max-w-prose text-sm leading-relaxed text-slate-600 sm:text-base">
            Nama-nama jurus dan langkah yang tercatat. Cara memperagakannya diwariskan langsung
            oleh guru di setiap perguruan.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {validJurusGroups.length === 0 && (
              <p className="rounded-[22px] border border-dashed border-[#fed7aa] bg-[#fff6ee] px-5 py-6 text-sm text-slate-600 md:col-span-2">
                Indeks nama jurus belum tersedia saat ini.
              </p>
            )}
            {visibleJurus.map((g) => (
              <article
                key={g.label}
                className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs"
              >
                <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#2e0909]">
                  <ScrollText aria-hidden className="h-4 w-4 shrink-0 text-[#c2410c]" />
                  <span>{cleanJurusLabel(g.label)}</span>
                </h3>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {g.items
                    .filter((i) => i.safety !== "restricted")
                    .map((i) => (
                      <li
                        key={i.name}
                        className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#2e0909] shadow-2xs"
                      >
                        {cleanDashes(i.name, ": ")}
                      </li>
                    ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Compact View Toggle Button for Jurus */}
          {validJurusGroups.length > 8 && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowAllJurus((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-[#e7d7c8] bg-white px-5 py-2.5 text-xs font-bold text-[#6d1b11] shadow-2xs transition-all hover:border-[#ea580c] hover:bg-[#fff6ee] hover:shadow-xs sm:text-sm"
              >
                <span>
                  {showAllJurus
                    ? "Tampilkan lebih ringkas"
                    : `Tampilkan semua (${validJurusGroups.length} tradisi)`}
                </span>
                {showAllJurus ? (
                  <ChevronUp className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
