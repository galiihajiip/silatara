import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Navigation, Pencil } from "lucide-react";
import { Card, ErrorState, PageHeader } from "@/components/ui";
import { LazyPlaceMiniMap } from "@/components/LazyClients";
import { apiGet } from "@/lib/api";
import { shortRegion, type PlaceDetail } from "@/lib/directory";

async function load(slug: string) {
  return apiGet<PlaceDetail>(`/directory/places/${encodeURIComponent(slug)}`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r.ok) return { title: "Tempat tidak ditemukan" };
  const p = r.data;
  return {
    title: `${p.name} · ${shortRegion(p.regency)}`,
    description: `${p.category_label} di ${[shortRegion(p.regency), p.province].filter(Boolean).join(", ")}. Informasi lokasi di peta perguruan pencak silat SILATARA.`,
    alternates: { canonical: `/community/tempat/${p.slug}` },
  };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await load(slug);
  if (!r.ok) return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/community/tempat/${slug}`} />;
  const p = r.data;
  const where = [p.village, p.district, shortRegion(p.regency), p.province].filter(Boolean).join(", ");
  return (
    <>
      <nav aria-label="Jejak halaman" className="mb-4 text-sm">
        <Link className="underline" href="/community/peta">Peta Perguruan</Link> / {p.name}
      </nav>
      <PageHeader eyebrow={p.category_label} title={p.name}
        description={p.organization ? `Bagian dari ${p.organization.name}.` : undefined} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <section aria-labelledby="lokasi">
            <h2 id="lokasi" className="mb-3 font-serif text-2xl text-forest-900">Lokasi</h2>
            <LazyPlaceMiniMap lat={p.lat} lng={p.lng} precision={p.precision} label={p.name} />
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-slate-600">Wilayah</dt><dd>{where}</dd>
              {p.address && <><dt className="text-slate-600">Alamat</dt><dd>{p.address}</dd></>}
              {p.locality_text && !p.address && <><dt className="text-slate-600">Disebut sumber</dt><dd>{p.locality_text}</dd></>}
              <dt className="text-slate-600">Ketepatan lokasi</dt><dd>{p.precision_label}</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {p.directions_url && <a href={p.directions_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-4 py-2 text-paper-50 hover:bg-forest-900"><Navigation aria-hidden className="h-4 w-4" />Petunjuk arah (OpenStreetMap)</a>}
              <a href={p.map_search_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line-200 bg-paper-50 px-4 py-2 hover:bg-parchment-100"><ExternalLink aria-hidden className="h-4 w-4" />Cari di Google Maps</a>
              <Link href={`/community/peta?provinsi=${p.province_code}&kabkota=${p.regency_code}`} className="inline-flex items-center gap-2 rounded-xl border border-line-200 bg-paper-50 px-4 py-2 hover:bg-parchment-100"><MapPin aria-hidden className="h-4 w-4" />Lihat di peta</Link>
            </div>
          </section>

          <section aria-labelledby="info">
            <h2 id="info" className="mb-3 font-serif text-2xl text-forest-900">Yang diketahui dari sumber</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {p.is_training_location && <li>Disebut sebagai tempat latihan.</li>}
              {p.is_organization_office && <li>Kantor atau sekretariat organisasi.</li>}
              {p.training_categories.map((t) => <li key={t}>Kelas: {t}</li>)}
              {p.sports_listed.length > 1 && <li>Gelanggang serbaguna; cabang yang tercantum: {p.sports_listed.join(", ").replaceAll("_", " ")}.</li>}
              {p.evidence.map((e) => <li key={e}>{e}</li>)}
            </ul>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
              <dt className="text-slate-600">Jadwal latihan</dt>
              <dd>{p.practice_schedule?.length ? p.practice_schedule.map((s) => `${s.day} ${s.time}${s.note ? ` (${s.note})` : ""}`).join("; ") : "Tidak dirinci dalam sumber."}</dd>
              <dt className="text-slate-600">Kontak</dt>
              <dd>{p.contact?.email || p.contact?.phone ? <>{p.contact.email && <a className="underline" href={`mailto:${p.contact.email}`}>{p.contact.email}</a>} {p.contact.phone}</> : "Tidak dirinci dalam sumber."}</dd>
              {p.website && <><dt className="text-slate-600">Situs</dt><dd><a className="underline" href={p.website} target="_blank" rel="noopener noreferrer">{p.website}</a></dd></>}
              <dt className="text-slate-600">Akses umum</dt><dd>{p.public_access === "open" ? "Terbuka untuk umum" : "Tidak dirinci dalam sumber."}</dd>
            </dl>
            {p.data_conflicts.length > 0 && (
              <div className="mt-4 rounded-xl border border-bronze-500/40 bg-bronze-500/10 p-3 text-sm">
                <p className="font-medium">Catatan perbedaan sumber</p>
                <ul className="list-disc pl-5">{p.data_conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            )}
            <p className="mt-4 text-sm text-slate-600">Sebelum datang, pastikan jadwal dan ketentuan latihan langsung kepada pengelola atau pelatih setempat.</p>
          </section>

          {p.same_regency.length > 0 && (
            <section aria-labelledby="sekitar">
              <h2 id="sekitar" className="mb-3 font-serif text-2xl text-forest-900">Lokasi lain di {shortRegion(p.regency)}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {p.same_regency.map((x) => <li key={x.slug}><Link className="block rounded-xl border border-line-200 bg-paper-50 p-3 hover:bg-parchment-100" href={`/community/tempat/${x.slug}`}><span className="font-medium">{x.name}</span><span className="block text-xs text-slate-600">{x.category_label}</span></Link></li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <p className="px-1 text-xs text-slate-600">{p.attribution ?? ""}{p.attribution ? " · " : ""}Diperbarui {new Date(p.record_updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.</p>
          <Card>
            <h2 className="mb-1 font-semibold">Ada yang perlu diperbaiki?</h2>
            <p className="mb-3 text-sm text-slate-600">Pengelola dan anggota dapat mengirim koreksi alamat, kontak, jadwal, atau kabar tempat yang sudah tutup.</p>
            <Link href={`/community/kirim-tempat?tempat=${p.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-line-200 px-3 py-2 text-sm hover:bg-parchment-100"><Pencil aria-hidden className="h-4 w-4" />Kirim koreksi</Link>
          </Card>
        </aside>
      </div>
    </>
  );
}
