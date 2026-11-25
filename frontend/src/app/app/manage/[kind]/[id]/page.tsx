import Link from "next/link";
import { notFound } from "next/navigation";
import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { ModulesEditor, MaterialsEditor } from "@/components/ChildEditors";
import { ManageForm } from "@/components/ManageForm";
import { TransitionPanel } from "@/components/TransitionPanel";
import { ErrorState, StatusBadge } from "@/components/ui";
import { ACTION_LABEL, formatDate, KIND_LABEL } from "@/lib/format";
import { MANAGE_FIELDS } from "@/lib/manage-config";
import { requireUser, sGet } from "@/lib/server-api";
import type { ManageDetail } from "@/lib/types";

export default async function EditContent({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!MANAGE_FIELDS[kind]) notFound();
  const user = await requireUser(`/app/manage/${kind}/${id}`, ["instructor", "curator", "admin"]);
  const r = await sGet<ManageDetail>(`/manage/${kind}/${id}`);
  if (!r.ok) return r.status === 404 ? notFound() : <ErrorState message={r.error} retryHref={`/app/manage/${kind}/${id}`} />;
  const d = r.data;
  const title = String(d.fields.title ?? d.fields.name ?? d.fields.name_id);

  return (
    <div className="space-y-6">
      <nav aria-label="Jejak halaman" className="text-xs font-medium text-slate-500">
        <Link className="text-forest-800 hover:underline" href={`/app/manage/${kind}`}>{KIND_LABEL[kind]}</Link> / {title}
      </nav>

      <CmsPageHeader
        eyebrow={KIND_LABEL[kind]}
        title={title}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={d.fields.status} />
            {d.fields.is_demo ? <span className="rounded-full bg-parchment-100 px-2.5 py-1 text-xs font-medium text-bronze-700">DEMO</span> : null}
          </div>
        }
      />

      {d.fields.review_note ? (
        <BentoCard className="!py-3.5 border-bronze-500/30 bg-parchment-100/60 text-sm text-slate-700">
          <strong className="text-forest-900">Catatan review:</strong> {String(d.fields.review_note)}
        </BentoCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <BentoCard><ManageForm key={String(d.fields.id) + d.fields.status} kind={kind} role={user.role} detail={d} /></BentoCard>
          {kind === "courses" && <BentoCard><ModulesEditor courseId={id} modules={d.modules ?? []} canEdit={d.can_edit} /></BentoCard>}
          {kind === "lessons" && <BentoCard><MaterialsEditor lessonId={id} materials={d.materials ?? []} canEdit={d.can_edit} /></BentoCard>}
        </div>
        <aside className="space-y-5">
          <BentoCard>
            <h2 className="mb-3 text-sm font-bold text-forest-900">Alur kerja</h2>
            <TransitionPanel kind={kind} id={id} actions={d.allowed_actions} isDemo={!!d.fields.is_demo} />
          </BentoCard>
          <BentoCard>
            <h2 className="mb-3 text-sm font-bold text-forest-900">Riwayat audit</h2>
            {d.history.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada riwayat.</p>
            ) : (
              <ol className="space-y-2.5 text-sm">
                {d.history.map((h, i) => (
                  <li key={i} className="border-l-2 border-parchment-100 pl-3">
                    <span className="font-medium text-slate-900">{ACTION_LABEL[h.action.replace("content.", "")] ?? h.action}</span>
                    <span className="text-slate-500"> · {h.actor ?? "sistem"}</span>
                    <br />
                    <span className="text-xs text-slate-500">{formatDate(h.created_at)}</span>
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
