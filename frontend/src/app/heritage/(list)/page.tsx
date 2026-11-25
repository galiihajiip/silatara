import { BookOpen, Compass, FileText, MapPin } from "lucide-react";
import { TraditionCard } from "@/components/Cards";
import { SilatPatternKawung, SilatPatternTumpal } from "@/components/SilatMotifs";
import { LazyHeritageSectionSwitcher, LazyProvinceExplorer } from "@/components/LazyClients";
import { TraditionShowcaseCard } from "@/components/heritage/TraditionShowcaseCard";
import { Grid } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { sGet } from "@/lib/server-api";
import type { Coverage, Entity, Inventory, TraditionItem } from "@/lib/research";
import { HERITAGE_CATEGORIES } from "@/lib/research";
import type { Page, TraditionSummary } from "@/lib/types";

export const metadata = {
  title: "Jelajahi Warisan",
  description:
    "Jelajahi keberagaman pencak silat Nusantara: tradisi, aliran, sebutan lokal, dan persebarannya di 38 provinsi Indonesia.",
  alternates: { canonical: "/heritage" },
};

type SP = { wilayah?: string; jenis?: string };
type Ents = { items: Entity[] };

export default async function HeritagePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [tr, cov, ents, inv, db] = await Promise.all([
    apiGet<TraditionItem[]>("/research/traditions"),
    apiGet<Coverage>("/research/coverage"),
    apiGet<Ents>("/research/entities"),
    apiGet<Inventory>("/research/inventory"),
    sGet<Page<TraditionSummary>>("/traditions?page_size=50"),
  ]);

  const traditions = tr.ok ? tr.data : [];
  const official = db.ok ? db.data.items.filter((t) => t.content_basis !== "source_backed") : [];
  const all = (ents.ok ? ents.data.items : []).filter((e) => e.sources.length > 0);
  const heritageAll = all.filter((e) => HERITAGE_CATEGORIES.includes(e.category));
  const provinces = cov.ok ? cov.data.provinces : [];
  const regional = inv.ok ? inv.data.groups.filter((g) => g.tradition !== "trd.psdp") : [];
  const documented = provinces.filter((p) => p.status !== "no_documentation_found").length;

  return (
    <div className="space-y-14">
      {/* Editorial Nusantara Cultural Atlas Hero */}
      <header className="relative overflow-hidden rounded-[28px] border border-[#7c1d1d]/35 bg-gradient-to-br from-[#2e0909] via-[#4a120b] to-[#6d1b11] px-6 py-9 text-white shadow-lg sm:rounded-[32px] sm:px-10 sm:py-12">
        <SilatPatternKawung className="text-[#fed7aa]" opacity={0.075} />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#ea580c]/30 via-[#fbbf24]/15 to-transparent blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 overflow-hidden opacity-20"
        >
          <SilatPatternTumpal className="text-[#fde68a]" opacity={0.75} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#fed7aa]/30 bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#fde68a] backdrop-blur-xs">
            <Compass aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
            <span>Jelajahi Warisan Nusantara</span>
          </p>

          <h1 className="mt-4 text-balance font-serif text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
            Pencak silat dari Sabang sampai Merauke
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">
            Atlas budaya tradisi terbuka, ragam sebutan lokal, dan jejak persebaran pencak silat di
            seluruh Indonesia.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {provinces.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#fde68a]/30 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-xs">
                <MapPin aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
                <span>
                  {documented} dari {provinces.length} provinsi tercatat
                </span>
              </span>
            )}
            {traditions.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#ffedd5] backdrop-blur-xs">
                <BookOpen aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
                <span>{traditions.length} tradisi terbuka</span>
              </span>
            )}
            {all.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-[#ffedd5] backdrop-blur-xs">
                <FileText aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
                <span>{all.length} catatan warisan</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tradisi Pilihan */}
      <section aria-labelledby="tradisi">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a3412]">
              Sorotan Kurasi
            </p>
            <h2
              id="tradisi"
              className="mt-1 font-serif text-2xl font-extrabold tracking-tight text-[#2e0909] sm:text-[1.75rem]"
            >
              Tradisi yang dapat Anda pelajari
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pelajari pengantar tradisi, gerakan dasar, dan catatan terkait secara terbuka.
            </p>
          </div>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {traditions.map((t) => (
            <li key={t.slug}>
              <TraditionShowcaseCard tradition={t} />
            </li>
          ))}
        </ul>
        {official.length > 0 && (
          <div className="mt-6">
            <Grid>
              {official.map((t) => (
                <TraditionCard key={t.id} t={t} level={3} />
              ))}
            </Grid>
          </div>
        )}
      </section>

      {/* Atlas Wilayah 38 Provinsi */}
      <section id="wilayah" aria-labelledby="wilayah-h" className="scroll-mt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a3412]">
              Atlas 38 Provinsi
            </p>
            <h2
              id="wilayah-h"
              className="mt-1 font-serif text-2xl font-extrabold tracking-tight text-[#2e0909] sm:text-[1.75rem]"
            >
              Jelajahi per wilayah
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Saring menurut gugus pulau atau pilih provinsi untuk membuka catatan tradisi setempat.
            </p>
          </div>
          {provinces.length > 0 && (
            <p className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3.5 py-1 text-xs font-semibold text-[#9a3412]">
              {documented} dari {provinces.length} provinsi tercatat
            </p>
          )}
        </div>
        <LazyProvinceExplorer provinces={provinces} entities={all} initialSelected={sp.wilayah} />
      </section>

      {/* Khazanah Daerah / Indeks Nama Jurus: dipilih lewat tombol, bukan ditumpuk */}
      <LazyHeritageSectionSwitcher
        entities={heritageAll}
        regionalJurus={regional}
        initialCategory={sp.jenis ?? ""}
      />
    </div>
  );
}
