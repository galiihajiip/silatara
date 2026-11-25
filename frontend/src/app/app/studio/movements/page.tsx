import Link from "next/link";
import { Plus } from "lucide-react";
import { BentoCard, BentoTable, CMS_BTN_PRIMARY, CMS_TD, CMS_TH, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState, Pagination, SearchForm, StatusBadge } from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDate, LEVEL_LABEL, SAFETY_LABEL, STATUS_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, StudioMovementRow } from "@/lib/types";

type SP = { q?: string; status?: string; safety_category?: string; level?: string; page?: string };

export default async function StudioMovementsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("/app/studio/movements", ["instructor", "curator", "admin"]);
  const sp = await searchParams;
  const r = await sGet<Page<StudioMovementRow>>(`/studio/movements${qs({ ...sp, page_size: 15 })}`);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Studio Instruktur"
        title="Dokumentasi gerakan"
        actions={
          <Link href="/app/studio/movements/new" className={CMS_BTN_PRIMARY}>
            <Plus aria-hidden className="h-4 w-4" /> Dokumentasikan gerakan
          </Link>
        }
      />

      <BentoCard className="!p-4">
        <SearchForm
          action="/app/studio/movements"
          values={sp}
          placeholder="Nama gerakan"
          filters={[
            { name: "status", label: "Status versi", options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })) },
            { name: "safety_category", label: "Kategori keselamatan", options: Object.entries(SAFETY_LABEL).map(([value, label]) => ({ value, label })) },
            { name: "level", label: "Tingkat", options: Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </BentoCard>

      {!r.ok ? (
        <ErrorState message={r.error} retryHref="/app/studio/movements" />
      ) : r.data.items.length === 0 ? (
        <EmptyState title="Belum ada dokumentasi gerakan">Mulai dokumentasi gerakan baru dari mitra Anda.</EmptyState>
      ) : (
        <>
          <BentoTable>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar dokumentasi gerakan</caption>
              <thead className="border-b border-slate-200/80 bg-slate-50/70">
                <tr>
                  <th scope="col" className={CMS_TH}>Gerakan</th>
                  <th scope="col" className={CMS_TH}>Tradisi · Mitra</th>
                  <th scope="col" className={CMS_TH}>Kategori</th>
                  <th scope="col" className={CMS_TH}>Versi kerja</th>
                  <th scope="col" className={CMS_TH}>Tayang</th>
                  <th scope="col" className={CMS_TH}>Diubah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.data.items.map((m) => (
                  <tr key={m.id} className="hover:bg-parchment-100/40">
                    <td className={CMS_TD}>
                      <Link className="font-medium text-forest-900 hover:text-bronze-700 hover:underline" href={`/app/studio/movements/${m.id}`}>{m.name_id}</Link>
                      {m.is_demo && <span className="ml-2 rounded-full bg-parchment-100 px-2 py-0.5 text-[11px] font-medium text-bronze-700">DEMO</span>}
                    </td>
                    <td className={`${CMS_TD} text-slate-500`}>{m.tradition_name} · {m.partner_name}</td>
                    <td className={CMS_TD}>{m.safety_category ? SAFETY_LABEL[m.safety_category] : "-"}{m.level ? ` · ${LEVEL_LABEL[m.level]}` : ""}</td>
                    <td className={CMS_TD}>{m.working_status ? <><StatusBadge status={m.working_status} /> <span className="ml-1 text-xs text-slate-500">v{m.working_version}</span></> : "-"}</td>
                    <td className={`${CMS_TD} font-medium text-forest-900`}>{m.published_version_no ? `v${m.published_version_no}` : "-"}</td>
                    <td className={`${CMS_TD} text-slate-500`}>{formatDate(m.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BentoTable>
          <Pagination page={r.data} basePath="/app/studio/movements" params={sp} />
        </>
      )}
    </div>
  );
}
