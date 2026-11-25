import { AuthBentoShell } from "@/components/AuthBentoShell";
import { ForgotPassword } from "@/components/AuthFlows";

export const metadata = { title: "Lupa kata sandi", robots: { index: false } };

export default async function Page() {
  return (
    <AuthBentoShell
      eyebrow="Pemulihan Akun"
      title="Lupa kata sandi"
      description="Masukkan email akun Anda. Kami akan mengirim tautan atur ulang bila akun tersebut ada."
    >
      <ForgotPassword />
    </AuthBentoShell>
  );
}
