"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleCheck } from "lucide-react";
import { CMS_BTN_PRIMARY, CMS_BTN_SECONDARY } from "@/components/cms/Bento";
import { clientRequest } from "@/lib/client-api";
import { Notice } from "@/components/Notice";
import type { ProgressUpdate } from "@/lib/types";

export function LessonActions({ lessonId, courseSlug, enrolled, completed: initial }: {
  lessonId: string; courseSlug: string; enrolled: boolean; completed: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const visited = useRef(false);

  // Catat kunjungan (untuk "lanjutkan belajar") sekali per pembukaan halaman.
  useEffect(() => {
    if (!enrolled || visited.current) return;
    visited.current = true;
    void clientRequest("PUT", `/me/lessons/${lessonId}/progress`, { status: "in_progress" });
  }, [enrolled, lessonId]);

  if (!enrolled) {
    return (
      <div className="rounded-[20px] border border-[#fed7aa] bg-[#fff6ee] p-4">
        <p className="mb-3 text-sm font-medium text-[#2e0909]">Daftar ke kurikulum ini untuk mencatat progres belajar Anda.</p>
        <EnrollInline slug={courseSlug} />
      </div>
    );
  }
  async function toggle() {
    setBusy(true);
    const r = await clientRequest<ProgressUpdate>("PUT", `/me/lessons/${lessonId}/progress`, { status: completed ? "incomplete" : "completed" });
    setBusy(false);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    setCompleted(!completed);
    setMsg({ kind: "success", text: completed ? "Penanda selesai dibatalkan." : `Pelajaran ditandai selesai. Progres kurikulum: ${r.data.enrollment.progress.percent}%.` });
    router.refresh();
  }
  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={completed}
        className={
          completed
            ? `${CMS_BTN_SECONDARY} w-full border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11] hover:bg-[#fed7aa]/50`
            : `${CMS_BTN_PRIMARY} w-full`
        }
      >
        {completed ? <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" /> : <CircleCheck aria-hidden className="h-4 w-4 shrink-0" />}
        <span>{busy ? "Menyimpan..." : completed ? "Selesai (klik untuk batalkan)" : "Tandai selesai"}</span>
      </button>
      <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>
    </div>
  );
}

function EnrollInline({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        className={`${CMS_BTN_PRIMARY} w-full`}
        onClick={async () => {
          setBusy(true);
          const r = await clientRequest("POST", `/courses/${slug}/enroll`);
          setBusy(false);
          if (!r.ok) setErr(r.error); else router.refresh();
        }}
      >
        {busy ? "Mendaftar..." : "Ikuti kurikulum"}
      </button>
      <Notice kind={err ? "error" : null}>{err}</Notice>
    </div>
  );
}
