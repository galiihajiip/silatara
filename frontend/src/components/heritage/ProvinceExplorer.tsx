"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, MapPin, Search, X } from "lucide-react";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import type { Coverage, Entity } from "@/lib/research";
import { CATEGORY_ENTITY_LABEL, COVERAGE_LABEL, INSTITUTION_CATEGORIES } from "@/lib/research";
import {
  FALLBACK_REGION,
  getProvinceRegion,
  getRegionLabel,
  ISLAND_REGIONS,
  isProvinceDocumented,
  type IslandRegionKey,
} from "@/components/heritage/province-regions";

type ProvinceEntry = Coverage["provinces"][number];

type Props = {
  provinces: ProvinceEntry[];
  entities: Entity[];
  initialSelected?: string;
};

type CoverageFilter = "documented" | "all";
type RegionFilter = "all" | IslandRegionKey;

const INITIAL_COMPACT_LIMIT = 12;

export function ProvinceExplorer({ provinces, entities, initialSelected }: Props) {
  const modalTitleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const initialProvince = useMemo(
    () => (initialSelected ? provinces.find((p) => p.name === initialSelected) ?? null : null),
    [initialSelected, provinces],
  );

  const documentedCount = useMemo(
    () => provinces.filter((p) => isProvinceDocumented(p)).length,
    [provinces],
  );

  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>(() => {
    if (documentedCount === 0) return "all";
    if (initialProvince && !isProvinceDocumented(initialProvince)) return "all";
    return "documented";
  });
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(initialProvince?.name ?? null);
  const [isExpanded, setIsExpanded] = useState(false);

  const provinceWithRegion = useMemo(
    () =>
      provinces.map((p) => ({
        ...p,
        region: getProvinceRegion(p.name),
        documented: isProvinceDocumented(p),
      })),
    [provinces],
  );

  const hasFallbackRegion = useMemo(
    () => provinceWithRegion.some((p) => p.region === "lainnya"),
    [provinceWithRegion],
  );

  const availableRegions = useMemo(
    () => (hasFallbackRegion ? [...ISLAND_REGIONS, FALLBACK_REGION] : [...ISLAND_REGIONS]),
    [hasFallbackRegion],
  );

  const entitiesByProvince = useMemo(() => {
    const map = new Map<string, Entity[]>();
    for (const entity of entities) {
      for (const prov of entity.provinces) {
        const list = map.get(prov) ?? [];
        list.push(entity);
        map.set(prov, list);
      }
    }
    return map;
  }, [entities]);

  const byCoverage = useMemo(
    () =>
      coverageFilter === "documented"
        ? provinceWithRegion.filter((p) => p.documented)
        : provinceWithRegion,
    [coverageFilter, provinceWithRegion],
  );

  const regionStats = useMemo(() => {
    const stats: Record<string, { documented: number; total: number }> = {
      all: { documented: documentedCount, total: provinceWithRegion.length },
    };
    for (const r of availableRegions) stats[r.key] = { documented: 0, total: 0 };
    for (const p of provinceWithRegion) {
      const bucket = stats[p.region] ?? { documented: 0, total: 0 };
      bucket.total += 1;
      if (p.documented) bucket.documented += 1;
      stats[p.region] = bucket;
    }
    return stats;
  }, [availableRegions, documentedCount, provinceWithRegion]);

  const trimmedQuery = query.trim().toLowerCase();

  const filteredProvinces = useMemo(() => {
    return byCoverage.filter((p) => {
      if (regionFilter !== "all" && p.region !== regionFilter) return false;
      if (!trimmedQuery) return true;
      if (p.name.toLowerCase().includes(trimmedQuery)) return true;
      if (getRegionLabel(p.region).toLowerCase().includes(trimmedQuery)) return true;
      return p.entities.some((e) => e.name.toLowerCase().includes(trimmedQuery));
    });
  }, [byCoverage, regionFilter, trimmedQuery]);

  const selectedProvince = useMemo(
    () => (selectedName ? provinceWithRegion.find((p) => p.name === selectedName) ?? null : null),
    [provinceWithRegion, selectedName],
  );

  const selectedEntities = useMemo(
    () => (selectedProvince ? entitiesByProvince.get(selectedProvince.name) ?? [] : []),
    [entitiesByProvince, selectedProvince],
  );

  const regionalTerms = useMemo(
    () => selectedEntities.filter((e) => e.category === "regional_term"),
    [selectedEntities],
  );

  const nonTermEntities = useMemo(
    () => selectedEntities.filter((e) => e.category !== "regional_term"),
    [selectedEntities],
  );

  // Close modal with Escape key
  useEffect(() => {
    if (!selectedProvince) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedName(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProvince]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (!selectedProvince) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedProvince]);

  // Focus close button on open
  useEffect(() => {
    if (selectedProvince && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [selectedProvince]);

  const handleSelectProvince = (name: string) => {
    setSelectedName(name);
  };

  const resetFilters = () => {
    setCoverageFilter("all");
    setRegionFilter("all");
    setQuery("");
    setIsExpanded(false);
  };

  // Compact capped grid: when "Semua" region is active without active search query,
  // cap initial view to 12 items to prevent excessively long vertical stack.
  const shouldCapGrid =
    regionFilter === "all" && !trimmedQuery && filteredProvinces.length > INITIAL_COMPACT_LIMIT;

  const displayedProvinces =
    shouldCapGrid && !isExpanded
      ? filteredProvinces.slice(0, INITIAL_COMPACT_LIMIT)
      : filteredProvinces;

  const renderProvinceButton = (p: (typeof provinceWithRegion)[number]) => {
    const isSelected = selectedProvince?.name === p.name;
    const isAdequate = p.status === "sources_adequate";
    const isDocumented = p.documented;

    const cardTone = isSelected
      ? "border-[#4a120b] bg-gradient-to-br from-[#4a120b] to-[#6d1b11] text-white shadow-sm"
      : isDocumented
        ? "border-[#fed7aa] bg-[#fff6ee] text-[#2e0909] shadow-2xs hover:-translate-y-0.5 hover:border-[#ea580c] hover:bg-[#ffedd5]/65 hover:shadow-xs"
        : "border-slate-200/80 bg-white/85 text-slate-600 hover:border-[#e7d7c8] hover:bg-white";

    const dotTone = isSelected
      ? "bg-[#fbbf24]"
      : isAdequate
        ? "bg-[#6d1b11]"
        : isDocumented
          ? "bg-[#ea580c]"
          : "bg-slate-300";

    const badgeTone = isSelected
      ? "bg-white/18 text-white"
      : isAdequate
        ? "bg-[#6d1b11]/12 text-[#6d1b11]"
        : isDocumented
          ? "bg-[#ea580c]/14 text-[#9a3412]"
          : "text-slate-600";

    const countText =
      p.entities.length > 0
        ? `${p.entities.length} catatan`
        : COVERAGE_LABEL[p.status] ?? "Masih ditelusuri";

    return (
      <li key={p.name}>
        <button
          type="button"
          onClick={() => handleSelectProvince(p.name)}
          aria-haspopup="dialog"
          aria-pressed={isSelected}
          className={`group flex h-full w-full items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all ${cardTone}`}
        >
          <span className="flex min-w-0 items-start gap-2.5">
            <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotTone}`} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              {!isDocumented && (
                <>
                  {" "}
                  <span
                    className={`mt-0.5 block text-xs ${isSelected ? "text-white/90" : "text-slate-600"}`}
                  >
                    {countText}
                  </span>
                </>
              )}
            </span>
          </span>
          {isDocumented && (
            <>
              {" "}
              <span className="flex shrink-0 items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeTone}`}>
                  {countText}
                </span>
                <ArrowRight
                  aria-hidden
                  className={`h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 ${
                    isSelected ? "text-[#fde68a]" : "text-[#9a3412]"
                  }`}
                />
              </span>
            </>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className="rounded-[28px] border border-[#e7d7c8] bg-[#faf7f4] p-4 shadow-sm sm:p-6">
      {/* White Inset Controls Frame */}
      <div className="rounded-[22px] border border-[#ece2d8] bg-white p-4 shadow-2xs sm:p-5">
        {/* Baris kontrol: toggle Tercatat vs Semua + pencarian ringkas */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label="Saring status dokumentasi provinsi"
            className="inline-flex w-full rounded-full border border-[#e7d7c8] bg-[#faf7f4] p-1 sm:w-auto"
          >
            <button
              type="button"
              onClick={() => setCoverageFilter("documented")}
              aria-pressed={coverageFilter === "documented"}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:flex-none ${
                coverageFilter === "documented"
                  ? "bg-[#6d1b11] text-white shadow-xs"
                  : "text-slate-700 hover:text-[#2e0909]"
              }`}
            >
              Tercatat ({documentedCount})
            </button>
            <button
              type="button"
              onClick={() => setCoverageFilter("all")}
              aria-pressed={coverageFilter === "all"}
              className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors sm:flex-none ${
                coverageFilter === "all"
                  ? "bg-[#6d1b11] text-white shadow-xs"
                  : "text-slate-700 hover:text-[#2e0909]"
              }`}
            >
              Semua ({provinces.length})
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <label htmlFor="cari-provinsi" className="sr-only">
              Cari provinsi atau tradisi
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a3412]"
            />
            <input
              id="cari-provinsi"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari provinsi atau tradisi..."
              className="w-full rounded-full border border-[#e7d7c8] bg-[#faf7f4]/65 py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-600 focus:border-[#ea580c] focus:bg-white focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian provinsi"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pil kelompok pulau / wilayah dengan jumlah tercatat per pulau */}
        <div
          role="group"
          aria-label="Saring berdasarkan pulau atau gugus wilayah"
          className="mt-4 flex flex-wrap gap-2 border-t border-[#ece2d8] pt-4"
        >
          <button
            type="button"
            onClick={() => setRegionFilter("all")}
            aria-pressed={regionFilter === "all"}
            title={`${regionStats.all.documented} tercatat dari ${regionStats.all.total} provinsi`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
              regionFilter === "all"
                ? "border-[#6d1b11] bg-[#6d1b11] text-white shadow-2xs"
                : "border-[#e7d7c8] bg-[#faf7f4]/70 text-slate-700 hover:border-[#fed7aa] hover:bg-[#fff6ee]"
            }`}
          >
            <span>Semua</span>{" "}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                regionFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-[#fff6ee] text-[#9a3412]"
              }`}
            >
              {coverageFilter === "all"
                ? `${regionStats.all.documented}/${regionStats.all.total}`
                : regionStats.all.documented}
            </span>
          </button>

          {availableRegions.map((region) => {
            const active = regionFilter === region.key;
            const st = regionStats[region.key] ?? { documented: 0, total: 0 };
            const pillBadge =
              coverageFilter === "all" ? `${st.documented}/${st.total}` : String(st.documented);
            return (
              <button
                key={region.key}
                type="button"
                onClick={() => setRegionFilter(region.key)}
                aria-pressed={active}
                title={`${st.documented} tercatat dari ${st.total} provinsi`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                  active
                    ? "border-[#6d1b11] bg-[#6d1b11] text-white shadow-2xs"
                    : "border-[#e7d7c8] bg-white text-slate-700 hover:border-[#fed7aa] hover:bg-[#fff6ee]"
                }`}
              >
                <span>{region.label}</span>{" "}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${
                    active ? "bg-white/20 text-white" : "bg-[#fff6ee] text-[#9a3412]"
                  }`}
                >
                  {pillBadge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessible Centered Province Detail Modal Dialog */}
      {selectedProvince && (
        <div
          data-testid="province-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedName(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs sm:p-6"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-[#fed7aa] bg-white shadow-2xl ring-1 ring-[#fed7aa]/50"
          >
            {/* Modal Header: Silatara's Royal Maroon with Silat Motif */}
            <div className="relative overflow-hidden border-b border-[#fed7aa]/60 bg-gradient-to-r from-[#2e0909] via-[#4a120b] to-[#6d1b11] px-6 py-5 text-white">
              <SilatPatternTumpal className="text-[#fde68a]" opacity={0.15} />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#fde68a]">
                    {getRegionLabel(selectedProvince.region)} ·{" "}
                    {COVERAGE_LABEL[selectedProvince.status] ?? selectedProvince.status}
                  </p>
                  <h2
                    id={modalTitleId}
                    className="mt-1 flex items-center gap-2.5 font-serif text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
                  >
                    <MapPin aria-hidden className="h-6 w-6 shrink-0 text-[#fbbf24]" />
                    <span>{selectedProvince.name}</span>
                  </h2>
                </div>
                <button
                  type="button"
                  ref={closeButtonRef}
                  onClick={() => setSelectedName(null)}
                  aria-label="Tutup detail provinsi"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#fde68a]/40 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-[#fff7ed] backdrop-blur-xs transition-colors hover:border-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-[#fde68a]"
                >
                  <X aria-hidden className="h-4 w-4" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body: Warm Parchment styling */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-[#fffaf5] to-white p-6">
              {/* Highlight Sebutan Lokal */}
              {(regionalTerms.length > 0 ||
                selectedEntities.some((e) => e.aliases && e.aliases.length > 0)) && (
                <div className="rounded-2xl border border-[#fed7aa] bg-[#fffaf5] p-4 shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    Sebutan lokal
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {regionalTerms.map((term) => (
                      <span
                        key={term.id}
                        className="inline-flex items-center rounded-full border border-[#fed7aa] bg-white px-3 py-1 text-xs font-bold text-[#2e0909] shadow-2xs"
                      >
                        {term.name}
                        {term.localities?.length ? ` · ${term.localities.join("; ")}` : ""}
                      </span>
                    ))}
                    {selectedEntities
                      .filter(
                        (e) => e.category !== "regional_term" && e.aliases && e.aliases.length > 0,
                      )
                      .flatMap((e) => e.aliases || [])
                      .map((alias) => (
                        <span
                          key={alias}
                          className="inline-flex items-center rounded-full border border-[#fed7aa] bg-white px-3 py-1 text-xs font-medium text-slate-800 shadow-2xs"
                        >
                          {alias}
                        </span>
                      ))}
                  </div>
                  {regionalTerms.some((t) => t.notes) && (
                    <div className="mt-2.5 space-y-1 text-xs leading-relaxed text-slate-600">
                      {regionalTerms
                        .filter((t) => t.notes)
                        .map((t) => (
                          <p key={t.id}>
                            <strong className="font-semibold text-[#2e0909]">{t.name}:</strong>{" "}
                            {t.notes}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Daftar Tradisi & Catatan Warisan (non-regional_term) */}
              {nonTermEntities.length > 0 ? (
                <div>
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    Tradisi &amp; Catatan Warisan
                  </p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {nonTermEntities.map((entity) => {
                      const catLabel =
                        entity.category === "tradition"
                          ? `Tradisi · ${
                              entity.localities?.length
                                ? entity.localities.join("; ")
                                : selectedProvince.name
                            }`
                          : `${CATEGORY_ENTITY_LABEL[entity.category] ?? entity.category}${
                              entity.localities?.length ? ` · ${entity.localities.join("; ")}` : ""
                            }`;

                      return (
                        <li
                          key={entity.id}
                          className="rounded-2xl border border-[#fed7aa]/80 bg-[#fffaf5] p-4 shadow-2xs"
                        >
                          <p className="font-bold text-[#2e0909]">{entity.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-[#9a3412]">{catLabel}</p>
                          {entity.aliases && entity.aliases.length > 0 && (
                            <p className="mt-1 text-xs text-slate-600">
                              <span className="font-medium text-slate-700">Sebutan lokal:</span>{" "}
                              {entity.aliases.join(", ")}
                            </p>
                          )}
                          {entity.notes && (
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                              {entity.notes}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : selectedEntities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#fed7aa] bg-[#fffaf5] p-5 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    Kami masih menelusuri tradisi pencak silat di provinsi ini. Bila Anda mengenal
                    perguruan atau tradisi setempat, kami ingin mendengarnya.
                  </p>
                </div>
              ) : null}

              {/* Catatan Riset */}
              {selectedProvince.gap && (
                <div className="rounded-2xl border border-[#fed7aa] bg-[#fffaf5] p-4 shadow-2xs">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    Catatan Riset
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    <strong className="font-semibold text-[#2e0909]">
                      Yang sedang kami dalami:
                    </strong>{" "}
                    {selectedProvince.gap}
                  </p>
                </div>
              )}

              {/* Perguruan & Lembaga */}
              {selectedEntities.some((e) => INSTITUTION_CATEGORIES.includes(e.category)) && (
                <div className="border-t border-[#fed7aa]/60 pt-3">
                  <Link
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6d1b11] underline underline-offset-4 transition-colors hover:text-[#9a3412]"
                    href="/community/peta"
                  >
                    <span>Perguruan &amp; lembaga di {selectedProvince.name}</span>
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-[#fed7aa]/60 bg-[#fffaf5]/90 px-6 py-3">
              <button
                type="button"
                onClick={() => setSelectedName(null)}
                className="rounded-full border border-[#fed7aa] bg-white px-4 py-1.5 text-xs font-bold text-[#6d1b11] shadow-2xs transition-colors hover:border-[#6d1b11] hover:bg-[#fff6ee]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Unified Compact Responsive Grid (No 6 Repeated Island Headings) */}
      <div className="mt-5">
        {filteredProvinces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e7d7c8] bg-white px-6 py-8 text-center">
            <p className="text-sm font-semibold text-[#2e0909]">
              Tidak ada provinsi yang cocok dengan saringan saat ini.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Coba ubah kata kunci pencarian atau tampilkan seluruh 38 provinsi.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-4 py-1.5 text-xs font-semibold text-[#6d1b11] hover:border-[#6d1b11]"
            >
              Tampilkan semua provinsi
            </button>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayedProvinces.map(renderProvinceButton)}
            </ul>

            {shouldCapGrid && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  aria-expanded={isExpanded}
                  className="inline-flex items-center gap-2 rounded-full border border-[#fed7aa] bg-white px-5 py-2 text-xs font-bold text-[#6d1b11] shadow-2xs transition-colors hover:border-[#6d1b11] hover:bg-[#fff6ee] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                >
                  <span>
                    {isExpanded
                      ? "Tampilkan lebih sedikit"
                      : `Tampilkan semua ${filteredProvinces.length} provinsi`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp aria-hidden className="h-4 w-4 text-[#ea580c]" />
                  ) : (
                    <ChevronDown aria-hidden className="h-4 w-4 text-[#ea580c]" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legenda ringkas */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#e7d7c8] pt-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#6d1b11]" />
            {COVERAGE_LABEL.sources_adequate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#ea580c]" />
            {COVERAGE_LABEL.sources_limited}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            {COVERAGE_LABEL.no_documentation_found}
          </span>
        </div>
        <p aria-live="polite" className="font-medium text-slate-700">
          Menampilkan {filteredProvinces.length} dari {provinces.length} provinsi
        </p>
      </div>
    </div>
  );
}
