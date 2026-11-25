import Link from "next/link";
import { ArrowRight, ArrowUpRight, Award, BarChart3, Box, ChevronDown, Target } from "lucide-react";
import {
  BentoCard,
  BentoKpi,
  CMS_BTN_PRIMARY,
  CMS_BTN_SECONDARY,
  CMS_BTN_SECONDARY_SM,
  CmsPageHeader,
} from "@/components/cms/Bento";
import { EmptyState, ErrorState } from "@/components/ui";
import { requireUser, sGet } from "@/lib/server-api";

export const metadata = { title: "Riwayat latihan kamera", robots: { index: false } };

type Attempt = {
  id: string;
  created_at: string;
  movement_id: string;
  status: string;
  total_score: number | null;
  input_quality: number | null;
  protocol_version: string;
  feedback: string[] | null;
  criteria: { label: string; score: number | null }[] | null;
};
type Resp = {
  items: Attempt[];
  by_movement: { movement_id: string; attempts: number; best_score: number | null; average_score: number | null }[];
};

const name = (id: string) => id.replace(/^mv\.[a-z]+\./, "").replaceAll("-", " ");

export default async function HistoryPage() {
  await requireUser("/app/latihan/riwayat");
  const r = await sGet<Resp>("/assessments?limit=100");
  if (!r.ok) return <ErrorState message={r.error} retryHref="/app/latihan/riwayat" />;
  const { items, by_movement } = r.data;

  const scored = items.filter((a) => a.total_score !== null);
  const bestOverall = scored.length ? Math.max(...scored.map((a) => a.total_score!)) : null;

  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Riwayat Skor"
        title="Riwayat latihan kamera"
        description="Ringkasan skor panduan tersimpan. Video dan posisi tubuh tidak pernah disimpan."
        actions={
          <Link href="/library" className={CMS_BTN_SECONDARY}>
            <Box aria-hidden className="h-4 w-4" />
            Pustaka Gerakan
          </Link>
        }
      />

      {!items.length ? (
        <EmptyState title="Belum ada hasil tersimpan">
          <p className="mb-4 text-sm text-slate-600">
            Pilih gerakan di Pustaka Gerakan lalu tekan &ldquo;Coba Latihan Sekarang&rdquo;.
          </p>
          <Link className={CMS_BTN_PRIMARY} href="/library">
            Buka Pustaka Gerakan <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <BentoKpi label="Skor Terbaik" value={bestOverall ?? "-"} icon={Award} accent />
            <BentoKpi label="Total Percobaan" value={items.length} icon={BarChart3} />
            <BentoKpi label="Gerakan Dilatih" value={by_movement.length} icon={Target} />
          </div>

          <section aria-labelledby="per-gerakan" className="space-y-3">
            <h2 id="per-gerakan" className="text-lg font-bold tracking-tight text-forest-900">
              Per gerakan
            </h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {by_movement.map((b) => {
                const trend = items
                  .filter((a) => a.movement_id === b.movement_id && a.total_score !== null)
                  .reverse()
                  .map((a) => a.total_score!);
                const w = 180;
                const h = 40;
                const pts = trend
                  .map(
                    (s, i) =>
                      `${trend.length < 2 ? w / 2 : (i / (trend.length - 1)) * w},${h - (s / 100) * (h - 6) - 3}`
                  )
                  .join(" ");
                return (
                  <li key={b.movement_id}>
                    <BentoCard className="space-y-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold capitalize text-forest-900">{name(b.movement_id)}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                              {b.attempts} kali
                            </span>
                            <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 font-semibold text-[#6d1b11]">
                              Terbaik {b.best_score ?? "-"}
                            </span>
                            <span className="rounded-full bg-slate-50 px-2.5 py-0.5 font-medium text-slate-600">
                              Rata-rata {b.average_score ?? "-"}
                            </span>
                          </div>
                        </div>
                        <Link
                          className={CMS_BTN_SECONDARY_SM}
                          href={`/library/${b.movement_id.replace(/^mv\.[a-z]+\./, "")}/latihan`}
                        >
                          Latih lagi <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                      {trend.length > 0 && (
                        <div className="rounded-2xl border border-[#fed7aa]/50 bg-[#fffaf5] px-3 py-2">
                          <svg role="img" aria-label={`Tren skor: ${trend.join(", ")}`} width={w} height={h}>
                            <polyline
                              points={pts}
                              fill="none"
                              stroke="#ea580c"
                              strokeWidth="2.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </BentoCard>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="semua" className="space-y-3">
            <h2 id="semua" className="text-lg font-bold tracking-tight text-forest-900">
              Semua hasil
            </h2>
            <ul className="space-y-3">
              {items.map((a) => (
                <li key={a.id}>
                  <BentoCard className="!p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold capitalize text-forest-900">{name(a.movement_id)}</p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                            a.status === "scored"
                              ? "border-[#fed7aa] bg-[#fff6ee] text-[#6d1b11]"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {a.status === "scored" ? `Skor ${a.total_score}` : "Belum dapat dinilai"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(a.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-50 px-2.5 py-0.5">
                        Kualitas masukan: {a.input_quality !== null ? `${Math.round(a.input_quality * 100)}%` : "-"}
                      </span>
                      <span className="rounded-full bg-slate-50 px-2.5 py-0.5">
                        Protokol: {a.protocol_version}
                      </span>
                    </div>

                    {a.feedback?.length ? (
                      <details className="group mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700">
                          <span>Catatan umpan balik ({a.feedback.length})</span>
                          <ChevronDown
                            aria-hidden
                            className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180"
                          />
                        </summary>
                        <ul className="list-disc space-y-1 border-t border-slate-200/70 py-2.5 pl-7 pr-3 text-xs text-slate-600">
                          {a.feedback.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </BentoCard>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
