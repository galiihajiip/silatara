import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Play,
  ShieldCheck,
} from "lucide-react";
import { EnrollButton } from "@/components/EnrollButton";
import { MovementVisual } from "@/components/knowledge/Bits";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import { ProgressBar } from "@/components/ui";
import { formatMinutes } from "@/lib/format";
import type { CourseDetailK } from "@/lib/research";
import { LEVEL_ID } from "@/lib/research";
import { getCurrentUser, sGet } from "@/lib/server-api";
import type { CourseDetail } from "@/lib/types";

const META_CHIP =
  "inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed] backdrop-blur-xs";

/** Halaman kursus pengetahuan publik. Pendaftaran & progres hanya tampil bila kursus juga aktif di akun pelajar. */
export async function KnowledgeCourse({ c }: { c: CourseDetailK }) {
  const [db, user] = await Promise.all([
    sGet<CourseDetail>(`/courses/${encodeURIComponent(c.slug)}`),
    getCurrentUser(),
  ]);
  const first = c.modules[0]?.lessons[0];
  const enrollment = db.ok ? db.data.enrollment : null;
  const duration = formatMinutes(c.estimated_minutes);
  const levelLabel = LEVEL_ID[c.level] ?? c.level;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#fde68a]">
              <Link className="hover:underline" href={`/heritage/${c.tradition.slug}`}>
                {c.tradition.name}
              </Link>
            </p>
            <h1 className="font-serif text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {c.title}
            </h1>
            <p className="text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">{c.summary}</p>

            <ul aria-label="Ringkasan kursus" className="flex flex-wrap gap-2 pt-1">
              <li className={META_CHIP}>
                <Layers aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{c.module_count} modul</span>
              </li>
              <li className={META_CHIP}>
                <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{c.lesson_count} pelajaran</span>
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
          </div>

          {first && (
            <div className="shrink-0">
              <Link
                href={`/academy/courses/${c.slug}/lessons/${first.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#4a0d0d] shadow-md shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#fff6ee]"
              >
                <Play aria-hidden className="h-4 w-4 fill-current text-[#c2410c]" />
                <span>Mulai belajar</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2-Column Body */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start">
        <div className="min-w-0 space-y-8">
          {/* Goals Bento Card */}
          {c.goals.length > 0 && (
            <section
              aria-labelledby="tujuan"
              className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
            >
              <h2 id="tujuan" className="mb-4 font-serif text-2xl font-bold text-[#2e0909]">
                Yang akan Anda pelajari
              </h2>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {c.goals.map((g) => (
                  <li
                    key={g}
                    className="flex items-start gap-2.5 rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-3.5 text-sm leading-relaxed text-[#2e0909]"
                  >
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Silabus & Modul Bento Cards */}
          <section aria-labelledby="kurikulum" className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 id="kurikulum" className="font-serif text-2xl font-bold text-[#2e0909]">
                Silabus & Modul
              </h2>
              <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#9a3412]">
                {c.module_count} modul · {c.lesson_count} pelajaran
              </span>
            </div>

            <ol className="space-y-4">
              {c.modules.map((m) => (
                <li
                  key={m.order}
                  className="overflow-hidden rounded-[24px] border border-[#e7d7c8] bg-white shadow-2xs"
                >
                  <div className="border-b border-[#ece2d8] bg-[#faf7f4] px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] font-mono text-xs font-bold text-white shadow-2xs">
                          {String(m.order).padStart(2, "0")}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-[#2e0909]">{m.title}</h3>
                      </div>
                      <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold text-[#9a3412]">
                        {m.lessons.length} pelajaran
                      </span>
                    </div>
                    {m.summary && (
                      <p className="mt-2 pl-11 text-sm leading-relaxed text-slate-600">{m.summary}</p>
                    )}
                  </div>

                  <ol className="divide-y divide-[#ece2d8]">
                    {m.lessons.map((l) => (
                      <li key={l.slug}>
                        <Link
                          href={`/academy/courses/${c.slug}/lessons/${l.slug}`}
                          className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#fffaf5]"
                        >
                          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#faf7f4] font-mono text-xs font-semibold text-[#6d1b11] ring-1 ring-[#e7d7c8] group-hover:bg-[#fff6ee] group-hover:ring-[#fed7aa]">
                            {l.order}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#2e0909] group-hover:text-[#9a3412] group-hover:underline">
                              {l.title}
                            </p>
                            {l.description && (
                              <p className="mt-0.5 text-sm text-slate-600">{l.description}</p>
                            )}
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#ece2d8] bg-[#faf7f4] px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                            {l.duration_min} mnt
                            <ArrowRight
                              aria-hidden
                              className="h-3 w-3 text-[#9a3412] opacity-0 transition-opacity group-hover:opacity-100"
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>

          {/* Gerakan yang diajarkan */}
          {c.movements.length > 0 && (
            <section
              aria-labelledby="gerakan"
              className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
            >
              <h2 id="gerakan" className="mb-4 font-serif text-2xl font-bold text-[#2e0909]">
                Gerakan yang diajarkan ({c.movements.length})
              </h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {c.movements.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/library/${m.slug}`}
                      className="group block rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-2.5 text-xs transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
                    >
                      <MovementVisual a={m.animation} title={m.name} compact />
                      <span className="mt-2 block font-semibold text-[#2e0909] group-hover:underline">
                        {m.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sticky Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[5.25rem]">
          <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs">
            {first && (
              <Link
                href={`/academy/courses/${c.slug}/lessons/${first.slug}`}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-950/15 transition-all hover:from-[#3a0808] hover:to-[#9a3412]"
              >
                <Play aria-hidden className="h-4 w-4 fill-current" />
                <span>Mulai belajar</span>
              </Link>
            )}
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Semua pelajaran terbuka untuk dibaca.{" "}
              {db.ok ? "Masuk dan ikuti kursus ini bila ingin menyimpan progres." : ""}
            </p>
            {db.ok && (
              <div className="mt-4">
                <EnrollButton slug={c.slug} enrolled={!!enrollment} loggedIn={!!user} />
              </div>
            )}
            {enrollment && (
              <div className="mt-4 border-t border-[#ece2d8] pt-4">
                <ProgressBar progress={enrollment.progress} label="Progres Anda" />
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
