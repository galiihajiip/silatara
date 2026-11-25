import Link from "next/link";
import { CMS_BTN_SECONDARY, CmsPageHeader } from "@/components/cms/Bento";
import { LazyCameraCheck } from "@/components/LazyClients";
import { requireUser } from "@/lib/server-api";

export const metadata = { title: "Uji kamera" };

export default async function CameraCheckPage() {
  await requireUser("/app/practice/camera-check");
  return (
    <div className="space-y-6">
      <CmsPageHeader
        eyebrow="Persiapan Latihan"
        title="Uji kamera & keterlihatan tubuh"
        description="Pastikan pencahayaan cukup dan seluruh tubuh terlihat jelas di layar sebelum mulai berlatih."
        actions={
          <>
            <Link className={CMS_BTN_SECONDARY} href="/app/practice/benchmark">
              Benchmark mesin
            </Link>
            <Link className={CMS_BTN_SECONDARY} href="/academy">
              Belajar tanpa kamera
            </Link>
          </>
        }
      />
      <LazyCameraCheck />
    </div>
  );
}
