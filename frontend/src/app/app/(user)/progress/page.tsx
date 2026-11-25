import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, TrendingUp } from "lucide-react";
import {
  BentoCard,
  BentoKpi,
  CMS_BTN_PRIMARY,
  CMS_BTN_PRIMARY_SM,
  CMS_BTN_SECONDARY_SM,
  CmsPageHeader,
} from "@/components/cms/Bento";
import { EmptyState, ErrorState, ProgressBar } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import { SessionRow } from "@/components/PracticeBits";
import type { MyProgress, Page, PracticeSession } from "@/lib/types";

export const metadata = { title: "Progres belajar" };

export default async function ProgressPage() {
  await requireUser("/app/progress");
  const [r, ps] = await Promise.all([
    sGet<MyProgress>("/me/progress"),
    sGet<Page<PracticeSession>>("/me/practice-sessions?page_size=3"),
  ]);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Progres"
        title="Progres belajar"
        description="Dihitung dari pelajaran terbit di tiap kurikulum (bukan penilaian kemahiran)."
        actions={
          <Link href="/academy" className={CMS_BTN_PRIMARY}>
            <BookOpen aria-hidden className="h-4 w-4" />
            Jelajahi Akademi
          </Link>
        }
      />

      {!r.ok ? (
        <ErrorState message={r.error} retryHref="/app/progress" />
      ) : r.data.enrollments.length === 0 ? (
        <EmptyState title="Belum ada progres">
          <p className="mb-4 text-sm text-slate-600">
            Ikuti sebuah kurikulum di Akademi untuk mulai mencatat pelajaran yang selesai.
          </p>
          <Link className={CMS_BTN_PRIMARY} href="/academy">
            Telusuri Akademi <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <BentoKpi
              label="Keseluruhan"
              value={`${r.data.totals.percent}%`}
              sub={`${r.data.totals.completed}/${r.data.totals.total} pelajaran`}
              icon={TrendingUp}
              accent
            />
            <BentoKpi label="Kurikulum Diikuti" value={r.data.enrollments.length} icon={BookOpen} />
            <BentoKpi label="Kurikulum Selesai" value={r.data.courses_completed} icon={CheckCircle2} />
          </div>

          <BentoCard>
            <ProgressBar progress={r.data.totals} label="Total progres semua kurikulum" />
          </BentoCard>

          <ul className="grid gap-4 md:grid-cols-2">
            {r.data.enrollments.map(({ course, enrollment: e }) => {
              const completed = e.status === "completed";
              return (
                <li key={course.id}>
                  <BentoCard className="flex h-full flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            completed
                              ? "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]"
                              : "border-amber-200 bg-amber-50 text-[#9a3412]"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                          ) : (
                            <BookOpen aria-hidden className="h-3.5 w-3.5" />
                          )}
                          {completed ? "Selesai" : "Aktif"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-forest-900">
                          {e.progress.percent}%
                        </span>
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-forest-900">
                          <Link
                            className="hover:text-bronze-700 hover:underline"
                            href={`/academy/courses/${course.slug}`}
                          >
                            {course.title}
                          </Link>
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Mulai {formatDate(e.enrolled_at)}
                          {e.completed_at ? ` · selesai ${formatDate(e.completed_at)}` : ""}
                        </p>
                      </div>

                      <ProgressBar progress={e.progress} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                      <Link
                        className="text-xs font-semibold text-slate-600 transition-colors hover:text-forest-900 hover:underline"
                        href={`/academy/courses/${course.slug}`}
                      >
                        Detail kurikulum
                      </Link>
                      {e.next_lesson_slug ? (
                        <Link
                          className={completed ? CMS_BTN_SECONDARY_SM : CMS_BTN_PRIMARY_SM}
                          href={`/app/courses/${course.slug}/lessons/${e.next_lesson_slug}`}
                        >
                          {e.progress.completed > 0 ? "Lanjutkan" : "Mulai"}
                          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link className={CMS_BTN_SECONDARY_SM} href={`/academy/courses/${course.slug}`}>
                          Tinjau materi
                        </Link>
                      )}
                    </div>
                  </BentoCard>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {ps.ok && ps.data.items.length > 0 && (
        <section aria-labelledby="riwayat-latihan" className="space-y-3" data-testid="progress-practice">
          <div className="flex items-center justify-between gap-3">
            <h2 id="riwayat-latihan" className="text-lg font-bold tracking-tight text-forest-900">
              Latihan kamera terakhir
            </h2>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-bronze-700"
              href="/app/practice"
            >
              Semua riwayat <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ul className="space-y-3">
            {ps.data.items.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
