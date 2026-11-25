import { CmsPageHeader } from "@/components/cms/Bento";
import { ErrorState } from "@/components/ui";
import { NewProgramForm } from "@/components/pilot/NewProgramForm";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, PartnerRow } from "@/lib/types";

export default async function NewProgramPage() {
  await requireUser("/app/pilot/manage/new", ["instructor", "curator", "admin"]);
  const r = await sGet<Page<PartnerRow>>("/studio/partners?page_size=100");
  if (!r.ok) return <ErrorState message={r.error} />;
  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Pilot & Impact Studio"
        title="Program pilot baru"
        description="Disimpan sebagai draf hingga diajukan dan disetujui admin."
      />
      <NewProgramForm partners={r.data.items.map((p) => ({ id: p.id, name: p.name, verified: p.verification_status === "verified" || p.is_demo }))} />
    </div>
  );
}
