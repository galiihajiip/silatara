import Link from "next/link";
import { Plus } from "lucide-react";
import { BentoCard, BentoTable, CMS_BTN_PRIMARY, CMS_TD, CMS_TH, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState, Pagination, SearchForm } from "@/components/ui";
import { PartnerStatusPill } from "@/components/studio/StatusPills";
import { qs } from "@/lib/api";
import { formatDate, PARTNER_STATUS_LABEL, PARTNER_TYPE_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, PartnerRow } from "@/lib/types";

type SP = { q?: string; status?: string; page?: string };

export default async function PartnersListPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("/app/studio/partners", ["instructor", "curator", "admin"]);
  const sp = await searchParams;
  const r = await sGet<Page<PartnerRow>>(`/studio/partners${qs({ ...sp, page_size: 15 })}`);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Studio Instruktur"
        title="Mitra"
        actions={
          <Link href="/app/studio/partners/new" className={CMS_BTN_PRIMARY}>
            <Plus aria-hidden className="h-4 w-4" /> Profil mitra baru
          </Link>
        }
      />

      <BentoCard className="!p-4">
        <SearchForm
          action="/app/studio/partners"
          values={sp}
          placeholder="Nama atau kota"
          filters={[{ name: "status", label: "Status kemitraan", options: Object.entries(PARTNER_STATUS_LABEL).map(([value, label]) => ({ value, label })) }]}
        />
      </BentoCard>

      {!r.ok ? (
        <ErrorState message={r.error} retryHref="/app/studio/partners" />
      ) : r.data.items.length === 0 ? (
        <EmptyState title="Belum ada mitra">Buat profil mitra sebagai draf terlebih dahulu.</EmptyState>
      ) : (
        <>
          <BentoTable>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar mitra</caption>
              <thead className="border-b border-slate-200/80 bg-slate-50/70">
                <tr>
                  <th scope="col" className={CMS_TH}>Nama</th>
                  <th scope="col" className={CMS_TH}>Jenis</th>
                  <th scope="col" className={CMS_TH}>Peran saya</th>
                  <th scope="col" className={CMS_TH}>Status</th>
                  <th scope="col" className={CMS_TH}>Diubah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-parchment-100/40">
                    <td className={CMS_TD}>
                      <Link className="font-medium text-forest-900 hover:text-bronze-700 hover:underline" href={`/app/studio/partners/${p.id}`}>{p.name}</Link>
                    </td>
                    <td className={CMS_TD}>{PARTNER_TYPE_LABEL[p.partner_type]}</td>
                    <td className={CMS_TD}>{p.my_role === "manager" ? "Penanggung jawab" : p.my_role === "instructor" ? "Anggota" : "-"}</td>
                    <td className={CMS_TD}><PartnerStatusPill status={p.verification_status} demo={p.is_demo} /></td>
                    <td className={`${CMS_TD} text-slate-500`}>{formatDate(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BentoTable>
          <Pagination page={r.data} basePath="/app/studio/partners" params={sp} />
        </>
      )}
    </div>
  );
}
