import { BentoCard, CmsPageHeader } from "@/components/cms/Bento";
import { LazyBenchmarkRunner } from "@/components/LazyClients";
import { requireUser } from "@/lib/server-api";

export const metadata = { title: "Benchmark kamera", robots: { index: false } };

export default async function BenchmarkPage() {
  await requireUser("/app/practice/benchmark");
  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Pengujian teknis"
        title="Benchmark mesin landmark"
        description="Perbandingan kinerja main thread dan Web Worker pada perangkat Anda."
      />
      <BentoCard>
        <LazyBenchmarkRunner />
      </BentoCard>
    </div>
  );
}
