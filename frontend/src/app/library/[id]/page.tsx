import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MovementDocumentView } from "@/components/MovementDocumentView";
import { ErrorState, SourceBox } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatDate, LEVEL_LABEL, SAFETY_LABEL } from "@/lib/format";
import type { MovementOut, PublicVersion } from "@/lib/types";
import type { MovementDetail } from "@/lib/research";
import { MovementArticle } from "@/components/knowledge/MovementArticle";
import { cleanMovementText, Pill } from "@/components/knowledge/Bits";
import { clipFor, type CharacterManifest } from "@/lib/character";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    const k = await apiGet<MovementDetail>(`/research/movements/${encodeURIComponent(id)}`);
    if (!k.ok) return { title: "Gerakan tidak ditemukan" };
    const phaseSummary = k.data.phases.map((p) => p.name).join(", ");
    const desc = `${k.data.names.primary} (${k.data.category_label}): panduan ${k.data.phases.length} fase gerak, ${phaseSummary}.`;
    return {
      title: `${k.data.names.primary} | Pustaka Gerakan`,
      description: desc.slice(0, 160),
      alternates: { canonical: `/library/${id}` },
    };
  }
  const r = await apiGet<MovementOut>(`/movements/${id}`);
  return {
    title: r.ok ? `${r.data.name_id} | Pustaka Gerakan` : "Gerakan",
    alternates: { canonical: `/library/${id}` },
  };
}

/** `/library/<slug>` = artikel pengetahuan (basis sumber); `/library/<uuid>` = dokumentasi resmi mitra dari Studio. */
export default async function LibraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    const [k, ch, pr] = await Promise.all([
      apiGet<MovementDetail>(`/research/movements/${encodeURIComponent(id)}`),
      apiGet<CharacterManifest>("/research/character"),
      apiGet<{ items: { movement_id: string; status: string }[] }>("/research/assessment/protocols"),
    ]);
    if (!k.ok)
      return k.status === 404 ? notFound() : <ErrorState message={k.error} retryHref={`/library/${id}`} />;
    const clip = clipFor(ch.ok ? ch.data : null, k.data.id);
    const practice =
      pr.ok && pr.data.items.some((p) => p.movement_id === k.data.id && p.status === "active");
    return <MovementArticle m={k.data} clip={clip} practice={practice} />;
  }

  const [r, v] = await Promise.all([
    apiGet<MovementOut>(`/movements/${id}`),
    apiGet<PublicVersion[]>(`/movements/${id}/versions`),
  ]);
  if (!r.ok)
    return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/library/${id}`} />;
  const m = r.data;

  return (
    <div className="mx-auto max-w-4xl">
      <nav
        aria-label="Jejak halaman"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-600"
      >
        <Link className="transition-colors hover:text-[#6d1b11] hover:underline" href="/library">
          Pustaka Gerakan
        </Link>
        {m.tradition_slug && (
          <>
            <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
            <Link
              className="transition-colors hover:text-[#6d1b11] hover:underline"
              href={`/heritage/${m.tradition_slug}`}
            >
              {m.tradition_name}
            </Link>
          </>
        )}
        <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-900">{m.name_id}</span>
      </nav>

      <header className="mx-auto max-w-3xl text-center">
        {m.tradition_name && (
          <p className="text-xs font-bold uppercase tracking-widest text-[#9a3412]">
            {m.tradition_name}
          </p>
        )}
        <h1 className="mt-2 font-serif text-3xl leading-tight text-[#2e0909] sm:text-4xl">
          {m.name_id}
        </h1>
        {m.name_local && <p className="mt-1 text-base text-slate-600">{m.name_local}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {m.level && <Pill>{LEVEL_LABEL[m.level]}</Pill>}
          {m.safety_category && m.safety_category !== "solo_beginner" && (
            <Pill tone="warn">{SAFETY_LABEL[m.safety_category]}</Pill>
          )}
          {m.partner_name && (
            <Pill>
              {m.partner_slug ? (
                <Link className="hover:underline" href={`/community/${m.partner_slug}`}>
                  {m.partner_name}
                </Link>
              ) : (
                m.partner_name
              )}
            </Pill>
          )}
        </div>
      </header>

      <div className="mt-8">
        {m.document ? (
          <MovementDocumentView doc={m.document} layout="centered" />
        ) : (
          <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-6 shadow-xs">
            {m.description && (
              <p className="max-w-prose text-slate-700">{cleanMovementText(m.description)}</p>
            )}
            {m.safety_notes && (
              <p className="mt-3 text-sm text-[#9a3412]">
                <strong>Perhatikan:</strong> {cleanMovementText(m.safety_notes)}
              </p>
            )}
          </div>
        )}
      </div>

      <aside className="mt-10 grid gap-5 md:grid-cols-2">
        <SourceBox p={m.provenance} />
        {v.ok && v.data.length > 0 && (
          <section
            aria-labelledby="versi"
            className="rounded-2xl border border-[#e7d7c8] bg-white p-4 text-sm shadow-2xs"
          >
            <h2 id="versi" className="mb-2 font-semibold text-[#2e0909]">
              Riwayat versi
            </h2>
            <ol className="space-y-2">
              {v.data.map((x) => (
                <li key={x.version_no}>
                  <span className="font-medium">Versi {x.version_no}</span>
                  {x.is_current && (
                    <span className="ml-2 rounded-full bg-[#6d1b11]/10 px-2 py-0.5 text-xs font-medium text-[#2e0909]">
                      tayang
                    </span>
                  )}
                  <span className="block text-xs text-slate-600">
                    {formatDate(x.published_at)}
                    {x.status === "archived" ? " · diarsipkan" : ""}
                  </span>
                  {x.changelog && <span className="block text-slate-600">{x.changelog}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </aside>
    </div>
  );
}
