import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LazyAssessmentPractice, LazyMovement3DPlayer } from "@/components/LazyClients";
import { PracticeReferencePanel } from "@/components/assessment/PracticeReferencePanel";
import { MovementVisual } from "@/components/knowledge/Bits";
import { ErrorState } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { clipFor, type CharacterManifest } from "@/lib/character";
import type { MovementDetail } from "@/lib/research";
import { getCurrentUser } from "@/lib/server-api";
import type { Protocol } from "@/features/assessment/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Latihan kamera · ${id.replaceAll("-", " ")}`, robots: { index: false }, alternates: { canonical: `/library/${id}/latihan` } };
}

const STEPS = ["Pelajari gerakan", "Lihat peraga 3D", "Coba latihan", "Analisis gerakan", "Skor & saran"];
const ACTIVE_STEP_INDEX = 2;

export default async function PracticePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pelajaran?: string }> }) {
  const { id } = await params;
  const { pelajaran } = await searchParams;
  const m = await apiGet<MovementDetail>(`/research/movements/${encodeURIComponent(id)}`);
  if (!m.ok) return m.status === 404 ? notFound() : <ErrorState message={m.error} retryHref={`/library/${id}/latihan`} />;
  const [p, ch, user] = await Promise.all([
    apiGet<Protocol>(`/research/assessment/protocols/${encodeURIComponent(m.data.id)}`),
    apiGet<CharacterManifest>("/research/character"),
    getCurrentUser(),
  ]);
  if (!p.ok || p.data.status !== "active") {
    return (
      <div className="space-y-6">
        <header className="rounded-[28px] border border-[#e7d7c8] bg-white p-6 shadow-xs sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9a3412]">LATIHAN KAMERA</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight text-[#2e0909] sm:text-4xl">{m.data.names.primary}</h1>
        </header>
        <div className="max-w-2xl rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs">
          <p className="text-slate-700">Latihan dengan penilaian kamera belum tersedia untuk gerakan ini. Pelajari uraian dan peraganya terlebih dahulu.</p>
          <Link
            className="mt-4 inline-flex items-center rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-[#3a0808] hover:to-[#9a3412]"
            href={`/library/${id}`}
          >
            Kembali ke gerakan
          </Link>
        </div>
      </div>
    );
  }
  const clip = clipFor(ch.ok ? ch.data : null, m.data.id);
  const proto = p.data;
  return (
    <div className="space-y-4">
      <header className="rounded-[24px] border border-[#e7d7c8] bg-white px-5 py-4 shadow-xs sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Jejak halaman" className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600">
            <Link className="transition-colors hover:text-[#6d1b11] hover:underline" href="/library">Pustaka Gerakan</Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
            <Link className="transition-colors hover:text-[#6d1b11] hover:underline" href={`/library/${id}`}>{m.data.names.primary}</Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-[#2e0909]">Latihan</span>
          </nav>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#9a3412]">LATIHAN KAMERA</p>
        </div>

        <div className="mt-2.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-serif text-2xl leading-tight text-[#2e0909] sm:text-3xl">Coba {m.data.names.primary}</h1>
          </div>

          <ol className="flex flex-wrap gap-1.5 text-xs" aria-label="Langkah latihan">
            {STEPS.map((s, i) => {
              const active = i === ACTIVE_STEP_INDEX;
              return (
                <li
                  key={s}
                  aria-current={active ? "step" : undefined}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition-colors ${
                    active
                      ? "border-[#fed7aa] bg-[#fff6ee] font-semibold text-[#9a3412] shadow-xs"
                      : "border-slate-200/80 bg-slate-50/70 text-slate-600"
                  }`}
                >
                  <span className={active ? "text-[#6d1b11]" : "font-medium text-slate-500"}>{i + 1}.</span>
                  <span>{s}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <LazyAssessmentPractice protocol={proto} movementTitle={m.data.names.primary} loggedIn={!!user} lessonRef={pelajaran} />
        </div>

        <aside className="lg:sticky lg:top-6">
          <PracticeReferencePanel
            criteria={proto.criteria}
            phaseCompletionWeight={proto.phase_completion_weight}
            disclaimer={proto.disclaimer}
          >
            {clip ? (
              <LazyMovement3DPlayer clip={clip} title={m.data.names.primary} fallback={<MovementVisual a={m.data.animation} title={m.data.names.primary} />} />
            ) : (
              <MovementVisual a={m.data.animation} title={m.data.names.primary} />
            )}
          </PracticeReferencePanel>
        </aside>
      </div>
    </div>
  );
}
