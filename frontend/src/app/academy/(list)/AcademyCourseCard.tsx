import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap, Layers, Play } from "lucide-react";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import { formatMinutes } from "@/lib/format";
import type { Curricula } from "@/lib/research";
import { LEVEL_ID } from "@/lib/research";

export type AcademyCourse = Curricula["items"][number];

const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#4a0d0d] shadow-md shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#fff6ee] hover:shadow-lg";

const SECONDARY_CTA =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#fed7aa]/50 bg-white/12 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:-translate-y-0.5 hover:border-[#fde68a] hover:bg-white/20";

const META_CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed] backdrop-blur-xs";

export function AcademyCourseCard({ course }: { course: AcademyCourse }) {
  const lessonsCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const firstLesson = course.modules[0]?.lessons[0];
  const duration = formatMinutes(course.estimated_minutes);
  const levelLabel = LEVEL_ID[course.level] ?? course.level;
  const compactModules = course.modules.length <= 2;
  const moduleRange =
    course.modules.length > 1
      ? `${String(course.modules[0].order).padStart(2, "0")}–${String(course.modules[course.modules.length - 1].order).padStart(2, "0")}`
      : course.modules.length === 1
        ? String(course.modules[0].order).padStart(2, "0")
        : null;

  return (
    <li className="overflow-hidden rounded-[28px] border border-[#e7d7c8] bg-white p-2.5 shadow-sm sm:p-3">
      <div className="grid gap-3 lg:grid-cols-[0.95fr_1.15fr] lg:items-stretch">
        {/* Left: Deep Royal Maroon Spotlight Card */}
        <div className="relative flex flex-col overflow-hidden rounded-[22px] bg-gradient-to-br from-[#2e0909] via-[#4a120b] to-[#7c1d1d] p-6 text-white shadow-md sm:p-7">
          <SilatPatternTumpal className="text-[#fde68a]" opacity={0.07} />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#ea580c]/30 via-[#fbbf24]/15 to-transparent blur-3xl"
          />

          <div className="relative z-10 flex flex-1 flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#fde68a]">
              {course.tradition}
            </p>
            <h2 className="mt-2 font-serif text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-[1.7rem]">
              <Link
                className="transition-colors hover:text-[#fde68a] hover:underline"
                href={`/academy/courses/${course.slug}`}
              >
                {course.title}
              </Link>
            </h2>
            <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[#ffedd5]/90">
              {course.summary}
            </p>

            <ul aria-label="Ringkasan kursus" className="mt-5 flex flex-wrap gap-2">
              <li className={META_CHIP}>
                <Layers aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{course.modules.length} modul</span>
              </li>
              <li className={META_CHIP}>
                <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{lessonsCount} pelajaran</span>
              </li>
              {duration && (
                <li className={META_CHIP}>
                  <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                  <span>{duration}</span>
                </li>
              )}
              <li className="inline-flex items-center gap-1.5 rounded-full border border-[#fbbf24]/45 bg-[#fbbf24]/15 px-3 py-1 text-xs font-semibold text-[#fde68a]">
                <GraduationCap aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{levelLabel}</span>
              </li>
            </ul>

            <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-7">
              {firstLesson && (
                <Link
                  href={`/academy/courses/${course.slug}/lessons/${firstLesson.slug}`}
                  className={PRIMARY_CTA}
                >
                  <Play aria-hidden className="h-3.5 w-3.5 fill-current text-[#c2410c]" />
                  <span>Mulai pelajaran pertama</span>
                </Link>
              )}
              <Link href={`/academy/courses/${course.slug}`} className={SECONDARY_CTA}>
                <span>Lihat kurikulum</span>
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Structured Curriculum Roadmap */}
        {course.modules.length > 0 && (
          <div className="flex flex-col justify-between rounded-[22px] border border-[#fed7aa]/75 bg-[#faf7f4] p-5 sm:p-6">
            <div>
              <div className="mb-3.5 flex items-center justify-between gap-2 px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a3412]">
                  Peta Kurikulum
                </span>
                {moduleRange && (
                  <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#9a3412]">
                    {moduleRange}
                  </span>
                )}
              </div>
              <ol
                className={`grid gap-2.5 ${course.modules.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
              >
                {course.modules.map((m) => {
                  const modFirst = m.lessons[0];
                  const pillContent = (
                    <>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] font-mono text-[11px] font-bold text-white shadow-2xs">
                        {String(m.order).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-xs font-semibold leading-snug text-[#2e0909]">
                          {m.title}
                        </span>
                        {compactModules && m.summary && (
                          <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-slate-600">
                            {m.summary}
                          </span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-slate-500">
                          {m.lessons.length} pelajaran
                        </span>
                      </span>
                    </>
                  );
                  const pillClass =
                    "flex items-start gap-3 rounded-2xl border border-[#ece2d8] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(46,9,9,0.04)]";

                  return (
                    <li key={m.id} className="min-w-0">
                      {modFirst ? (
                        <Link
                          href={`/academy/courses/${course.slug}/lessons/${modFirst.slug}`}
                          className={`${pillClass} transition-all duration-150 hover:-translate-y-0.5 hover:border-[#ea580c]/55 hover:bg-[#fffaf5] hover:shadow-xs`}
                        >
                          {pillContent}
                        </Link>
                      ) : (
                        <div className={pillClass}>{pillContent}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {compactModules && course.safety_notes && (
              <p className="mt-4 rounded-2xl border border-[#fed7aa]/70 bg-[#fff6ee] px-3.5 py-2.5 text-xs leading-relaxed text-[#6d1b11]">
                {course.safety_notes}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
