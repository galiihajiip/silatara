import { redirect } from "next/navigation";
import { AuthBentoShell } from "@/components/AuthBentoShell";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/server-api";

export const metadata = { title: "Daftar" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <AuthBentoShell
      eyebrow="Mulai Perjalanan"
      title="Buat akun"
      description="Akun pelajar gratis. Kamera tidak diminta saat mendaftar."
    >
      <AuthForm mode="register" />
    </AuthBentoShell>
  );
}
