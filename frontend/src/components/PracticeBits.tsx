import Link from "next/link";
import { ArrowUpRight, Clock, FlaskConical } from "lucide-react";
import type { PracticeSession } from "@/lib/types";
import { formatDateTime, formatDuration, PRACTICE_STATUS_LABEL } from "@/lib/format";

function statusTone(status: PracticeSession["status"]): string {
  switch (status) {
    case "completed":
      return "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-[#9a3412]";
    case "error":
      return "border-clay-600/30 bg-clay-600/10 text-clay-600";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export function SessionRow({ s }: { s: PracticeSession }) {
  const statusLabel = PRACTICE_STATUS_LABEL[s.status] ?? s.status;

  return (
    <li className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-colors hover:border-[#fed7aa]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="font-semibold text-forest-900 underline-offset-2 hover:text-bronze-700 hover:underline"
              href={`/app/practice/sessions/${s.id}`}
            >
              {s.lesson.title}
            </Link>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(s.status)}`}>
              {statusLabel}
            </span>
            {s.quality_summary?.simulated && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                Simulasi
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {s.lesson.course_title} · {formatDateTime(s.started_at)}
          </p>
          {s.lesson.is_demo && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#fed7aa]/80 bg-[#fff6ee] px-2.5 py-0.5 text-[11px] font-medium text-bronze-700">
              <FlaskConical aria-hidden className="h-3 w-3" />
              {s.lesson.verification_label}
            </p>
          )}
        </div>

        <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-bold text-forest-900 tabular-nums">
          <Clock aria-hidden className="h-3.5 w-3.5 text-bronze-500" />
          <span>{formatDuration(s.active_duration_ms)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs">
        <Link
          className="inline-flex items-center gap-1 font-medium text-forest-800 transition-colors hover:text-bronze-700"
          href={`/app/courses/${s.lesson.course_slug}/lessons/${s.lesson.slug}`}
        >
          Kembali ke materi <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
        <Link
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-slate-600 transition-colors hover:bg-[#fff6ee] hover:text-[#6d1b11]"
          href={`/app/practice/sessions/${s.id}`}
        >
          Detail sesi
        </Link>
      </div>
    </li>
  );
}
