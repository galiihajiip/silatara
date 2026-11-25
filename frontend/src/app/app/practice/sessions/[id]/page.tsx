import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, Clock, PauseCircle } from "lucide-react";
import { BentoCard, BentoKpi, CMS_BTN_PRIMARY, CMS_BTN_SECONDARY, CmsPageHeader } from "@/components/cms/Bento";
import { SafetyNotice } from "@/components/PracticeStudio";
import { ErrorState } from "@/components/ui";
import { formatDateTime, formatDuration, PRACTICE_STATUS_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { DetectionStateKey, PracticeSession } from "@/lib/types";

export const metadata = { title: "Ringkasan latihan", robots: { index: false } };
const STATE_NAME: Record<DetectionStateKey, string> = {
  detecting: "Tubuh terdeteksi",
  partial_detection: "Sebagian tubuh terdeteksi",
  insufficient_visibility: "Tubuh belum terlihat cukup",
  waiting_for_subject: "Menunggu tubuh terdeteksi",
};

export default async function SessionSummary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/app/practice/sessions/${id}`);
  const r = await sGet<PracticeSession>(`/practice-sessions/${encodeURIComponent(id)}`);
  if (!r.ok) return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/app/practice/sessions/${id}`} />;
  const s = r.data, q = s.quality_summary;
  const totalMs = q ? Object.values(q.ms_in_state).reduce((a, b) => a + b, 0) : 0;
  const lessonUrl = `/app/courses/${s.lesson.course_slug}/lessons/${s.lesson.slug}`;

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Ringkasan latihan"
        title={s.lesson.title}
        description={`${s.lesson.course_title} · ${PRACTICE_STATUS_LABEL[s.status] ?? s.status}`}
        actions={
          <>
            <Link href={lessonUrl} className={CMS_BTN_PRIMARY}>Kembali ke materi</Link>
            <Link href={`${lessonUrl}/practice`} className={CMS_BTN_SECONDARY}>Latihan lagi</Link>
          </>
        }
      />

      {(s.lesson.is_demo || q?.simulated) && (
        <div className="flex flex-wrap gap-2">
          {s.lesson.is_demo && <span className="rounded-full bg-parchment-100 px-3 py-1 text-xs font-medium text-bronze-700">{s.lesson.verification_label}</span>}
          {q?.simulated && <span className="rounded-full border border-clay-600/30 bg-clay-600/10 px-3 py-1 text-xs font-medium text-clay-600">Sesi SIMULASI: landmark sintetis</span>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <BentoKpi label="Durasi latihan aktif" value={formatDuration(s.active_duration_ms)} icon={Clock} accent valueTestId="dur-active" />
        <BentoKpi label="Waktu jeda" value={formatDuration(s.paused_duration_ms)} icon={PauseCircle} />
        <BentoKpi label="Status sesi" value={PRACTICE_STATUS_LABEL[s.status] ?? s.status} icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <BentoCard>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs font-medium text-slate-500">Mulai</dt><dd className="mt-0.5 font-medium text-slate-900">{formatDateTime(s.started_at)}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500">Selesai</dt><dd className="mt-0.5 font-medium text-slate-900">{formatDateTime(s.ended_at)}</dd></div>
              <div><dt className="text-xs font-medium text-slate-500">Versi model</dt><dd className="mt-0.5 break-words text-xs font-medium text-slate-700">{s.model_version}</dd></div>
            </dl>
          </BentoCard>

          {q ? (
            <BentoCard>
              <h2 className="text-base font-bold text-forest-900">Kualitas input (agregat)</h2>
              <p className="mb-4 mt-1 text-xs text-slate-500">Keterlihatan tubuh di kamera: bukan penilaian gerakan.</p>
              <ul className="space-y-3">
                {(Object.keys(STATE_NAME) as DetectionStateKey[]).map((k) => {
                  const ms = q.ms_in_state[k], pct = totalMs ? Math.round((ms / totalMs) * 100) : 0;
                  return (
                    <li key={k}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{STATE_NAME[k]}</span>
                        <span className="tabular-nums text-slate-500">{formatDuration(ms)} · {pct}%</span>
                      </div>
                      <div role="img" aria-label={`${STATE_NAME[k]}: ${pct}% dari waktu`} className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#6d1b11] to-[#ea580c]" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-slate-500">
                Frame diproses: {q.processed_frames} · dilewati: {q.dropped_frames} · tubuh terlihat penuh: {Math.round(q.valid_frame_ratio * 100)}%.
              </p>
            </BentoCard>
          ) : (
            <BentoCard><p className="text-sm text-slate-600">Ringkasan kualitas tidak tersedia untuk sesi ini.</p></BentoCard>
          )}
          <SafetyNotice />
        </div>

        <aside className="space-y-4">
          <BentoCard>
            <h2 className="text-sm font-bold text-forest-900">Tautan cepat</h2>
            <p className="mt-1 text-sm text-slate-600">{s.lesson.title}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href={lessonUrl} className="font-medium text-forest-800 hover:text-bronze-700 hover:underline">Kembali ke materi</Link>
              <Link href={`${lessonUrl}/practice`} className="font-medium text-forest-800 hover:text-bronze-700 hover:underline">Latihan lagi</Link>
              <Link href="/app/practice" className="font-medium text-slate-600 hover:text-forest-900 hover:underline">Semua riwayat latihan</Link>
            </div>
          </BentoCard>
        </aside>
      </div>
    </div>
  );
}
