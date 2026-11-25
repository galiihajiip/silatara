import { Box, Layers } from "lucide-react";
import { LazyLibraryCatalog } from "@/components/LazyClients";
import { apiGet } from "@/lib/api";
import type { CharacterManifest } from "@/lib/character";
import type { MovementItem, TraditionItem } from "@/lib/research";

export const metadata = {
  title: "Pustaka Gerakan",
  description:
    "Kenali gerakan pencak silat dari sikap dasar hingga pola langkah: posisi tubuh, urutan fase, panduan latihan, dan peraga 3D.",
  alternates: { canonical: "/library" },
};

type SP = { q?: string; tradisi?: string; kategori?: string; tingkat?: string; animasi?: string };
type KList = { categories: Record<string, string>; items: MovementItem[] };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [k, tr, ch] = await Promise.all([
    apiGet<KList>("/research/movements"),
    apiGet<TraditionItem[]>("/research/traditions"),
    apiGet<CharacterManifest>("/research/character"),
  ]);

  const items = k.ok ? k.data.items : [];
  const categories = k.ok ? k.data.categories : {};
  const traditions = tr.ok ? tr.data : [];
  const animated3DIds = ch.ok
    ? ch.data.clips.filter((c) => c.checks_passed).map((c) => c.movement_id)
    : [];
  const animated3DCount = animated3DIds.length > 0
    ? items.filter((m) => animated3DIds.includes(m.id)).length
    : items.filter((m) => m.animation.status === "generated").length;
  const categoryCount = new Set(items.map((m) => m.category)).size;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-bronze-700">
            Pustaka Gerakan
          </p>
          <h1 className="font-serif text-3xl leading-tight text-forest-900 sm:text-4xl">
            Kenali setiap gerakan
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
              <Layers aria-hidden className="h-3.5 w-3.5 text-bronze-700" />
              {items.length} gerakan · {categoryCount} kategori
            </span>
            {animated3DCount > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-bronze-500/25 bg-parchment-100 px-3.5 py-1.5 text-xs font-semibold text-forest-900">
                <Box aria-hidden className="h-3.5 w-3.5 text-bronze-700" />
                {animated3DCount} beranimasi 3D
              </span>
            )}
          </div>
        )}
      </header>

      <LazyLibraryCatalog
        items={items}
        categories={categories}
        traditions={traditions}
        animated3DIds={animated3DIds}
        initial={sp}
      />
    </>
  );
}
