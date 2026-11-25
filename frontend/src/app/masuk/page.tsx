import { redirect } from "next/navigation";
import { AuthBentoShell } from "@/components/AuthBentoShell";
import { AuthForm } from "@/components/AuthForm";
import { DemoLogin, type DemoAccount } from "@/components/DemoLogin";
import { getCurrentUser, sGet } from "@/lib/server-api";
import { safeNext } from "@/lib/validation";

export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  // Daftar akun demo diambil di server: 404 di luar pengembangan -> panel tidak dirender sama sekali.
  const demo = await sGet<DemoAccount[]>("/auth/demo-accounts");
  const resolvedNext = safeNext(next);

  return (
    <AuthBentoShell
      eyebrow="Selamat Datang Kembali"
      title="Masuk"
      description="Lanjutkan belajar dan lihat progres Anda."
      extraSlot={
        demo.ok && demo.data.length > 0 ? <DemoLogin accounts={demo.data} next={resolvedNext} /> : undefined
      }
    >
      <AuthForm mode="login" next={resolvedNext} />
    </AuthBentoShell>
  );
}
