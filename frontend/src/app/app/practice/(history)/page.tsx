import Link from "next/link";
import { Activity, ArrowRight, Camera, Clock, Filter, Flame } from "lucide-react";
import { LazyActivityChart } from "@/components/LazyClients";
import {
  BentoCard,
  BentoKpi,
  CMS_BTN_PRIMARY,
  CMS_BTN_SECONDARY,
  CMS_BTN_SECONDARY_SM,
  CmsPageHeader,
} from "@/components/cms/Bento";
import { SessionRow } from "@/components/PracticeBits";
import { EmptyState, ErrorState, Pagination } from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, PracticeSession, PracticeSummary } from "@/lib/types";

export const metadata = { title: "Riwayat latihan", robots: { index: false } };
type SP = { page?: string; lesson?: string };

export default async function PracticeHistory({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("/app/practice");
  const sp = await searchParams;
  const [sum, list] = await Promise.all([
    sGet<PracticeSummary>("/me/practice-summary?tz_offset=420"),
    sGet<Page<PracticeSession>>(`/me/practice-sessions${qs({ page: sp.page, lesson: sp.lesson, page_size: 8 })}`),
  ]);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Latihan"
        title="Riwayat latihan"
        description="Durasi dan kualitas input kamera selama sesi (bukan penilaian gerakan)."
        actions={
          <Link href="/app/practice/camera-check" className={CMS_BTN_SECONDARY}>
            <Camera aria-hidden className="h-4 w-4" />
            Uji Kamera
          </Link>
        }
      />

      {!sum.ok ? (
        <ErrorState message={sum.error} retryHref="/app/practice" />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <BentoKpi label="Total sesi" value={sum.data.total_sessions} icon={Activity} accent valueTestId="sum-total" />
            <BentoKpi label="Total waktu aktif" value={formatDuration(sum.data.total_active_seconds * 1000)} icon={Clock} />
            <BentoKpi
              label="7 hari terakhir"
              value={`${sum.data.sessions_last_7_days} sesi`}
              sub={formatDuration(sum.data.active_seconds_last_7_days * 1000)}
              icon={Flame}
            />
          </div>
          <BentoCard>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-forest-900">Aktivitas 14 hari terakhir</h2>
              <span className="rounded-full bg-[#fff6ee] px-2.5 py-0.5 text-xs font-semibold text-bronze-700">
                {sum.data.sessions_last_7_days} sesi / 7 hr
              </span>
            </div>
            <LazyActivityChart days={sum.data.days} />
          </BentoCard>
        </div>
      )}

      {sp.lesson && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#fed7aa] bg-[#fff6ee] px-4 py-3 text-sm text-[#2e0909]">
          <span className="inline-flex items-center gap-2 font-medium">
            <Filter aria-hidden className="h-4 w-4 text-[#9a3412]" />
            Menampilkan sesi untuk satu pelajaran.
          </span>
          <Link className={CMS_BTN_SECONDARY_SM} href="/app/practice">
            Tampilkan semua
          </Link>
        </div>
      )}

      {!list.ok ? (
        <ErrorState message={list.error} retryHref="/app/practice" />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="Belum ada sesi latihan">
          <p className="mb-4 text-sm text-slate-600">
            Buka sebuah pelajaran di Akademi lalu tekan <em>Mulai Latihan</em> untuk mencoba kamera latihan.
          </p>
          <Link className={CMS_BTN_PRIMARY} href="/academy">
            Buka Akademi <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </EmptyState>
      ) : (
        <>
          <ul className="space-y-3" data-testid="session-list">
            {list.data.items.map((s) => (
              <SessionRow key={s.id} s={s} />
            ))}
          </ul>
          <Pagination page={list.data} basePath="/app/practice" params={sp} />
        </>
      )}
    </div>
  );
}
