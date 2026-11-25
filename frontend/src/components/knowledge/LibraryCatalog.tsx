"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Box, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { MovementItem, TraditionItem } from "@/lib/research";
import { LEVEL_ID } from "@/lib/research";
import { MovementVisual } from "@/components/knowledge/Bits";

export type LibraryFilterInitial = {
  q?: string;
  tradisi?: string;
  kategori?: string;
  tingkat?: string;
  animasi?: string;
};

type Props = {
  items: MovementItem[];
  categories: Record<string, string>;
  traditions: TraditionItem[];
  animated3DIds: string[];
  initial: LibraryFilterInitial;
};

function LibraryMovementCard({
  m,
  has3D,
  onSelectCategory,
}: {
  m: MovementItem;
  has3D: boolean;
  onSelectCategory?: () => void;
}) {
  return (
    <article className="card-interactive group relative flex h-full flex-col rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-bronze-500/40">
      <div className="relative overflow-hidden rounded-[18px] border border-slate-100 bg-parchment-100/60">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <MovementVisual a={m.animation} title={m.name} compact />
        </div>
        {has3D && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-forest-900/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-paper-50 shadow-xs backdrop-blur-xs">
            <Box aria-hidden className="h-3 w-3 text-amber-300" />
            3D
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col px-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {onSelectCategory ? (
            <button
              type="button"
              onClick={onSelectCategory}
              className="relative z-10 inline-flex items-center rounded-full bg-parchment-100 px-2.5 py-0.5 text-[11px] font-semibold text-bronze-700 transition-colors hover:bg-parchment-200"
            >
              {m.category_label}
            </button>
          ) : (
            <span className="inline-flex items-center rounded-full bg-parchment-100 px-2.5 py-0.5 text-[11px] font-semibold text-bronze-700">
              {m.category_label}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            {LEVEL_ID[m.level] ?? m.level}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-forest-700">
          <Link href={`/library/${m.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {m.name}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="truncate">{m.tradition_name}</span>
          <span className="shrink-0 font-medium text-slate-600">{m.phases} fase</span>
        </div>
      </div>
    </article>
  );
}

function CategorySpotlightCard({
  m,
  has3D,
  categoryLabel,
  categoryCount,
  onSelectCategory,
}: {
  m: MovementItem;
  has3D: boolean;
  categoryLabel: string;
  categoryCount: number;
  onSelectCategory: () => void;
}) {
  return (
    <article className="card-interactive group relative flex h-full flex-col rounded-[24px] border border-slate-200/80 bg-white p-3.5 shadow-xs hover:border-bronze-500/40">
      <div className="relative overflow-hidden rounded-[18px] border border-slate-100 bg-parchment-100/60">
        <div className="transition-transform duration-300 group-hover:scale-[1.02]">
          <MovementVisual a={m.animation} title={m.name} compact />
        </div>
        {has3D && (
          <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-forest-900/90 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-paper-50 shadow-xs backdrop-blur-xs">
            <Box aria-hidden className="h-3 w-3 text-amber-300" />
            3D
          </span>
        )}
      </div>

      <div className="mt-3.5 flex flex-1 flex-col px-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onSelectCategory}
            aria-label={`Kategori ${categoryLabel} (${categoryCount} gerakan)`}
            className="relative z-10 inline-flex items-center gap-1 rounded-full bg-parchment-100 px-2.5 py-0.5 text-[11px] font-semibold text-bronze-700 transition-colors hover:bg-parchment-200"
          >
            <span>{categoryLabel}</span>
            <span className="text-bronze-600/80">({categoryCount})</span>
          </button>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
            {LEVEL_ID[m.level] ?? m.level}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-forest-700">
          <Link href={`/library/${m.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {m.name}
          </Link>
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span className="truncate">{m.tradition_name}</span>
            <span className="shrink-0 font-medium text-slate-600">{m.phases} fase</span>
          </div>

          <div className="mt-2.5">
            <button
              type="button"
              onClick={onSelectCategory}
              aria-label={`Lihat semua ${categoryCount} gerakan ${categoryLabel}`}
              className="relative z-10 inline-flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-forest-800 transition-all hover:border-bronze-500/50 hover:bg-parchment-100 hover:text-forest-900"
            >
              <span>Lihat semua {categoryCount} gerakan</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function LibraryCatalog({ items, categories, traditions, animated3DIds, initial }: Props) {
  const [query, setQuery] = useState(initial.q ?? "");
  const [category, setCategory] = useState(() => {
    const raw = initial.kategori ?? "";
    return raw === "all" ? "" : raw;
  });
  const [tradition, setTradition] = useState(initial.tradisi ?? "");
  const [level, setLevel] = useState(initial.tingkat ?? "");
  const [only3D, setOnly3D] = useState(initial.animasi === "1");

  const animated3DSet = useMemo(() => new Set(animated3DIds), [animated3DIds]);
  const has3DData = animated3DSet.size > 0;

  const isAnimated3D = (m: MovementItem) =>
    has3DData ? animated3DSet.has(m.id) : m.animation.status === "generated";

  // Distinct ordered categories derived from backend categories map + actual movements data
  const categoryList = useMemo(() => {
    const counts = new Map<string, number>();
    const fallbackLabels = new Map<string, string>();
    for (const m of items) {
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
      if (!fallbackLabels.has(m.category)) fallbackLabels.set(m.category, m.category_label);
    }
    const ordered: { key: string; label: string; count: number }[] = [];
    const seen = new Set<string>();
    for (const [key, label] of Object.entries(categories)) {
      const count = counts.get(key) ?? 0;
      if (count > 0) {
        ordered.push({ key, label, count });
        seen.add(key);
      }
    }
    for (const [key, count] of counts.entries()) {
      if (!seen.has(key)) {
        ordered.push({ key, label: fallbackLabels.get(key) ?? key, count });
      }
    }
    return ordered;
  }, [items, categories]);

  const activeTraditions = useMemo(() => {
    const fromApi = traditions.filter((t) => t.movement_count > 0);
    if (fromApi.length > 0) return fromApi;
    const seen = new Map<string, string>();
    for (const m of items) {
      if (m.tradition_slug && !seen.has(m.tradition_slug)) {
        seen.set(m.tradition_slug, m.tradition_name);
      }
    }
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [traditions, items]);

  const isDefaultOverview =
    (!category || category === "all") &&
    !query.trim() &&
    !tradition &&
    !level &&
    !only3D;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.aliases.some((a) => a.toLowerCase().includes(q)) &&
        !m.category_label.toLowerCase().includes(q) &&
        !m.tradition_name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (tradition && m.tradition_slug !== tradition) return false;
      if (category && category !== "all" && m.category !== category) return false;
      if (level && m.level !== level) return false;
      if (only3D && !(has3DData ? animated3DSet.has(m.id) : m.animation.status === "generated")) {
        return false;
      }
      return true;
    });
  }, [items, query, tradition, category, level, only3D, has3DData, animated3DSet]);

  const spotlightItems = useMemo(() => {
    if (!isDefaultOverview) return [];
    const list: { category: { key: string; label: string; count: number }; item: MovementItem }[] = [];
    for (const c of categoryList) {
      const rep = items.find((m) => m.category === c.key);
      if (rep) {
        list.push({ category: c, item: rep });
      }
    }
    return list;
  }, [isDefaultOverview, categoryList, items]);

  const groups = useMemo(() => {
    return categoryList
      .map((c) => ({
        key: c.key,
        label: c.label,
        items: filtered.filter((m) => m.category === c.key),
      }))
      .filter((g) => g.items.length > 0);
  }, [categoryList, filtered]);

  const hasActiveFilters = Boolean(query.trim() || (category && category !== "all") || tradition || level || only3D);

  // Sync filters to URL cleanly without jarring page reloads or scroll jumps
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams();
    if (query.trim()) sp.set("q", query.trim());
    if (tradition) sp.set("tradisi", tradition);
    if (category && category !== "all") sp.set("kategori", category);
    if (level) sp.set("tingkat", level);
    if (only3D) sp.set("animasi", "1");
    const qs = sp.toString();
    const nextUrl = qs ? `/library?${qs}` : "/library";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [query, tradition, category, level, only3D]);

  const resetFilters = () => {
    setQuery("");
    setCategory("");
    setTradition("");
    setLevel("");
    setOnly3D(false);
  };

  const selectClass =
    "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3.5 pr-9 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-forest-700 focus:bg-white focus:outline-none";

  return (
    <div>
      {/* Filter Bar */}
      <form
        action="/library"
        method="get"
        role="search"
        aria-label="Cari & saring gerakan"
        onSubmit={(e) => e.preventDefault()}
        className="mb-6 space-y-4 rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5"
      >
        {/* Row 1: Quick Category Pill Tabs */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Saring berdasarkan kategori gerakan"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              aria-pressed={isDefaultOverview}
              onClick={resetFilters}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all ${
                isDefaultOverview
                  ? "border-forest-700 bg-forest-700 text-paper-50 shadow-xs"
                  : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-bronze-500/50 hover:bg-parchment-100/60 hover:text-forest-900"
              }`}
            >
              <span>Semua kategori (1 per kategori)</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isDefaultOverview ? "bg-white/20 text-paper-50" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {categoryList.length}
              </span>
            </button>

            {categoryList.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(active ? "" : c.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                    active
                      ? "border-forest-700 bg-forest-700 text-paper-50 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-bronze-500/50 hover:bg-parchment-100/60 hover:text-forest-900"
                  }`}
                >
                  <span>{c.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                      active ? "bg-white/20 text-paper-50" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Search + Sleek Selectors + 3D Toggle Pill */}
        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto]">
          {/* Compact Search */}
          <div className="relative">
            <label className="sr-only" htmlFor="q">
              Nama gerakan
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="q"
              name="q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama gerakan, mis. kuda-kuda..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-forest-700 focus:bg-white focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tradisi Selector */}
          <div className="relative">
            <label className="sr-only" htmlFor="tradisi">
              Tradisi
            </label>
            <select
              id="tradisi"
              name="tradisi"
              value={tradition}
              onChange={(e) => setTradition(e.target.value)}
              className={selectClass}
            >
              <option value="">Semua tradisi</option>
              {activeTraditions.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Tingkat Selector */}
          <div className="relative">
            <label className="sr-only" htmlFor="tingkat">
              Tingkat
            </label>
            <select
              id="tingkat"
              name="tingkat"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={selectClass}
            >
              <option value="">Semua tingkat</option>
              {Object.entries(LEVEL_ID).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Beranimasi 3D Pill Toggle */}
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              aria-pressed={only3D}
              onClick={() => setOnly3D((prev) => !prev)}
              className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all lg:w-auto ${
                only3D
                  ? "border-forest-700 bg-forest-700 text-paper-50 shadow-xs"
                  : "border-slate-200 bg-parchment-100/70 text-forest-900 hover:border-bronze-500/60 hover:bg-parchment-100"
              }`}
            >
              <Box aria-hidden className={`h-4 w-4 ${only3D ? "text-amber-300" : "text-bronze-700"}`} />
              <span>Beranimasi 3D</span>
            </button>
          </div>
        </div>
      </form>

      {/* Result Count & Reset Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
          <SlidersHorizontal aria-hidden className="h-4 w-4 text-bronze-700" />
          <span>
            Menampilkan{" "}
            <strong className="font-semibold text-slate-900">
              {isDefaultOverview ? spotlightItems.length : filtered.length}
            </strong>{" "}
            dari <strong className="font-semibold text-slate-900">{items.length}</strong> gerakan
            {isDefaultOverview && (
              <span className="ml-1 font-normal text-slate-500">(1 per kategori)</span>
            )}
          </span>
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-forest-900 transition-colors hover:border-forest-700/40 hover:bg-parchment-100"
          >
            <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            Hapus saringan
          </button>
        )}
      </div>

      {/* Movements Display */}
      {isDefaultOverview ? (
        <section aria-label="Sorotan kategori gerakan" className="mb-12">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spotlightItems.map(({ category: c, item: m }) => (
              <li key={c.key}>
                <CategorySpotlightCard
                  m={m}
                  has3D={isAnimated3D(m)}
                  categoryLabel={c.label}
                  categoryCount={c.count}
                  onSelectCategory={() => setCategory(c.key)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        groups.map((g) => (
          <section key={g.key} aria-labelledby={`cat-${g.key}`} className="mb-12 scroll-mt-6">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2.5">
              <h2 id={`cat-${g.key}`} className="font-serif text-xl text-forest-900 sm:text-2xl">
                {g.label}
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {g.items.length} gerakan
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {g.items.map((m) => (
                <li key={m.slug}>
                  <LibraryMovementCard
                    m={m}
                    has3D={isAnimated3D(m)}
                    onSelectCategory={() => setCategory(m.category)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {/* Empty State */}
      {((isDefaultOverview && items.length === 0) || (!isDefaultOverview && filtered.length === 0)) && (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-serif text-lg text-forest-900">
            Tidak ada gerakan yang cocok dengan saringan ini.
          </p>
          <p className="mt-1.5 text-sm text-slate-600">
            Coba ubah kata kunci atau pilih kategori lain untuk menjelajahi seluruh pustaka.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-forest-700 px-5 py-2.5 text-sm font-semibold text-paper-50 transition-opacity hover:opacity-95"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Lihat semua gerakan
          </button>
        </div>
      )}
    </div>
  );
}
