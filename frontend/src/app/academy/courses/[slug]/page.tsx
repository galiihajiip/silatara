import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  GraduationCap,
  Layers,
  Play,
  ShieldCheck,
} from "lucide-react";
import { EnrollButton } from "@/components/EnrollButton";
import { KnowledgeCourse } from "@/components/knowledge/KnowledgeCourse";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import { ErrorState, ProgressBar } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatMinutes, LEVEL_LABEL } from "@/lib/format";
import type { CourseDetailK } from "@/lib/research";
import { getCurrentUser, sGet } from "@/lib/server-api";
import type { CourseDetail } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = await apiGet<CourseDetailK>(`/research/courses/${encodeURIComponent(slug)}`);
  if (k.ok) {
    return {
      title: `${k.data.title} | Akademi`,
      description: k.data.summary.slice(0, 160),
      alternates: { canonical: `/academy/courses/${slug}` },
    };
  }
  return { title: "Kurikulum | Akademi", alternates: { canonical: `/academy/courses/${slug}` } };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = await apiGet<CourseDetailK>(`/research/courses/${encodeURIComponent(slug)}`);
  if (k.ok) return <KnowledgeCourse c={k.data} />;

  const [r, user] = await Promise.all([
    sGet<CourseDetail>(`/courses/${encodeURIComponent(slug)}`),
    getCurrentUser(),
  ]);
  if (!r.ok) {
    return r.status === 404 ? (
      notFound()
    ) : (
      <ErrorState message={r.error} retryHref={`/academy/courses/${slug}`} />
    );
  }

  const c = r.data;
  const enrolled = !!c.enrollment;
  const duration = formatMinutes(c.estimated_minutes);
  const firstLesson = c.modules[0]?.lessons[0];
  const levelLabel = LEVEL_LABEL[c.level] ?? c.level;

  return (
    <div className="space-y-8">
      <nav aria-label="Jejak halaman" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
        <Link className="font-medium text-[#6d1b11] underline-offset-2 hover:underline" href="/academy">
          Akademi
        </Link>
        <span aria-hidden>/</span>
        <span className="text-[#2e0909]">{c.title}</span>
      </nav>

      {/* Maroon-Amber Bento Course Hero Header */}
      <header className="relative overflow-hidden rounded-[28px] border border-[#7c1d1d]/35 bg-gradient-to-br from-[#2e0909] via-[#4a120b] to-[#7c1d1d] p-6 text-white shadow-lg sm:p-8">
        <SilatPatternTumpal className="text-[#fde68a]" opacity={0.075} />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-[#ea580c]/30 via-[#fbbf24]/15 to-transparent blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            {c.tradition_name && (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fde68a]">
                <Link className="hover:underline" href={`/heritage/${c.tradition_slug}`}>
                  {c.tradition_name}
                </Link>
              </p>
            )}
            <h1 className="font-serif text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {c.title}
            </h1>
            {c.summary && (
              <p className="text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">{c.summary}</p>
            )}

            <ul aria-label="Ringkasan kursus" className="flex flex-wrap gap-2 pt-1">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
                <Layers aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{c.modules.length} modul</span>
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
                <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{c.lesson_count} pelajaran</span>
              </li>
              {duration && (
                <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
                  <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                  <span>{duration}</span>
                </li>
              )}
              <li className="inline-flex items-center gap-1.5 rounded-full border border-[#fbbf24]/45 bg-[#fbbf24]/15 px-3 py-1 text-xs font-semibold text-[#fde68a]">
                <GraduationCap aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{levelLabel}</span>
              </li>
            </ul>
          </div>

          {firstLesson && (
            <div className="shrink-0">
              <Link
                href={`/academy/courses/${c.slug}/lessons/${firstLesson.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4a0d0d] shadow-md shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#fff6ee]"
              >
                <Play aria-hidden className="h-4 w-4 fill-current text-[#c2410c]" />
                <span>Mulai belajar</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="isi" className="space-y-4">
            <h2 id="isi" className="font-serif text-2xl font-bold text-[#2e0909]">
              Isi Kurikulum
            </h2>
            <div className="space-y-4">
              {c.modules.map((m, idx) => (
                <div
                  key={m.id}
                  className="overflow-hidden rounded-[24px] border border-[#e7d7c8] bg-white shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece2d8] bg-[#faf7f4] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] font-mono text-xs font-bold text-white">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#2e0909]">{m.title}</h3>
                    </div>
                    <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold text-[#9a3412]">
                      {m.lessons.length} pelajaran
                    </span>
                  </div>
                  <ol className="divide-y divide-[#ece2d8]">
                    {m.lessons.map((l) => (
                      <li key={l.id}>
                        <Link
                          className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[#fffaf5]"
                          href={`/academy/courses/${c.slug}/lessons/${l.slug}`}
                        >
                          {l.completed ? (
                            <CheckCircle2 aria-label="Selesai" className="h-5 w-5 shrink-0 text-[#c2410c]" />
                          ) : (
                            <Circle aria-hidden className="h-5 w-5 shrink-0 text-[#d6c7b8]" />
                          )}
                          <span className="flex-1 font-medium text-[#2e0909] group-hover:text-[#9a3412] group-hover:underline">
                            {l.title}
                          </span>
                          {formatMinutes(l.estimated_minutes) && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ece2d8] bg-[#faf7f4] px-2.5 py-1 font-mono text-xs text-slate-600">
                              {formatMinutes(l.estimated_minutes)}
                              <ArrowRight
                                aria-hidden
                                className="h-3 w-3 text-[#9a3412] opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[5.25rem]">
          {c.enrollment && (
            <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs">
              <ProgressBar progress={c.enrollment.progress} label="Progres Anda" />
              {c.enrollment.next_lesson_slug && (
                <Link
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                  href={`/app/courses/${c.slug}/lessons/${c.enrollment.next_lesson_slug}`}
                >
                  {c.enrollment.progress.completed ? "Lanjutkan belajar" : "Mulai belajar"}
                </Link>
              )}
            </div>
          )}

          <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs">
            <EnrollButton slug={c.slug} enrolled={enrolled} loggedIn={!!user} />
            {(c.tradition_name || c.instructor) && (
              <div className="mt-4 space-y-1.5 border-t border-[#ece2d8] pt-3 text-sm text-slate-600">
                {c.tradition_name && (
                  <p>
                    Tradisi:{" "}
                    <Link className="font-medium text-[#6d1b11] underline" href={`/heritage/${c.tradition_slug}`}>
                      {c.tradition_name}
                    </Link>
                  </p>
                )}
                {c.instructor && <p>Instruktur: {c.instructor.name}</p>}
              </div>
            )}
          </div>

          {c.safety_notes && (
            <div className="rounded-[24px] border border-[#fed7aa] bg-[#fff6ee] p-5 text-sm leading-relaxed text-[#6d1b11]">
              <p className="flex items-start gap-2.5">
                <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#9a3412]" />
                <span>{c.safety_notes}</span>
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
