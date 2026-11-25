import { CmsPageHeader } from "@/components/cms/Bento";
import { ErrorState } from "@/components/ui";
import { NewMovementForm } from "@/components/studio/NewMovementForm";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, PartnerRow, StudioPartnerDetail } from "@/lib/types";

export default async function NewMovementPage({ searchParams }: { searchParams: Promise<{ partner?: string }> }) {
  await requireUser("/app/studio/movements/new", ["instructor", "curator", "admin"]);
  const sp = await searchParams;
  const pr = await sGet<Page<PartnerRow>>("/studio/partners?page_size=100");
  if (!pr.ok) return <ErrorState message={pr.error} />;
  const partners = await Promise.all(
    pr.data.items.map(async (p) => {
      const d = await sGet<StudioPartnerDetail>(`/studio/partners/${p.id}`);
      return { id: p.id, name: p.name, status: p.verification_status, traditions: d.ok ? d.data.traditions : [] };
    })
  );
  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Studio Instruktur"
        title="Dokumentasikan gerakan"
        description="Tentukan nama, mitra, dan tradisi. Detail fase dan hak ditulis pada editor berikutnya."
      />
      <NewMovementForm partners={partners} initialPartner={sp.partner} />
    </div>
  );
}
