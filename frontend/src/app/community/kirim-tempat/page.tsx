import Link from "next/link";
import { SubmissionForm } from "@/components/directory/SubmissionForm";
import { ErrorState, PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import type { Facets, PlaceDetail } from "@/lib/directory";

export const metadata = {
  title: "Kirim Informasi Tempat Latihan",
  description: "Kirim tempat latihan pencak silat baru atau koreksi informasi lokasi di direktori SILATARA.",
  alternates: { canonical: "/community/kirim-tempat" },
  robots: { index: false },
};

export default async function SubmitPlacePage({ searchParams }: { searchParams: Promise<{ tempat?: string }> }) {
  const { tempat } = await searchParams;
  const [facets, place] = await Promise.all([
    apiGet<Facets>("/directory/facets"),
    tempat ? apiGet<PlaceDetail>(`/directory/places/${encodeURIComponent(tempat)}`) : Promise.resolve(null),
  ]);
  if (!facets.ok) return <ErrorState message={facets.error} retryHref="/community/kirim-tempat" />;
  const p = place && place.ok ? { slug: place.data.slug, name: place.data.name } : null;
  return (
    <>
      <nav aria-label="Jejak halaman" className="mb-4 text-sm"><Link className="underline" href="/community/peta">Peta</Link> / Kirim informasi</nav>
      <PageHeader eyebrow="Direktori" title={p ? "Kirim koreksi" : "Kirim tempat latihan"}
        description="Bantu melengkapi direktori pencak silat. Setiap kiriman diperiksa redaksi." />
      <div className="max-w-3xl"><SubmissionForm facets={facets.data} place={p} /></div>
    </>
  );
}
