import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, FileText, Film, Link2, Plus } from "lucide-react";
import { BentoCard, BentoKpi, BentoTable, CMS_BTN_PRIMARY, CMS_BTN_SECONDARY, CMS_TD, CMS_TH, CmsPageHeader } from "@/components/cms/Bento";
import { EmptyState, ErrorState } from "@/components/ui";
import { PartnerStatusPill } from "@/components/studio/StatusPills";
import { actionLabel, formatDateTime, STATUS_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { DashboardAttention, StudioDashboard } from "@/lib/types";

export const metadata = { title: "Studio Instruktur | SILATARA" };

function attentionHref(a: DashboardAttention): string {
  if (a.partner_id) return `/app/studio/partners/${a.partner_id}`;
  return `/app/studio/movements/${a.movement_id}`;
}

export default async function StudioDashboardPage() {
  await requireUser("/app/studio", ["instructor", "curator", "admin"]);
  const r = await sGet<StudioDashboard>("/studio/dashboard");
  if (!r.ok) return <ErrorState message={r.error} retryHref="/app/studio" />;
  const d = r.data;
  const byStatus = Object.entries(d.counts.documents_by_status);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Studio Instruktur"
        title="Dokumentasi gerakan & kemitraan"
        actions={
          <>
            <Link href="/app/studio/movements/new" className={CMS_BTN_PRIMARY}>
              <Plus aria-hidden className="h-4 w-4" /> Dokumentasikan gerakan
            </Link>
            <Link href="/app/studio/partners/new" className={CMS_BTN_SECONDARY}>
              <Plus aria-hidden className="h-4 w-4" /> Profil mitra
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BentoKpi label="Total Gerakan" value={d.counts.movements} icon={FileText} accent />
        <BentoKpi label="Gerakan Tayang" value={d.counts.published_movements} icon={CheckCircle2} />
        <BentoKpi label="Tautan Pelajaran" value={d.counts.lessons_linked} icon={Link2} />
        <BentoKpi label="Media Menunggu Izin" value={d.counts.media_awaiting_consent} icon={Film} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <section aria-labelledby="perhatian" className="space-y-3">
            <h2 id="perhatian" className="text-lg font-bold tracking-tight text-forest-900">Perlu perhatian</h2>
            {d.attention.length === 0 ? (
              <EmptyState title="Tidak ada yang menunggu Anda" />
            ) : (
              <BentoCard className="!p-0 overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {d.attention.map((a, i) => (
                    <li key={`${a.kind}-${a.document_id ?? a.partner_id}-${i}`}>
                      <Link href={attentionHref(a)} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-parchment-100/50">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-forest-900">
                            {a.title}{a.version_no ? <span className="font-normal text-slate-500"> · v{a.version_no}</span> : null}
                          </span>
                          <span className="block text-xs text-slate-500">{a.label}{a.note ? `: ${a.note}` : ""}</span>
                        </span>
                        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </BentoCard>
            )}
          </section>

          <section aria-labelledby="mitra" className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id="mitra" className="text-lg font-bold tracking-tight text-forest-900">Mitra</h2>
              <Link href="/app/studio/partners" className="text-xs font-medium text-forest-800 hover:text-bronze-700 hover:underline">Semua mitra</Link>
            </div>
            {d.partners.length === 0 ? (
              <EmptyState title="Belum terhubung ke mitra">Buat profil mitra atau minta penanggung jawab menambahkan Anda.</EmptyState>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {d.partners.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/app/studio/partners/${p.id}`}
                      className="flex flex-wrap items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-colors hover:border-forest-700/30 hover:bg-parchment-100/40"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-parchment-100 text-forest-800">
                        <Building2 aria-hidden className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">{p.name}</span>
                        {p.my_role && <span className="block text-xs text-slate-500">{p.my_role === "manager" ? "Penanggung jawab" : "Anggota"}</span>}
                      </span>
                      <PartnerStatusPill status={p.verification_status} demo={p.is_demo} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="tradisi" className="space-y-3">
            <h2 id="tradisi" className="text-lg font-bold tracking-tight text-forest-900">Cakupan tradisi</h2>
            {d.tradition_coverage.length === 0 ? (
              <BentoCard><p className="text-sm text-slate-500">Belum ada dokumentasi gerakan.</p></BentoCard>
            ) : (
              <BentoTable>
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Gerakan per tradisi</caption>
                  <thead className="border-b border-slate-200/80 bg-slate-50/70">
                    <tr>
                      <th scope="col" className={CMS_TH}>Tradisi</th>
                      <th scope="col" className={CMS_TH}>Gerakan</th>
                      <th scope="col" className={CMS_TH}>Terbit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {d.tradition_coverage.map((c) => (
                      <tr key={c.tradition_id} className="hover:bg-parchment-100/40">
                        <th scope="row" className={`${CMS_TD} font-medium text-slate-900`}>{c.tradition_name}</th>
                        <td className={`${CMS_TD} tabular-nums`}>{c.total}</td>
                        <td className={`${CMS_TD} tabular-nums font-medium text-forest-900`}>{c.published}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </BentoTable>
            )}
          </section>
        </div>

        <aside className="space-y-5" aria-label="Ringkasan">
          <BentoCard>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-forest-900">Status dokumentasi</h2>
              <Link href="/app/studio/movements" className="text-xs font-medium text-bronze-700 hover:underline">Lihat semua</Link>
            </div>
            {byStatus.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {byStatus.map(([s, n]) => (
                  <div key={s} className="flex items-center justify-between">
                    <dt className="text-slate-600">{STATUS_LABEL[s as keyof typeof STATUS_LABEL] ?? s}</dt>
                    <dd className="rounded-full bg-[#F4F5F7] px-2.5 py-0.5 text-xs font-bold tabular-nums text-forest-900">{n}</dd>
                  </div>
                ))}
              </dl>
            )}
          </BentoCard>

          <BentoCard>
            <h2 className="mb-3 text-sm font-bold text-forest-900">Aktivitas terbaru</h2>
            {d.recent_activity.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {d.recent_activity.slice(0, 8).map((a, i) => (
                  <li key={i} className="border-l-2 border-parchment-100 pl-3">
                    <span className="block font-medium text-slate-800">{actionLabel(a.action)}</span>
                    <span className="block text-xs text-slate-500">{a.actor ?? "-"} · {formatDateTime(a.created_at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </BentoCard>
        </aside>
      </div>
    </div>
  );
}
