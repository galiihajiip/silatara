import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { CohortConsent } from "@/components/pilot/CohortConsent";
import { ErrorState } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { MyCohort } from "@/lib/types";

export default async function MyCohortPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/app/pilot/cohorts/${id}`);
  const r = await sGet<MyCohort>(`/pilot/me/cohorts/${id}`);
  if (!r.ok && r.status === 404) notFound();
  if (!r.ok) return <ErrorState message={r.error} retryHref={`/app/pilot/cohorts/${id}`} />;
  const c = r.data;

  return (
    <div className="space-y-6">
      <p className="text-xs font-medium text-slate-500"><Link className="text-forest-800 hover:underline" href="/app/pilot">← Program Pilot</Link></p>
      <CmsPageHeader
        eyebrow={`${c.is_demo ? "[DEMO] " : ""}${c.program_status_label} · ${c.partner_name}`}
        title={c.program_name}
        description={`Cohort ${c.name} · instruktur ${c.instructor ?? "-"} · ${formatDate(c.start_date)} – ${formatDate(c.end_date)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {c.surveys.filter((s) => !s.answered).length > 0 && (
            <BentoCard className="border-bronze-500/35 bg-parchment-100">
              <h2 className="text-sm font-bold text-forest-900">Survei menunggu Anda</h2>
              <ul className="mt-1.5 space-y-1 text-sm">
                {c.surveys.filter((s) => !s.answered).map((s) => (
                  <li key={s.id}><Link className="font-medium text-forest-800 underline" href={`/app/pilot/surveys/${s.id}`}>{s.title}</Link></li>
                ))}
              </ul>
            </BentoCard>
          )}

          <section aria-labelledby="belajar" className="space-y-3">
            <h2 id="belajar" className="text-lg font-bold tracking-tight text-forest-900">Materi dan progres</h2>
            {c.progress && (
              <p className="text-xs text-slate-500">
                {c.progress.completed}/{c.progress.total} pelajaran ({c.progress.percent}%) · {c.practice.completed_sessions} sesi latihan ({c.practice.active_minutes} menit aktif)
              </p>
            )}
            <BentoCard className="!p-0 overflow-hidden">
              <ul className="divide-y divide-slate-100">
                {c.lessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/app/courses/${c.course_slug}/lessons/${l.slug}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-parchment-100/50">
                      {l.completed ? <CheckCircle2 aria-label="Selesai" className="h-5 w-5 text-bronze-500" /> : <Circle aria-label="Belum selesai" className="h-5 w-5 text-slate-300" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900">{l.title}</span>
                        <span className="block text-xs text-slate-500">{l.module}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </BentoCard>
          </section>

          <section aria-labelledby="jadwal" className="space-y-3">
            <h2 id="jadwal" className="text-lg font-bold tracking-tight text-forest-900">Jadwal</h2>
            {c.sessions.length === 0 ? (
              <BentoCard><p className="text-sm text-slate-500">Belum ada jadwal pertemuan.</p></BentoCard>
            ) : (
              <ul className="space-y-2.5">
                {c.sessions.map((s) => (
                  <li key={s.id}>
                    <BentoCard className="!p-4">
                      <p className="font-medium text-slate-900">{s.title}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.starts_at)}{s.location_note ? ` · ${s.location_note}` : ""}</p>
                    </BentoCard>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="umum" className="space-y-3">
            <h2 id="umum" className="text-lg font-bold tracking-tight text-forest-900">Pengumuman</h2>
            {c.announcements.length === 0 ? (
              <BentoCard><p className="text-sm text-slate-500">Belum ada pengumuman.</p></BentoCard>
            ) : (
              <ul className="space-y-3">
                {c.announcements.map((a) => (
                  <li key={a.id}>
                    <BentoCard className="!p-5">
                      <h3 className="font-bold text-forest-900">{a.title}</h3>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{a.body}</p>
                      <p className="mt-2 text-xs text-slate-500">{a.author ?? "-"} · {formatDateTime(a.created_at)}</p>
                    </BentoCard>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        <aside className="lg:sticky lg:top-[5.25rem] lg:self-start">
          <CohortConsent programId={c.program_id} cohortId={c.id} initial={c.consents} policy={c.policy_version} />
        </aside>
      </div>
    </div>
  );
}
