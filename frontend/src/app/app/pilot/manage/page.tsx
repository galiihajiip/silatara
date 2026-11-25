import Link from "next/link";
import { Plus } from "lucide-react";
import { BentoTable, CMS_BTN_PRIMARY, CMS_TD, CMS_TH, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState, Pagination } from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDate, PROGRAM_STATUS_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { Page, ProgramRow } from "@/lib/types";

export default async function ManageProgramsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  await requireUser("/app/pilot/manage", ["instructor", "curator", "admin"]);
  const sp = await searchParams;
  const r = await sGet<Page<ProgramRow>>(`/pilot/programs${qs({ ...sp, page_size: 15 })}`);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Pilot & Impact Studio"
        title="Program pilot"
        actions={
          <Link href="/app/pilot/manage/new" className={CMS_BTN_PRIMARY}>
            <Plus aria-hidden className="h-4 w-4" /> Program baru
          </Link>
        }
      />

      {!r.ok ? (
        <ErrorState message={r.error} retryHref="/app/pilot/manage" />
      ) : r.data.items.length === 0 ? (
        <EmptyState title="Belum ada program pilot">Buat program pilot dari mitra yang terdaftar di Studio Instruktur.</EmptyState>
      ) : (
        <>
          <BentoTable>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Daftar program pilot</caption>
              <thead className="border-b border-slate-200/80 bg-slate-50/70">
                <tr>
                  <th scope="col" className={CMS_TH}>Program</th>
                  <th scope="col" className={CMS_TH}>Penyelenggara</th>
                  <th scope="col" className={CMS_TH}>Status</th>
                  <th scope="col" className={CMS_TH}>Periode</th>
                  <th scope="col" className={CMS_TH}>Peserta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-parchment-100/40">
                    <td className={CMS_TD}>
                      <Link className="font-medium text-forest-900 hover:text-bronze-700 hover:underline" href={`/app/pilot/manage/${p.id}`}>{p.name}</Link>
                      {p.is_demo && <span className="ml-2 rounded-full bg-parchment-100 px-2 py-0.5 text-[11px] font-medium text-bronze-700">DEMO</span>}
                    </td>
                    <td className={`${CMS_TD} text-slate-500`}>{p.partner_name}{!p.partner_verified && !p.is_demo ? " (belum terverifikasi)" : ""}</td>
                    <td className={CMS_TD}>
                      <span className="inline-block rounded-full bg-parchment-100 px-2.5 py-1 text-xs font-medium text-forest-900">
                        {PROGRAM_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className={`${CMS_TD} text-slate-500`}>{formatDate(p.start_date)} – {formatDate(p.end_date)}</td>
                    <td className={`${CMS_TD} font-medium tabular-nums text-forest-900`}>{p.member_count}/{p.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BentoTable>
          <Pagination page={r.data} basePath="/app/pilot/manage" params={sp} />
        </>
      )}
    </div>
  );
}
