import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status sistem | SILATARA" };

type Live = { status: string; service: string; version: string; env: string };
type Ready = { status: string; database: string; migration_revision: string };
type Tradition = { slug: string; name: string; provenance: { is_demo: boolean } };
type Paged<T> = { items: T[]; total: number };

function Row({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-line-200 bg-paper-50 px-4 py-3">
      <span>{label}</span>
      <span className={ok ? "text-forest-700" : "text-clay-600"}>
        {ok ? "✓ Tersambung" : "✕ Bermasalah"} <span className="text-sm text-slate-600">({detail})</span>
      </span>
    </li>
  );
}

export default async function StatusPage() {
  const [live, ready, trad] = await Promise.all([
    apiGet<Live>("/health"),
    apiGet<Ready>("/health/ready"),
    apiGet<Paged<Tradition>>("/traditions?page_size=5"),
  ]);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-forest-900">Status sistem</h1>
      <p className="text-slate-600">Diambil dari sisi server frontend melalui jaringan Docker (nama service <code>backend</code>).</p>
      <ul className="space-y-3">
        <Row label="API backend" ok={live.ok} detail={live.ok ? `${live.data.service} v${live.data.version}` : live.error} />
        <Row label="PostgreSQL & migrasi" ok={ready.ok} detail={ready.ok ? `revisi ${ready.data.migration_revision}` : ready.error} />
      </ul>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Data tradisi dari API</h2>
        {trad.ok && trad.data.items.length === 0 && <p className="text-slate-600">Belum ada tradisi yang disetujui. Ini wajar pada tahap awal.</p>}
        {trad.ok && trad.data.items.map((t) => (
          <p key={t.slug} className="rounded-xl border border-line-200 bg-paper-50 px-4 py-3">
            {t.name} {t.provenance.is_demo && <span className="ml-2 rounded-full bg-bronze-500/15 px-2 py-0.5 text-xs text-ink-950">DEMO: bukan data autentik</span>}
          </p>
        ))}
        {!trad.ok && <p className="text-clay-600">Gagal memuat: {trad.error}</p>}
      </section>
    </div>
  );
}
