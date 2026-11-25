import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  ShieldAlert,
  Target,
} from "lucide-react";
import { BentoCard, CMS_BTN_PRIMARY, CMS_BTN_SECONDARY_SM } from "@/components/cms/Bento";
import { LessonActions } from "@/components/LessonActions";
import { MovementDocumentView } from "@/components/MovementDocumentView";
import { ErrorState, ProvenanceBadge, SourceBox } from "@/components/ui";
import { formatMinutes, paragraphs, PRACTICE_MODE_LABEL, SAFETY_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { LessonDetail } from "@/lib/types";

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonSlug: string }> }) {
  const { slug, lessonSlug } = await params;
  await requireUser(`/app/courses/${slug}/lessons/${lessonSlug}`);
  const r = await sGet<LessonDetail>(`/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(lessonSlug)}`);
  if (!r.ok) {
    return r.status === 404 ? notFound() : (
      <ErrorState message={r.error} retryHref={`/app/courses/${slug}/lessons/${lessonSlug}`} />
    );
  }
  const l = r.data;
  const base = `/app/courses/${slug}/lessons`;
  const durationLabel = formatMinutes(l.estimated_minutes);
  const bodyParagraphs = paragraphs(l.body);
  const isCompleted = l.lesson_status === "completed";

  return (
    <article className="space-y-6">
      {/* Clean Dicoding-style Lesson Header Bar */}
      <header className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6">
        <nav
          aria-label="Jejak halaman"
          className="mb-3 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <Link className="transition-colors hover:text-forest-800 hover:underline" href="/academy">
            Akademi
          </Link>
          <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
          <Link className="text-forest-800 hover:text-bronze-700 hover:underline" href={`/academy/courses/${slug}`}>
            {l.course.title}
          </Link>
          <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-700">{l.module_title}</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl">{l.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {durationLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  <Clock aria-hidden className="h-3.5 w-3.5 text-bronze-500" />
                  {durationLabel}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  isCompleted
                    ? "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]"
                    : l.enrolled
                      ? "border-amber-200 bg-amber-50 text-[#9a3412]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                    Selesai
                  </>
                ) : l.enrolled ? (
                  <>
                    <BookOpen aria-hidden className="h-3.5 w-3.5" />
                    Sedang dipelajari
                  </>
                ) : (
                  "Pratinjau materi"
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Reader Grid + Sticky Right Rail */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          {/* Target Belajar Callout Card */}
          {l.objective && (
            <section
              aria-labelledby="tujuan"
              className="rounded-[22px] border border-[#fed7aa] bg-[#fff6ee] p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white text-[#6d1b11] shadow-2xs">
                  <Target aria-hidden className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h2 id="tujuan" className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    Target Belajar
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[#2e0909]">{l.objective}</p>
                </div>
              </div>
            </section>
          )}

          {/* Compact Amber Safety Notice Banner */}
          {l.safety_notes && (
            <aside
              aria-label="Catatan keselamatan"
              className="flex items-start gap-3 rounded-[20px] border border-[#fed7aa] bg-amber-50 px-4 py-3.5 text-sm text-[#2e0909]"
            >
              <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9a3412]">
                  Catatan Keselamatan
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{l.safety_notes}</p>
              </div>
            </aside>
          )}

          {/* Main Reading Card */}
          {bodyParagraphs.length > 0 && (
            <BentoCard>
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  <BookOpen aria-hidden className="h-3.5 w-3.5 text-[#9a3412]" />
                  Materi Pelajaran
                </span>
                {durationLabel && (
                  <span className="text-xs text-slate-400">Estimasi {durationLabel}</span>
                )}
              </div>
              <section
                aria-label="Isi pelajaran"
                className="max-w-prose space-y-4 text-[15px] leading-[1.75] text-slate-700"
              >
                {bodyParagraphs.map((p, i) => (
                  <p key={i} className={i === 0 ? "text-slate-900" : undefined}>
                    {p}
                  </p>
                ))}
              </section>
            </BentoCard>
          )}

          {/* Movement Card with Crisp Metadata Pills */}
          {l.movement && (
            <BentoCard>
              <section aria-labelledby="gerakan" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                      <Layers aria-hidden className="h-3.5 w-3.5" />
                      Gerakan yang Dipelajari
                    </p>
                    <h2 id="gerakan" className="mt-1 text-xl font-bold tracking-tight text-forest-900">
                      {l.movement.name_id}
                      {l.movement.name_local ? (
                        <span className="ml-2 text-sm font-medium text-slate-500">({l.movement.name_local})</span>
                      ) : null}
                    </h2>
                  </div>
                  <Link className={CMS_BTN_SECONDARY_SM} href={`/library/${l.movement.id}`}>
                    Halaman gerakan <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap gap-2">
                  {l.movement.partner_name && l.movement.partner_slug && (
                    <Link
                      href={`/community/${l.movement.partner_slug}`}
                      className="inline-flex items-center rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#6d1b11] transition-colors hover:bg-[#fed7aa]/60"
                    >
                      Perguruan: {l.movement.partner_name}
                    </Link>
                  )}
                  {l.movement.safety_category && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      {SAFETY_LABEL[l.movement.safety_category]}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                    {PRACTICE_MODE_LABEL[l.movement.practice_mode] ?? l.movement.practice_mode}
                  </span>
                  {l.movement.version_no && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      Versi {l.movement.version_no}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    Penilaian AI: {l.movement.assessment_enabled ? "tersedia" : "belum tersedia"}
                  </span>
                </div>

                {l.movement.document ? (
                  <div className="pt-1">
                    <MovementDocumentView doc={l.movement.document} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {l.movement.description && (
                      <p className="max-w-prose text-sm leading-relaxed text-slate-700">{l.movement.description}</p>
                    )}
                    {l.movement.safety_notes && (
                      <div className="rounded-2xl border border-[#fed7aa] bg-amber-50 px-4 py-3 text-sm text-slate-700">
                        <strong className="text-[#9a3412]">Keselamatan gerakan:</strong> {l.movement.safety_notes}
                      </div>
                    )}
                  </div>
                )}

                <details className="group rounded-2xl border border-slate-200/80 bg-slate-50/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700">
                    <span>Sumber &amp; atribusi gerakan</span>
                    <ChevronDown aria-hidden className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-slate-200/70 p-3">
                    <SourceBox p={l.movement.provenance} />
                  </div>
                </details>
              </section>
            </BentoCard>
          )}

          {/* Compact Collapsible Supporting Materials */}
          {l.materials.length > 0 && (
            <BentoCard>
              <section aria-labelledby="materi" className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="materi" className="inline-flex items-center gap-2 text-base font-bold text-forest-900">
                    <FileText aria-hidden className="h-4 w-4 text-[#9a3412]" />
                    Materi pendukung
                  </h2>
                  <span className="rounded-full bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold text-[#9a3412]">
                    {l.materials.length} bahan
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {l.materials.map((m) => (
                    <li key={m.id}>
                      <details className="group rounded-2xl border border-slate-200/80 bg-slate-50/60 transition-colors open:border-[#fed7aa] open:bg-white">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-forest-900">
                          <span className="min-w-0 truncate">{m.title}</span>
                          <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm">
                          {m.content && <p className="leading-relaxed text-slate-600">{m.content}</p>}
                          {m.url && (
                            <a
                              className="inline-flex items-center gap-1.5 font-semibold text-[#6d1b11] hover:text-[#9a3412] hover:underline"
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                            >
                              Buka tautan (situs luar)
                              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <p className="text-xs text-slate-500">Atribusi: {m.attribution_text}</p>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            </BentoCard>
          )}

          {/* Camera Practice Entry Card */}
          <BentoCard className="border-[#fed7aa]/90">
            <section aria-labelledby="latihan" data-testid="practice-entry" className="space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]">
                    <Camera aria-hidden className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 id="latihan" className="text-base font-bold text-forest-900">
                      Latihan dengan kamera
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">{l.practice.label}</p>
                  </div>
                </div>

                {l.practice.available && l.enrolled && (
                  <Link
                    data-testid="start-practice"
                    href={`${base}/${l.slug}/practice`}
                    className={CMS_BTN_PRIMARY}
                  >
                    <Camera aria-hidden className="h-4 w-4" />
                    Mulai Latihan
                  </Link>
                )}
              </div>

              {l.practice.available && !l.enrolled && (
                <p className="rounded-xl bg-[#fff6ee] px-3.5 py-2.5 text-sm text-[#6d1b11]">
                  Ikuti kurikulum ini terlebih dahulu untuk membuka latihan.
                </p>
              )}
              {!l.practice.available && (
                <p className="text-sm text-slate-500">Latihan kamera belum tersedia untuk pelajaran ini.</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Studio memeriksa keterlihatan tubuh; bukan penilaian gerakan atau saran medis.</span>
                <Link
                  className="inline-flex items-center gap-1 font-semibold text-forest-800 hover:text-bronze-700 hover:underline"
                  href={`/app/practice?lesson=${l.id}`}
                >
                  Riwayat latihan pelajaran ini <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>
          </BentoCard>
        </div>

        {/* Sticky Right Rail (Desktop) */}
        <aside aria-label="Aksi dan sumber pelajaran" className="space-y-4 lg:sticky lg:top-[5.75rem] lg:self-start">
          <BentoCard className="!p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Progres Pelajaran
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isCompleted
                    ? "bg-[#fff6ee] text-[#6d1b11]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isCompleted ? "Selesai" : "Belum selesai"}
              </span>
            </div>

            <LessonActions
              lessonId={l.id}
              courseSlug={slug}
              enrolled={l.enrolled}
              completed={isCompleted}
            />

            <div className="border-t border-slate-100 pt-3">
              <Link
                href={`/academy/courses/${slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-bronze-700 hover:underline"
              >
                <BookOpen aria-hidden className="h-3.5 w-3.5" />
                Lihat silabus kurikulum
              </Link>
            </div>
          </BentoCard>

          <details className="group rounded-[24px] border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
              <div className="min-w-0 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Sumber &amp; Atribusi
                </p>
                <ProvenanceBadge p={l.provenance} />
              </div>
              <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-slate-100 p-4 pt-3">
              <SourceBox p={l.provenance} />
            </div>
          </details>
        </aside>
      </div>

      {/* Dicoding-style Bottom Prev / Next Lesson Stepper Bar */}
      <nav
        aria-label="Navigasi pelajaran"
        className="grid gap-3 border-t border-slate-200/90 pt-6 sm:grid-cols-2"
      >
        {l.prev_lesson ? (
          <Link
            href={`${base}/${l.prev_lesson.slug}`}
            className="group flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-colors group-hover:border-[#fed7aa] group-hover:bg-[#fff6ee] group-hover:text-[#6d1b11]">
              <ArrowLeft aria-hidden className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Sebelumnya
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-forest-900 group-hover:text-[#6d1b11]">
                {l.prev_lesson.title}
              </span>
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        {l.next_lesson ? (
          <Link
            href={`${base}/${l.next_lesson.slug}`}
            className="group flex items-center justify-between gap-3 rounded-[20px] border border-[#fed7aa] bg-white p-4 text-right shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all hover:bg-[#fff6ee]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a3412]">
                Berikutnya
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-forest-900 group-hover:text-[#6d1b11]">
                {l.next_lesson.title}
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white shadow-sm">
              <ArrowRight aria-hidden className="h-4 w-4" />
            </span>
          </Link>
        ) : (
          <Link
            href={`/academy/courses/${slug}`}
            className="group flex items-center justify-between gap-3 rounded-[20px] border border-[#fed7aa] bg-white p-4 text-right shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all hover:bg-[#fff6ee]"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#9a3412]">
                Akhir Modul
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-forest-900 group-hover:text-[#6d1b11]">
                Kembali ke kurikulum
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff6ee] text-[#6d1b11]">
              <BookOpen aria-hidden className="h-4 w-4" />
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
