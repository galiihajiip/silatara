import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard, PartnerCard } from "@/components/Cards";
import { Card, ErrorState, Grid, PageHeader, SourceBox } from "@/components/ui";
import { MovementCard } from "@/components/knowledge/Bits";
import { apiGet } from "@/lib/api";
import { formatMinutes, PRACTICE_MODE_LABEL } from "@/lib/format";
import { sGet } from "@/lib/server-api";
import type { TraditionDetail as KTradition } from "@/lib/research";
import { CATEGORY_ENTITY_LABEL } from "@/lib/research";
import type { TraditionDetail } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = await apiGet<KTradition>(`/research/traditions/${encodeURIComponent(slug)}`);
  if (k.ok) return { title: `${k.data.name} | Jelajahi Warisan`, description: k.data.public_summary.slice(0, 160), alternates: { canonical: `/heritage/${slug}` } };
  const r = await sGet<TraditionDetail>(`/traditions/${encodeURIComponent(slug)}`);
  return { title: r.ok ? `${r.data.name} | Jelajahi Warisan` : "Tradisi", alternates: { canonical: `/heritage/${slug}` } };
}

export default async function TraditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = await apiGet<KTradition>(`/research/traditions/${encodeURIComponent(slug)}`);
  if (k.ok) {
    const t = k.data;
    return (
      <>
        <nav aria-label="Jejak halaman" className="mb-4 text-sm"><Link className="underline" href="/heritage">Jelajahi Warisan</Link> / {t.name}</nav>
        <PageHeader eyebrow={t.region ?? "Tradisi"} title={t.name} description={t.public_summary} />
        {t.courses.length > 0 && (
          <section aria-labelledby="kursus" className="mb-12">
            <h2 id="kursus" className="mb-4 font-serif text-2xl text-forest-900">Belajar di Akademi</h2>
            <ul className="grid gap-4 md:grid-cols-2">{t.courses.map((c) => (
              <li key={c.slug}><Link href={`/academy/courses/${c.slug}`} className="block h-full rounded-2xl border border-line-200 bg-paper-50 p-5 hover:border-forest-700">
                <h3 className="font-serif text-xl text-forest-900">{c.title}</h3>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600">{c.summary}</p>
                <p className="mt-3 text-sm text-slate-600">{c.module_count} modul · {c.lesson_count} pelajaran · {formatMinutes(c.estimated_minutes)}</p>
              </Link></li>))}</ul>
          </section>
        )}
        {t.movements.length > 0 && (
          <section aria-labelledby="gerakan" className="mb-12">
            <div className="mb-4 flex items-end justify-between gap-3"><h2 id="gerakan" className="font-serif text-2xl text-forest-900">Gerakan ({t.movements.length})</h2>
              <Link className="text-sm underline" href={`/library?tradisi=${t.slug}`}>Buka di Pustaka Gerakan</Link></div>
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-4">{t.movements.slice(0, 8).map((m) => <li key={m.slug}><MovementCard m={m} /></li>)}</ul>
          </section>
        )}
        {t.related_entities.length > 0 && (
          <section aria-labelledby="terkait" className="mb-12">
            <h2 id="terkait" className="mb-4 font-serif text-2xl text-forest-900">Catatan terkait</h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{t.related_entities.map((e) => (
              <li key={e.id}><Card className="h-full"><p className="text-xs uppercase tracking-wider text-bronze-700">{CATEGORY_ENTITY_LABEL[e.category]}</p>
                <p className="mt-1 font-medium">{e.name}</p>
                <p className="text-sm text-slate-600">{e.provinces.filter((x) => x !== "needs_verification").join(", ")}{e.localities?.length ? ` · ${e.localities.join("; ")}` : ""}</p>
                {e.notes && <p className="mt-2 text-sm text-slate-600">{e.notes}</p>}</Card></li>))}</ul>
          </section>
        )}
      </>
    );
  }

  const r = await sGet<TraditionDetail>(`/traditions/${encodeURIComponent(slug)}`);
  if (!r.ok) return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/heritage/${slug}`} />;
  const t = r.data;
  return (
    <>
      <nav aria-label="Jejak halaman" className="mb-4 text-sm"><Link className="underline" href="/heritage">Jelajahi Warisan</Link> / {t.name}</nav>
      <PageHeader eyebrow={t.region ?? "Tradisi"} title={t.name} description={t.public_summary ?? undefined} />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-10">
          {t.courses.length > 0 && <section aria-labelledby="kur"><h2 id="kur" className="mb-4 font-serif text-2xl text-forest-900">Kurikulum</h2>
            <Grid>{t.courses.map((c) => <CourseCard key={c.id} c={c} />)}</Grid></section>}
          {t.movements.length > 0 && <section aria-labelledby="ger"><h2 id="ger" className="mb-4 font-serif text-2xl text-forest-900">Gerakan</h2>
            <ul className="space-y-3">{t.movements.map((m) => (
              <li key={m.id}><Card><h3 className="font-semibold"><Link className="underline" href={`/library/${m.id}`}>{m.name_id}</Link></h3>
                <p className="text-sm text-slate-600">{PRACTICE_MODE_LABEL[m.practice_mode] ?? m.practice_mode}</p></Card></li>))}</ul></section>}
          {t.partners.length > 0 && <section aria-labelledby="mit"><h2 id="mit" className="mb-4 font-serif text-2xl text-forest-900">Perguruan terkait</h2>
            <Grid>{t.partners.map((p) => <PartnerCard key={p.id} p={p} />)}</Grid></section>}
        </div>
        <SourceBox p={t.provenance} />
      </div>
    </>
  );
}
