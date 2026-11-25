import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import { BentoCard, CMS_BTN_SECONDARY, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { Portal } from "@/lib/types";

export const metadata = { title: "Program Pilot" };

export default async function PilotPortalPage() {
  const user = await requireUser("/app/pilot");
  const r = await sGet<Portal>("/pilot/me/portal");
  if (!r.ok) return <ErrorState message={r.error} retryHref="/app/pilot" />;
  const { memberships, pending_surveys } = r.data;

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Program Pilot"
        title="Program dan cohort Anda"
        actions={
          user.role !== "learner" ? (
            <Link className={CMS_BTN_SECONDARY} href="/app/pilot/manage">
              Kelola pilot <ArrowUpRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : undefined
        }
      />

      {pending_surveys.length > 0 && (
        <section aria-labelledby="sv" className="rounded-[24px] border border-bronze-500/35 bg-parchment-100 p-5">
          <h2 id="sv" className="flex items-center gap-2 text-sm font-bold text-forest-900">
            <ClipboardList aria-hidden className="h-4 w-4 text-bronze-700" /> Survei menunggu Anda
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {pending_surveys.map((s) => (
              <li key={s.id}>
                <Link className="font-medium text-forest-800 underline hover:text-bronze-700" href={`/app/pilot/surveys/${s.id}`}>{s.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memberships.length === 0 ? (
        <EmptyState title="Anda belum tergabung di program pilot">
          Program pilot diikuti lewat tautan undangan sekali pakai dari instruktur atau perguruan.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {memberships.map((m) => (
            <li key={m.cohort_id}>
              <BentoCard className="h-full">
                <p className="text-xs font-bold uppercase tracking-wider text-bronze-700">
                  {m.is_demo ? "[DEMO] " : ""}{m.program_status_label}
                </p>
                <h2 className="mt-1 text-lg font-bold text-forest-900">
                  <Link className="hover:text-bronze-700 hover:underline" href={`/app/pilot/cohorts/${m.cohort_id}`}>{m.program_name}</Link>
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">Cohort {m.cohort_name} · bergabung {formatDate(m.joined_at)}</p>
                {m.progress && (
                  <div className="mt-4">
                    <div role="progressbar" aria-label="Progres belajar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.progress.percent} className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6d1b11] to-[#ea580c]" style={{ width: `${m.progress.percent}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">{m.progress.completed}/{m.progress.total} pelajaran · {m.progress.percent}%</p>
                  </div>
                )}
              </BentoCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
