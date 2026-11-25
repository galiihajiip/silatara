import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { BentoCard, BentoTable, CMS_BTN_PRIMARY, CMS_TD, CMS_TH, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState, Pagination, SearchForm, StatusBadge } from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDate, KIND_LABEL, STATUS_LABEL } from "@/lib/format";
import { MANAGE_FIELDS } from "@/lib/manage-config";
import { requireUser, sGet } from "@/lib/server-api";
import type { ManageItem, Page } from "@/lib/types";

type SP = { q?: string; status?: string; page?: string };

export default async function ManageList({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<SP> }) {
  const { kind } = await params;
  if (!MANAGE_FIELDS[kind]) notFound();
  await requireUser(`/app/manage/${kind}`, ["instructor", "curator", "admin"]);
  const sp = await searchParams;
  const r = await sGet<Page<ManageItem>>(`/manage/${kind}${qs({ ...sp, page_size: 15 })}`);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Kelola Konten"
        title={KIND_LABEL[kind]}
        actions={
          <Link href={`/app/manage/${kind}/new`} className={CMS_BTN_PRIMARY}>
            <Plus aria-hidden className="h-4 w-4" /> Buat baru
          </Link>
        }
      />

      <BentoCard className="!p-4">
        <SearchForm
          action={`/app/manage/${kind}`}
          values={sp}
          placeholder="Judul atau slug"
          filters={[{ name: "status", label: "Status", options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) }]}
        />
      </BentoCard>

      {!r.ok ? (
        <ErrorState message={r.error} retryHref={`/app/manage/${kind}`} />
      ) : r.data.items.length === 0 ? (
        <EmptyState title="Belum ada konten">Mulai dengan tombol “Buat baru”.</EmptyState>
      ) : (
        <>
          <BentoTable>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar {KIND_LABEL[kind]}</caption>
              <thead className="border-b border-slate-200/80 bg-slate-50/70">
                <tr>
                  <th scope="col" className={CMS_TH}>Judul</th>
                  <th scope="col" className={CMS_TH}>Status</th>
                  <th scope="col" className={CMS_TH}>Diubah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.data.items.map((i) => (
                  <tr key={i.id} className="hover:bg-parchment-100/40">
                    <td className={CMS_TD}>
                      <Link className="font-medium text-forest-900 hover:text-bronze-700 hover:underline" href={`/app/manage/${kind}/${i.id}`}>{i.title}</Link>
                      {i.is_demo && <span className="ml-2 rounded-full bg-parchment-100 px-2 py-0.5 text-[11px] font-medium text-bronze-700">DEMO</span>}
                    </td>
                    <td className={CMS_TD}><StatusBadge status={i.status} /></td>
                    <td className={`${CMS_TD} text-slate-500`}>{formatDate(i.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BentoTable>
          <Pagination page={r.data} basePath={`/app/manage/${kind}`} params={sp} />
        </>
      )}
    </div>
  );
}
