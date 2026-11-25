import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsPageHeader } from "@/components/cms/Bento";
import { SurveyForm } from "@/components/pilot/SurveyForm";
import { ErrorState } from "@/components/ui";
import { requireUser, sGet } from "@/lib/server-api";
import type { SurveyOut } from "@/lib/types";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/app/pilot/surveys/${id}`);
  const r = await sGet<SurveyOut[]>("/pilot/me/surveys");
  if (!r.ok) return <ErrorState message={r.error} retryHref={`/app/pilot/surveys/${id}`} />;
  const s = r.data.find((x) => x.id === id);
  if (!s) notFound();
  return (
    <div className="space-y-5">
      <p className="text-xs font-medium text-slate-500"><Link className="text-forest-800 hover:underline" href="/app/pilot">← Program Pilot</Link></p>
      <CmsPageHeader eyebrow="Survei" title={s.title} description="Hanya dapat diisi sekali." />
      <SurveyForm survey={s} />
    </div>
  );
}
