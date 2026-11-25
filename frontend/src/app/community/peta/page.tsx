import Link from "next/link";
import { Send } from "lucide-react";
import { LazyDirectoryExplorer } from "@/components/LazyClients";
import { RegionBreakdownTabs } from "@/components/directory/RegionBreakdownTabs";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { type DirectoryStats, type Facets } from "@/lib/directory";

export const metadata = {
  title: "Peta Tempat Latihan Pencak Silat",
  description: "Peta nasional perguruan, padepokan, pusat latihan, dan organisasi pencak silat di Indonesia, dengan saringan wilayah, jenis, dan lokasi terdekat.",
  alternates: { canonical: "/community/peta" },
};
export const dynamic = "force-dynamic";

export default async function DirectoryMapPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [facets, stats] = await Promise.all([apiGet<Facets>("/directory/facets"), apiGet<DirectoryStats>("/directory/stats")]);
  if (!facets.ok || !stats.ok) return <ErrorState message={(!facets.ok ? facets.error : !stats.ok ? stats.error : "")} retryHref="/community/peta" />;
  const s = stats.data;
  const initial = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  return (
    <>
      <PageHeader eyebrow="Peta nasional" title="Temukan tempat belajar pencak silat" />

      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(s.total_places), "lokasi terdata"],
          [String(s.training_locations), "tempat latihan"],
          [`${s.provinces_with_places}/${s.provinces_total}`, "provinsi tercakup"],
          [`${s.regencies_with_places}/${s.regencies_total}`, "kabupaten/kota tercakup"],
        ].map(([n, l]) => (
          <div key={l} className="rounded-2xl border border-line-200 bg-white p-4 shadow-2xs">
            <dt className="text-sm text-slate-600">{l}</dt><dd className="font-serif text-3xl text-forest-900">{n}</dd>
          </div>
        ))}
      </dl>

      <LazyDirectoryExplorer facets={facets.data} initialParams={initial} />

      <section aria-labelledby="jelajah" className="mb-12">
        <h2 id="jelajah" className="mb-4 font-serif text-2xl text-forest-900">Jelajahi menurut wilayah</h2>
        <RegionBreakdownTabs stats={s} />
      </section>

      <section aria-labelledby="kirim" className="mb-6">
        <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="kirim" className="font-serif text-xl text-forest-900">Mengelola atau mengetahui tempat latihan?</h2>
            <p className="text-sm text-slate-600">Kirim tempat baru, koreksi alamat, jadwal, atau kabar tempat yang sudah tutup. Redaksi memeriksa setiap kiriman sebelum tampil.</p>
          </div>
          <Link href="/community/kirim-tempat" className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-medium text-paper-50 hover:bg-forest-900"><Send aria-hidden className="h-4 w-4" />Kirim informasi</Link>
        </Card>
        <p className="mt-4 text-xs text-slate-600">Data lokasi: {s.attribution.join(" · ")}. Peta dasar: © kontributor OpenStreetMap.</p>
      </section>
    </>
  );
}
