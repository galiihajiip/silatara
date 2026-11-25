import Link from "next/link";
import { notFound } from "next/navigation";
import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { LazyPracticeStudio } from "@/components/LazyClients";
import { ErrorState } from "@/components/ui";
import { requireUser, sGet } from "@/lib/server-api";
import type { LessonDetail } from "@/lib/types";

export const metadata = { title: "Practice Studio", robots: { index: false } };
const SCENARIOS = ["cycle", "waiting", "full", "partial", "out_of_frame", "multiple"] as const;

export default async function PracticePage({ params, searchParams }: {
  params: Promise<{ slug: string; lessonSlug: string }>; searchParams: Promise<{ sim?: string; scenario?: string }>;
}) {
  const { slug, lessonSlug } = await params;
  const sp = await searchParams;
  await requireUser(`/app/courses/${slug}/lessons/${lessonSlug}/practice`);
  const r = await sGet<LessonDetail>(`/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`);
  if (!r.ok) return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/app/courses/${slug}/lessons/${lessonSlug}/practice`} />;
  const l = r.data;
  const back = `/app/courses/${slug}/lessons/${lessonSlug}`;
  if (!l.enrolled || !l.practice.available) {
    return (
      <div className="space-y-5">
        <CmsPageHeader eyebrow="Practice Studio" title={l.title} />
        <BentoCard className="max-w-2xl">
          <p className="text-sm text-slate-700">{!l.enrolled ? "Daftar ke kurikulum ini terlebih dahulu untuk berlatih." : l.practice.label}</p>
          <Link className="mt-3 inline-block text-sm font-medium text-forest-800 underline" href={!l.enrolled ? `/academy/courses/${slug}` : back}>
            {!l.enrolled ? "Buka kurikulum" : "Kembali ke materi"}
          </Link>
        </BentoCard>
      </div>
    );
  }
  // Mode simulasi (landmark sintetis) hanya bila diaktifkan di server (dev/E2E) DAN diminta lewat ?sim=1. Tidak aktif di produksi.
  const simEnabled = process.env.ENABLE_SYNTHETIC_PRACTICE === "true" && sp.sim === "1";
  const scenario = (SCENARIOS as readonly string[]).includes(sp.scenario ?? "") ? (sp.scenario as (typeof SCENARIOS)[number]) : "cycle";
  return (
    <div className="space-y-5">
      <CmsPageHeader
        eyebrow="Practice Studio"
        title="Latihan terpandu kamera"
        description="Memeriksa keterlihatan tubuh Anda di kamera (bukan penilaian gerakan)."
      />
      <LazyPracticeStudio
        synthetic={simEnabled}
        scenario={scenario}
        lesson={{
          id: l.id,
          title: l.title,
          slug: l.slug,
          courseSlug: slug,
          courseTitle: l.course.title,
          isDemo: l.practice.is_demo,
          practiceLabel: l.practice.label,
          verificationLabel: l.provenance.verification_label,
          objective: l.objective,
          safetyNotes: l.safety_notes,
        }}
      />
    </div>
  );
}
