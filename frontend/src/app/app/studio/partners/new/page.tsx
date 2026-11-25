import { CmsPageHeader } from "@/components/cms/Bento";
import { NewPartnerForm } from "@/components/studio/NewPartnerForm";
import { requireUser } from "@/lib/server-api";

export default async function NewPartnerPage() {
  await requireUser("/app/studio/partners/new", ["instructor", "curator", "admin"]);
  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Studio Instruktur"
        title="Profil mitra baru"
        description="Disimpan sebagai draf hingga diverifikasi admin dengan dokumen persetujuan."
      />
      <NewPartnerForm />
    </div>
  );
}
