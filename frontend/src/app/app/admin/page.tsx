import { ShieldCheck, Users } from "lucide-react";
import { AdminUsers } from "@/components/AdminUsers";
import { BentoCard, BentoKpi, CmsPageHeader } from "@/components/cms/Bento";
import { ErrorState, Pagination, SearchForm } from "@/components/ui";
import { qs } from "@/lib/api";
import { formatDate, ROLE_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { AdminUser, Page } from "@/lib/types";

export const metadata = { title: "Admin" };
type SP = { q?: string; role?: string; page?: string };
type Audit = { id: string; action: string; entity_type: string; entity_id: string | null; created_at: string };

export default async function AdminPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireUser("/app/admin", ["admin"]);
  const sp = await searchParams;
  const [users, audit] = await Promise.all([
    sGet<Page<AdminUser>>(`/admin/users${qs({ ...sp, page_size: 10 })}`),
    sGet<Page<Audit>>("/admin/audit-logs?page_size=10"),
  ]);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Admin"
        title="Pengguna dan audit"
        description="Perubahan peran atau status langsung mencabut sesi pengguna dan dicatat di jejak audit."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <BentoKpi label="Total Pengguna" value={users.ok ? users.data.total : "-"} icon={Users} accent />
        <BentoKpi label="Catatan Audit" value={audit.ok ? audit.data.total : "-"} icon={ShieldCheck} />
      </div>

      <BentoCard className="!p-4">
        <SearchForm
          action="/app/admin"
          values={sp}
          placeholder="Nama atau email"
          filters={[
            {
              name: "role",
              label: "Peran",
              options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })),
            },
          ]}
        />
      </BentoCard>

      {!users.ok ? (
        <ErrorState message={users.error} />
      ) : (
        <>
          <AdminUsers users={users.data.items} selfId={me.id} />
          <Pagination page={users.data} basePath="/app/admin" params={sp} />
        </>
      )}

      <section aria-labelledby="jejak-audit" className="space-y-3">
        <h2 id="jejak-audit" className="text-lg font-bold tracking-tight text-forest-900">Jejak audit terbaru</h2>
        {!audit.ok ? (
          <ErrorState message={audit.error} />
        ) : (
          <BentoCard>
            <ul className="divide-y divide-slate-100 text-sm">
              {audit.data.items.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <span>
                    <span className="font-medium text-forest-900">{a.action}</span>
                    <span className="ml-2 rounded-full bg-[#F4F5F7] px-2.5 py-0.5 text-xs text-slate-600">{a.entity_type}</span>
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        )}
      </section>
    </div>
  );
}
