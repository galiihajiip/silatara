import Link from "next/link";
import { notFound } from "next/navigation";
import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { ManageForm } from "@/components/ManageForm";
import { KIND_LABEL } from "@/lib/format";
import { MANAGE_FIELDS } from "@/lib/manage-config";
import { requireUser } from "@/lib/server-api";

export default async function NewContent({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!MANAGE_FIELDS[kind]) notFound();
  const user = await requireUser(`/app/manage/${kind}/new`, ["instructor", "curator", "admin"]);
  return (
    <div className="space-y-5">
      <nav aria-label="Jejak halaman" className="text-xs font-medium text-slate-500">
        <Link className="text-forest-800 hover:underline" href={`/app/manage/${kind}`}>{KIND_LABEL[kind]}</Link> / Baru
      </nav>
      <CmsPageHeader title={`Buat ${KIND_LABEL[kind]}`} description="Disimpan sebagai draf hingga disetujui dan diterbitkan." />
      <BentoCard className="max-w-3xl">
        <ManageForm kind={kind} role={user.role} />
      </BentoCard>
    </div>
  );
}
