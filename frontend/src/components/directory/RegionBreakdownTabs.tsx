"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { MapPinned, Search } from "lucide-react";
import { shortRegion, type DirectoryStats } from "@/lib/directory";

export const TOP_PROVINCES = 8;
export const TOP_REGENCIES = 12;

type TabKey = "wilayah" | "jenis" | "lengkap";
const TABS: { key: TabKey; label: string }[] = [
  { key: "wilayah", label: "Per Wilayah" },
  { key: "jenis", label: "Jenis & Induk" },
  { key: "lengkap", label: "Lokasi Terlengkap" },
];

const CARD = "rounded-2xl border border-line-200 bg-white p-5 shadow-2xs";
const TOGGLE = "mt-4 inline-flex items-center rounded-full border border-line-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-forest-800 transition-colors hover:border-[#9B2C10]/40 hover:bg-parchment-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9B2C10]";
const PILL = "inline-block rounded-full border border-line-200 bg-white px-3 py-1 transition-colors hover:border-[#9B2C10]/40 hover:bg-parchment-100";

export function RegionBreakdownTabs({ stats }: { stats: DirectoryStats }) {
  const uid = useId();
  const [tab, setTab] = useState<TabKey>("wilayah");
  const [allProvinces, setAllProvinces] = useState(false);
  const [allRegencies, setAllRegencies] = useState(false);
  const [regencyQuery, setRegencyQuery] = useState("");

  const provinces = useMemo(
    () => stats.by_province.filter((p) => p.count > 0).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [stats.by_province],
  );
  const emptyProvinces = useMemo(() => stats.by_province.filter((p) => p.count === 0), [stats.by_province]);
  const maxProv = Math.max(1, ...provinces.map((p) => p.count));
  const regencies = useMemo(
    () => [...stats.regencies_multi].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [stats.regencies_multi],
  );

  const shownProvinces = allProvinces ? provinces : provinces.slice(0, TOP_PROVINCES);
  const q = regencyQuery.trim().toLowerCase();
  const filteredRegencies = allRegencies && q ? regencies.filter((r) => shortRegion(r.name).toLowerCase().includes(q)) : regencies;
  const shownRegencies = allRegencies ? filteredRegencies : filteredRegencies.slice(0, TOP_REGENCIES);

  const tabId = (k: TabKey) => `${uid}-tab-${k}`;
  const panelId = (k: TabKey) => `${uid}-panel-${k}`;

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].key;
    setTab(next);
    document.getElementById(tabId(next))?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Jelajahi menurut wilayah" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              id={tabId(t.key)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId(t.key)}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9B2C10] focus-visible:ring-offset-2 ${
                active
                  ? "border-transparent bg-gradient-to-r from-[#4A0E0E] to-[#9B2C10] text-white shadow-sm"
                  : "border-line-200 bg-white text-slate-700 hover:border-[#9B2C10]/40 hover:bg-parchment-100 hover:text-forest-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "wilayah" && (
        <div role="tabpanel" id={panelId("wilayah")} aria-labelledby={tabId("wilayah")} className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby={`${uid}-prov`} className={CARD}>
            <h3 id={`${uid}-prov`} className="mb-3 font-semibold text-forest-900">Lokasi terdata per provinsi</h3>
            <ul className="space-y-2 text-sm">
              {shownProvinces.map((p) => (
                <li key={p.code} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2 sm:grid-cols-[10rem_1fr_2rem]">
                  <Link className="truncate underline-offset-2 transition-colors hover:text-[#9B2C10] hover:underline" href={`/community/peta?provinsi=${p.code}`}>{p.name}</Link>
                  <span aria-hidden className="h-2 rounded-full bg-gradient-to-r from-[#4A0E0E] to-[#9B2C10]" style={{ width: `${Math.max(4, (p.count / maxProv) * 100)}%` }} />
                  <span className="text-right tabular-nums">{p.count}</span>
                </li>
              ))}
            </ul>
            {provinces.length > TOP_PROVINCES && (
              <button type="button" className={TOGGLE} aria-expanded={allProvinces} onClick={() => setAllProvinces((v) => !v)}>
                {allProvinces ? "Ringkas" : "Lihat semua provinsi"}
              </button>
            )}
            {emptyProvinces.length > 0 && (
              <p className="mt-3 text-xs text-slate-600">
                Belum ada lokasi terdata di {emptyProvinces.length} provinsi{allProvinces ? `: ${emptyProvinces.map((p) => p.name).join(", ")}` : ""}.
              </p>
            )}
          </section>

          <section aria-labelledby={`${uid}-reg`} className={CARD}>
            <h3 id={`${uid}-reg`} className="mb-3 font-semibold text-forest-900">Kabupaten/kota dengan beberapa lokasi</h3>
            {allRegencies && (
              <div className="relative mb-3">
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="Cari kabupaten/kota"
                  placeholder="Cari kabupaten/kota"
                  value={regencyQuery}
                  onChange={(e) => setRegencyQuery(e.target.value)}
                  className="w-full rounded-xl border border-line-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#9B2C10] focus:outline-none focus:ring-1 focus:ring-[#9B2C10]"
                />
              </div>
            )}
            <ul className="flex flex-wrap gap-2 text-sm">
              {shownRegencies.map((r) => (
                <li key={r.code}>
                  <Link className={PILL} href={`/community/peta?provinsi=${r.code.slice(0, 2)}&kabkota=${r.code}`}>{shortRegion(r.name)} · {r.count}</Link>
                </li>
              ))}
            </ul>
            {allRegencies && shownRegencies.length === 0 && <p className="text-sm text-slate-600">Tidak ada kabupaten/kota yang cocok.</p>}
            {regencies.length > TOP_REGENCIES && (
              <button
                type="button"
                className={TOGGLE}
                aria-expanded={allRegencies}
                onClick={() => { setAllRegencies((v) => !v); setRegencyQuery(""); }}
              >
                {allRegencies ? "Ringkas" : "Lihat semua"}
              </button>
            )}
          </section>
        </div>
      )}

      {tab === "jenis" && (
        <div role="tabpanel" id={panelId("jenis")} aria-labelledby={tabId("jenis")} className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby={`${uid}-jenis`} className={CARD}>
            <h3 id={`${uid}-jenis`} className="mb-3 font-semibold text-forest-900">Menurut jenis tempat</h3>
            <ul className="grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {stats.by_category.map((c) => (
                <li key={c.key}>
                  <Link className="transition-colors hover:text-[#9B2C10] hover:underline" href={`/community/peta?jenis=${c.key}`}>{c.label}</Link>{" "}
                  <span className="text-slate-600">({c.count})</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby={`${uid}-induk`} className={CARD}>
            <h3 id={`${uid}-induk`} className="mb-3 font-semibold text-forest-900">Menurut perguruan/organisasi induk</h3>
            <ul className="flex flex-wrap gap-2 text-sm">
              {stats.by_organization.map((o) => (
                <li key={o.key}><Link className={PILL} href={`/community/peta?organisasi=${o.key}`}>{o.short_name ?? o.name} · {o.count}</Link></li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === "lengkap" && (
        <div role="tabpanel" id={panelId("lengkap")} aria-labelledby={tabId("lengkap")}>
          <h3 className="mb-3 font-semibold text-forest-900">Lokasi dengan informasi paling lengkap</h3>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stats.featured.map((p) => (
              <li key={p.slug}>
                <div className={`${CARD} h-full transition-shadow hover:shadow-md`}>
                  <MapPinned aria-hidden className="mb-2 h-5 w-5 text-bronze-700" />
                  <Link href={`/community/tempat/${p.slug}`} className="font-medium text-forest-900 transition-colors hover:text-[#9B2C10] hover:underline">{p.name}</Link>
                  <p className="text-sm text-slate-600">{p.category_label} · {shortRegion(p.regency)}</p>
                  <p className="mt-1 text-xs text-slate-600">{p.source_count} sumber: {p.source_types.join(", ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
