"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clientRequest } from "@/lib/client-api";
import { safeNext } from "@/lib/validation";
import type { AuthPayload } from "@/lib/types";
import { Notice } from "@/components/Notice";

export type DemoAccount = { key: string; label: string; description: string; email: string };

/**
 * Login sekali klik untuk akun [DEMO]. Daftar akun diambil halaman di server (GET /auth/demo-accounts); backend
 * mengembalikan 404 di luar pengembangan sehingga panel tidak dirender. Tidak ada kata sandi di klien.
 */
export function DemoLogin({ accounts, next }: { accounts: DemoAccount[]; next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(key: string) {
    setBusy(key);
    setError(null);
    const r = await clientRequest<AuthPayload>("POST", "/auth/demo-login", { key });
    if (!r.ok) {
      setBusy(null);
      setError(r.error);
      return;
    }
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <section
      aria-labelledby="demo-login-title"
      className="rounded-2xl border border-dashed border-[#D97706]/45 bg-[#FFF8EE]/85 p-4"
    >
      <h2 id="demo-login-title" className="text-xs font-bold uppercase tracking-[0.12em] text-[#3B0D0C]">
        Masuk cepat dengan akun demo
      </h2>
      <p className="mt-1 text-xs text-[#3B0D0C]/70">
        Khusus pengembangan &amp; presentasi. Data akun ini fiktif [DEMO].
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {accounts.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => login(a.key)}
            disabled={busy !== null}
            className="rounded-xl border border-[#7C1D1D]/15 bg-white px-3 py-2.5 text-left transition-all hover:border-[#C2410C]/50 hover:bg-[#FFF8EE] disabled:opacity-60"
          >
            <span className="block text-xs font-bold text-[#3B0D0C]">{busy === a.key ? "Memproses…" : a.label}</span>
            <span className="block text-[11px] text-[#3B0D0C]/65">{a.description}</span>
          </button>
        ))}
      </div>
      {error && <div className="mt-2"><Notice kind="error">{error}</Notice></div>}
    </section>
  );
}
