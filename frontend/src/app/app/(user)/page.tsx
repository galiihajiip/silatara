import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Box,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  BentoCard,
  BentoKpi,
  CMS_BTN_PRIMARY,
  CMS_BTN_PRIMARY_SM,
  CMS_BTN_SECONDARY,
  CMS_BTN_SECONDARY_SM,
  CmsPageHeader,
} from "@/components/cms/Bento";
import { ErrorState, ProgressBar } from "@/components/ui";
import { LazyActivityChart } from "@/components/LazyClients";
import { SessionRow } from "@/components/PracticeBits";
import { formatDuration } from "@/lib/format";
import { sGet, requireUser } from "@/lib/server-api";
import type { MyEnrollment, MyProgress, PracticeSummary } from "@/lib/types";

export const metadata = { title: "Ringkasan" };

const QUICK_START_STEPS = [
  {
    step: "01",
    href: "/academy",
    title: "Pilih Kurikulum di Akademi",
    description: "Ikuti jalur belajar terstruktur dari sikap dasar hingga pola langkah.",
    cta: "Buka Akademi",
    Icon: BookOpen,
  },
  {
    step: "02",
    href: "/library",
    title: "Amati Pustaka Gerakan",
    description: "Pelajari uraian fase, fokus tubuh, dan arahan keselamatan tiap gerakan.",
    cta: "Buka Pustaka",
    Icon: Box,
  },
  {
    step: "03",
    href: "/app/practice/camera-check",
    title: "Siapkan Kamera Latihan",
    description: "Periksa pencahayaan dan jarak kamera sebelum mencoba latihan mandiri.",
    cta: "Uji Kamera",
    Icon: Camera,
  },
] as const;

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickSpotlight(enrollments: MyEnrollment[]): MyEnrollment | null {
  if (enrollments.length === 0) return null;
  return (
    enrollments.find((item) => item.enrollment.status !== "completed" && Boolean(item.enrollment.next_lesson_slug)) ??
    enrollments.find((item) => item.enrollment.status !== "completed") ??
    enrollments[0]
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const [user, sp, r, ps] = await Promise.all([
    requireUser("/app"),
    searchParams,
    sGet<MyProgress>("/me/progress"),
    sGet<PracticeSummary>("/me/practice-summary?tz_offset=420"),
  ]);

  const totals = r.ok ? r.data.totals : { completed: 0, total: 0, percent: 0 };
  const coursesCompleted = r.ok ? r.data.courses_completed : 0;
  const totalSessions = ps.ok ? ps.data.total_sessions : 0;
  const weekSessions = ps.ok ? ps.data.sessions_last_7_days : 0;
  const weekActiveMs = ps.ok ? ps.data.active_seconds_last_7_days * 1000 : 0;
  const enrollments = r.ok ? r.data.enrollments : [];
  const spotlight = pickSpotlight(enrollments);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Ringkasan"
        title={`Halo, ${user.display_name}`}
        description="Pantau progres kurikulum dan jadwal latihan mandiri Anda."
        actions={
          <>
            <Link href="/app/practice/camera-check" className={CMS_BTN_SECONDARY}>
              <Camera aria-hidden className="h-4 w-4" />
              Uji Kamera
            </Link>
            <Link href="/academy" className={CMS_BTN_PRIMARY}>
              <BookOpen aria-hidden className="h-4 w-4" />
              Jelajahi Akademi
            </Link>
          </>
        }
      />

      {sp.akses === "ditolak" && (
        <div role="alert" className="rounded-[20px] border border-clay-600/30 bg-clay-600/5 px-5 py-3.5 text-sm font-medium text-clay-600">
          Peran Anda tidak memiliki akses ke halaman tersebut.
        </div>
      )}

      {/* Top Spotlight: Lanjutkan Belajar (enrolled) OR 3-step Quick-Start Bento (not enrolled) */}
      {r.ok && spotlight ? (
        <section aria-labelledby="spotlight-belajar">
          <BentoCard className="border-[#fed7aa] bg-white">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    <Sparkles aria-hidden className="h-3.5 w-3.5 text-[#ea580c]" />
                    Lanjutkan Belajar
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {spotlight.enrollment.status === "completed" ? "Selesai" : "Aktif"}
                  </span>
                </div>

                <div>
                  <h2 id="spotlight-belajar" className="text-xl font-bold tracking-tight text-forest-900 sm:text-2xl">
                    <Link className="hover:text-bronze-700 hover:underline" href={`/academy/courses/${spotlight.course.slug}`}>
                      {spotlight.course.title}
                    </Link>
                  </h2>
                  {spotlight.enrollment.next_lesson_slug ? (
                    <p className="mt-1 text-sm text-slate-600">
                      Pelajaran berikutnya:{" "}
                      <span className="font-semibold text-slate-900">
                        {slugToTitle(spotlight.enrollment.next_lesson_slug)}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">
                      Semua pelajaran di kurikulum ini telah diselesaikan.
                    </p>
                  )}
                </div>

                <div className="max-w-xl">
                  <ProgressBar progress={spotlight.enrollment.progress} label="Progres kurikulum aktif" />
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2.5 lg:flex-col lg:items-end">
                {spotlight.enrollment.next_lesson_slug ? (
                  <Link
                    href={`/app/courses/${spotlight.course.slug}/lessons/${spotlight.enrollment.next_lesson_slug}`}
                    className={CMS_BTN_PRIMARY}
                  >
                    <Play aria-hidden className="h-4 w-4" />
                    {spotlight.enrollment.progress.completed > 0 ? "Lanjutkan Belajar" : "Mulai Pelajaran"}
                  </Link>
                ) : (
                  <Link href={`/academy/courses/${spotlight.course.slug}`} className={CMS_BTN_PRIMARY}>
                    <BookOpen aria-hidden className="h-4 w-4" />
                    Tinjau Kurikulum
                  </Link>
                )}
                <Link href="/app/progress" className={CMS_BTN_SECONDARY_SM}>
                  Semua progres <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </BentoCard>
        </section>
      ) : r.ok ? (
        <section aria-labelledby="mulai-cepat">
          <BentoCard className="border-[#fed7aa]/90 bg-white">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                  Panduan Mulai Cepat
                </p>
                <h2 id="mulai-cepat" className="mt-0.5 text-lg font-bold tracking-tight text-forest-900 sm:text-xl">
                  Mulai belajar pencak silat dalam 3 langkah
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Belum ada kurikulum diikuti. Pilih langkah pertama di bawah ini.
              </p>
            </div>

            <div className="grid gap-3.5 md:grid-cols-3">
              {QUICK_START_STEPS.map(({ step, href, title, description, cta, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex h-full flex-col rounded-[20px] border border-slate-200/80 bg-[#fffaf5] p-4 transition-all hover:border-[#fed7aa] hover:bg-[#fff6ee]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-2xl border border-[#fed7aa] bg-white text-[#6d1b11] transition-colors group-hover:bg-[#6d1b11] group-hover:text-white">
                      <Icon aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-[#9a3412]">
                      Langkah {step}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-forest-900 group-hover:text-[#6d1b11]">
                    {title}
                  </h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">{description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6d1b11]">
                    {cta}
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </BentoCard>
        </section>
      ) : null}

      {/* Bento KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BentoKpi
          label="Total Progres"
          value={`${totals.percent}%`}
          sub={`${totals.completed}/${totals.total} pelajaran`}
          icon={TrendingUp}
          accent
        />
        <BentoKpi
          label="Kurikulum Selesai"
          value={coursesCompleted}
          sub={r.ok ? `${enrollments.length} diikuti` : "-"}
          icon={CheckCircle2}
        />
        <BentoKpi
          label="Total Sesi Latihan"
          value={totalSessions}
          sub={ps.ok ? `${formatDuration(ps.data.total_active_seconds * 1000)} aktif` : "-"}
          icon={Activity}
        />
        <BentoKpi
          label="7 Hari Terakhir"
          value={`${weekSessions} sesi`}
          sub={formatDuration(weekActiveMs)}
          icon={Flame}
        />
      </div>

      {/* Main Bento Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="lanjut-belajar" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="lanjut-belajar" className="text-lg font-bold tracking-tight text-forest-900">
              Kurikulum diikuti
            </h2>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-bronze-700"
              href="/app/progress"
            >
              Semua progres <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!r.ok ? (
            <ErrorState message={r.error} retryHref="/app" />
          ) : enrollments.length === 0 ? (
            <BentoCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#fed7aa]/70 bg-[#fff6ee] text-[#6d1b11]">
                    <BookOpen aria-hidden className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-forest-900">Belum ada kurikulum aktif</p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Mulai dari jalur pemula di Akademi untuk mencatat progres pelajaran Anda.
                    </p>
                  </div>
                </div>
                <Link href="/academy" className={CMS_BTN_PRIMARY_SM}>
                  Telusuri Akademi <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </BentoCard>
          ) : (
            <ul className="space-y-3">
              {enrollments.map(({ course, enrollment }) => {
                const done = enrollment.status === "completed";
                return (
                  <li key={course.id}>
                    <BentoCard className="!p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                done
                                  ? "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]"
                                  : "border-amber-200 bg-amber-50 text-[#9a3412]"
                              }`}
                            >
                              {done && <CheckCircle2 aria-hidden className="h-3 w-3" />}
                              {done ? "Selesai" : "Aktif"}
                            </span>
                            <span className="text-xs font-semibold tabular-nums text-slate-500">
                              {enrollment.progress.percent}%
                            </span>
                          </div>
                          <h3 className="mt-1.5 font-bold text-forest-900">
                            <Link className="hover:text-bronze-700 hover:underline" href={`/academy/courses/${course.slug}`}>
                              {course.title}
                            </Link>
                          </h3>
                        </div>

                        {enrollment.next_lesson_slug ? (
                          <Link
                            className={done ? CMS_BTN_SECONDARY_SM : CMS_BTN_PRIMARY_SM}
                            href={`/app/courses/${course.slug}/lessons/${enrollment.next_lesson_slug}`}
                          >
                            {enrollment.progress.completed > 0 ? "Lanjutkan" : "Mulai"}
                            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <Link className={CMS_BTN_SECONDARY_SM} href={`/academy/courses/${course.slug}`}>
                            Lihat kurikulum
                          </Link>
                        )}
                      </div>
                      <div className="mt-3.5">
                        <ProgressBar progress={enrollment.progress} />
                      </div>
                    </BentoCard>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {ps.ok && (
          <section aria-labelledby="latihan-terakhir" className="space-y-4" data-testid="dash-practice">
            <div className="flex items-center justify-between gap-3">
              <h2 id="latihan-terakhir" className="text-lg font-bold tracking-tight text-forest-900">
                Latihan kamera
              </h2>
              <Link
                className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-bronze-700"
                href="/app/practice"
              >
                Semua riwayat <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>

            {ps.data.total_sessions === 0 ? (
              <BentoCard>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#fed7aa]/70 bg-[#fff6ee] text-[#6d1b11]">
                    <Clock aria-hidden className="h-5 w-5" />
                  </span>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Belum ada sesi latihan. Buka sebuah pelajaran lalu tekan <em>Mulai Latihan</em>.
                    </p>
                    <Link href="/app/practice/camera-check" className={CMS_BTN_SECONDARY_SM}>
                      <Camera aria-hidden className="h-3.5 w-3.5" />
                      Uji Kamera Dulu
                    </Link>
                  </div>
                </div>
              </BentoCard>
            ) : (
              <BentoCard>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">Aktivitas 14 hari terakhir</p>
                  <span className="rounded-full bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold text-bronze-700">
                    {ps.data.sessions_last_7_days} sesi / 7 hr
                  </span>
                </div>
                <LazyActivityChart days={ps.data.days} />
              </BentoCard>
            )}

            {ps.data.last_session && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Sesi terbaru</p>
                <ul>
                  <SessionRow s={ps.data.last_session} />
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
