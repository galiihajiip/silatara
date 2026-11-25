"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import { clientRequest } from "@/lib/client-api";
import { safeNext, validateLogin, validateRegister } from "@/lib/validation";
import type { AuthPayload } from "@/lib/types";
import { Notice } from "@/components/Notice";

type Mode = "login" | "register";
const inputCls =
  "w-full rounded-2xl border border-[#7C1D1D]/15 bg-[#FFF8EE]/70 py-3 pl-11 pr-4 text-sm text-[#3B0D0C] placeholder:text-[#3B0D0C]/40 transition-all focus:border-[#C2410C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20";

function Field({
  id,
  label,
  error,
  help,
  icon,
  labelRight,
  type = "text",
  allowReveal,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
  help?: string;
  icon: "mail" | "lock" | "user";
  labelRight?: React.ReactNode;
  allowReveal?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [revealed, setRevealed] = useState(false);
  const inputType = allowReveal ? (revealed ? "text" : "password") : type;

  const Icon = icon === "mail" ? Mail : icon === "lock" ? Lock : UserIcon;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-[0.12em] text-[#3B0D0C]/80">
          {label}
        </label>
        {labelRight}
      </div>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-[#7C1D1D]/60"
        >
          <Icon className="h-4 w-4" />
        </span>
        <input
          id={id}
          name={id}
          type={inputType}
          className={`${inputCls} ${allowReveal ? "pr-11" : ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : help ? `${id}-help` : undefined}
          {...rest}
        />
        {allowReveal && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-2xl text-[#3B0D0C]/55 transition-colors hover:text-[#3B0D0C]"
          >
            {revealed ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
          </button>
        )}
      </div>
      {help && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-[#3B0D0C]/65">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-xs font-medium text-[#C2410C]">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resent, setResent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const f = new FormData(e.currentTarget);
    const v = {
      email: String(f.get("email") ?? ""),
      password: String(f.get("password") ?? ""),
      display_name: String(f.get("display_name") ?? ""),
      confirm: String(f.get("confirm") ?? ""),
    };
    const errs = isRegister ? validateRegister(v) : validateLogin(v);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const r = await clientRequest<AuthPayload>(
      "POST",
      isRegister ? "/auth/register" : "/auth/login",
      isRegister
        ? { email: v.email.trim(), password: v.password, display_name: v.display_name.trim() }
        : { email: v.email.trim(), password: v.password },
    );
    if (!r.ok) {
      setBusy(false);
      if (r.code === "VALIDATION_ERROR" && Array.isArray(r.details)) {
        const m: Record<string, string> = {};
        for (const d of r.details as { field: string; message: string }[]) m[d.field] = d.message;
        setErrors(m);
      }
      setServerError(r.error);
      setNeedsVerify(r.code === "EMAIL_NOT_VERIFIED");
      return;
    }
    if (isRegister) {
      setSent(v.email.trim());
      setBusy(false);
      return;
    }
    router.push(safeNext(next));
    router.refresh();
  }

  async function resend() {
    const email = new FormData(formRef.current!).get("email");
    const r = await clientRequest("POST", "/auth/resend-verification", { email: String(email ?? "").trim() });
    setServerError(r.ok ? null : r.error);
    setNeedsVerify(!r.ok);
    if (r.ok) setResent(true);
  }

  if (sent) {
    return (
      <div role="status" className="space-y-3 rounded-2xl border border-[#7C1D1D]/15 bg-[#FFF8EE]/80 p-5">
        <h2 className="font-serif text-xl font-bold text-[#3B0D0C]">Periksa email Anda</h2>
        <p className="text-sm leading-relaxed text-[#3B0D0C]/85">
          Jika <strong>{sent}</strong> dapat didaftarkan, kami telah mengirim tautan verifikasi. Tautan berlaku 48 jam dan hanya dapat dipakai sekali.
        </p>
        <p className="text-xs leading-relaxed text-[#3B0D0C]/70">
          Belum menerima? Periksa folder spam, lalu coba{" "}
          <Link className="font-semibold text-[#B45309] underline" href="/masuk">
            masuk
          </Link>{" "}
          untuk mengirim ulang verifikasi.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby="form-status">
      {isRegister && (
        <Field
          id="display_name"
          label="Nama tampilan"
          icon="user"
          autoComplete="name"
          placeholder="Nama panggilan atau lengkap"
          error={errors.display_name}
        />
      )}
      <Field
        id="email"
        type="email"
        label="Email"
        icon="mail"
        autoComplete="email"
        placeholder="nama@contoh.id"
        error={errors.email}
      />
      <Field
        id="password"
        type="password"
        label="Kata sandi"
        icon="lock"
        allowReveal
        placeholder={isRegister ? "Minimal 12 karakter" : "Masukkan kata sandi"}
        error={errors.password}
        autoComplete={isRegister ? "new-password" : "current-password"}
        help={isRegister ? "Minimal 12 karakter." : undefined}
        labelRight={
          !isRegister ? (
            <Link
              className="text-xs font-semibold text-[#B45309] transition-colors hover:text-[#3B0D0C] hover:underline"
              href="/lupa-sandi"
            >
              Lupa kata sandi?
            </Link>
          ) : undefined
        }
      />
      {isRegister && (
        <Field
          id="confirm"
          type="password"
          label="Ulangi kata sandi"
          icon="lock"
          allowReveal
          placeholder="Ketik ulang kata sandi"
          autoComplete="new-password"
          error={errors.confirm}
        />
      )}
      <div id="form-status">
        <Notice kind={serverError ? "error" : resent ? "success" : null}>
          {serverError ?? (resent ? "Jika akun ini ada dan belum terverifikasi, tautan baru telah dikirim." : null)}
        </Notice>
        {needsVerify && (
          <button
            type="button"
            onClick={resend}
            className="mt-1.5 text-xs font-semibold text-[#B45309] underline hover:text-[#3B0D0C]"
          >
            Kirim ulang email verifikasi
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-[#3B0D0C] via-[#6D1815] to-[#B45309] px-6 py-3.5 text-sm font-bold text-[#FFF8EE] shadow-md shadow-[#3B0D0C]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? "Memproses…" : isRegister ? "Buat akun" : "Masuk"}
      </button>
      <p className="pt-1 text-center text-sm text-[#3B0D0C]/75">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link className="font-bold text-[#3B0D0C] underline decoration-[#D97706]/70 underline-offset-4 hover:text-[#B45309]" href="/masuk">
              Masuk
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link className="font-bold text-[#3B0D0C] underline decoration-[#D97706]/70 underline-offset-4 hover:text-[#B45309]" href="/daftar">
              Daftar
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
