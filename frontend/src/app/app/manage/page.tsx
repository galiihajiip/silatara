import Link from "next/link";
import { ArrowUpRight, FolderKanban } from "lucide-react";
import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { ErrorState } from "@/components/ui";
import { KIND_LABEL } from "@/lib/format";
import { requireUser, sGet } from "@/lib/server-api";
import type { ManageItem, Page } from "@/lib/types";

export const metadata = { title: "Kelola konten" };

export default async function ManageHome() {
  const user = await requireUser("/app/manage", ["instructor", "curator", "admin"]);
  const kinds = await sGet<{ key: string; label: string }[]>("/manage/kinds");
  if (!kinds.ok) return <ErrorState message={kinds.error} retryHref="/app/manage" />;
  const counts = await Promise.all(
    kinds.data.map(async (k) => {
      const r = await sGet<Page<ManageItem>>(`/manage/${k.key}?status=pending_review&page_size=1`);
      return [k.key, r.ok ? r.data.total : 0] as const;
    })
  );
  const pending = Object.fromEntries(counts);

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Kelola Konten"
        title="Pengelolaan konten budaya"
        description={
          user.role === "instructor"
            ? "Buat dan ajukan draf kurikulum serta pelajaran Anda."
            : "Tinjau, verifikasi, dan terbitkan konten ke katalog publik."
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kinds.data.map((k) => {
          const count = pending[k.key] ?? 0;
          return (
            <li key={k.key}>
              <Link
                href={`/app/manage/${k.key}`}
                className="group flex h-full flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] transition-all hover:border-forest-700/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-parchment-100 text-forest-800">
                    <FolderKanban aria-hidden className="h-5 w-5" />
                  </span>
                  <ArrowUpRight aria-hidden className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-bronze-700" />
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-bold text-forest-900">{KIND_LABEL[k.key] ?? k.label}</h2>
                  <p className="mt-1 text-xs">
                    {count > 0 ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-bronze-700">
                        {count} menunggu review
                      </span>
                    ) : (
                      <span className="text-slate-500">Tidak ada antrean review</span>
                    )}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <BentoCard className="!py-4 text-xs text-slate-600">
        Alur publikasi: <strong className="text-forest-900">Draf → Menunggu review → Terverifikasi → Terbit</strong>
      </BentoCard>
    </div>
  );
}
