import Link from "next/link";
import { notFound } from "next/navigation";
import { LazyCalibrationWorkspace } from "@/components/LazyClients";
import { ErrorState } from "@/components/ui";
import { requireUser, sGet } from "@/lib/server-api";
import type { InstructorAnnotation, StudioMedia, StudioMovement } from "@/lib/types";

export default async function CalibrationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ media?: string; fixture?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/app/studio/movements/${id}/calibration`, ["instructor", "curator", "admin"]);
  const [m, media, ann] = await Promise.all([
    sGet<StudioMovement>(`/studio/movements/${id}`), sGet<StudioMedia[]>(`/studio/movements/${id}/media`), sGet<InstructorAnnotation[]>(`/studio/movements/${id}/annotations`),
  ]);
  if (!m.ok && m.status === 404) notFound();
  if (!m.ok) return <ErrorState message={m.error} />;
  return (
    <>
      <p className="mb-4 text-sm"><Link href={`/app/studio/movements/${id}`} className="underline">← Kembali ke dokumentasi</Link></p>
      <LazyCalibrationWorkspace movementId={id} movementName={m.data.active_document?.name_id ?? m.data.name_id} isDemo={m.data.is_demo}
        media={media.ok ? media.data : []} phases={m.data.active_document?.phases ?? []} initialAnnotations={ann.ok ? ann.data : []}
        viewerId={user.id} viewerRole={user.role} initialSource={sp.fixture ? "fixture" : sp.media} />
    </>
  );
}
