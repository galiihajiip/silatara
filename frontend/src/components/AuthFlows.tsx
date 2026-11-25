"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clientRequest } from "@/lib/client-api";
import { validateEmailOnly, validateNewPassword } from "@/lib/validation";
import { Notice } from "@/components/Notice";

const inputCls =
  "w-full rounded-2xl border border-[#7C1D1D]/15 bg-[#FFF8EE]/70 px-4 py-3 text-sm text-[#3B0D0C] placeholder:text-[#3B0D0C]/40 transition-all focus:border-[#C2410C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2410C]/20";
const btn =
  "w-full rounded-full bg-gradient-to-r from-[#3B0D0C] via-[#6D1815] to-[#B45309] px-6 py-3.5 text-sm font-bold text-[#FFF8EE] shadow-md shadow-[#3B0D0C]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60";

/** Hapus ?token= dari URL setelah dibaca agar tidak tertinggal di riwayat/Referer. */
function useStripToken() {
  useEffect(() => { window.history.replaceState(null, "", window.location.pathname); }, []);
}

export function VerifyEmail({ token }: { token: string | null }) {
  useStripToken();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function go() {
    setState("busy");
    const r = await clientRequest("POST", "/auth/verify-email", { token });
    if (r.ok) setState("ok"); else { setState("error"); setMsg(r.error); }
  }
  if (!token) return <p role="alert" className="text-clay-600">Tautan tidak lengkap. Buka tautan dari email Anda.</p>;
  return (
    <div className="space-y-4">
      {state !== "ok" && <button onClick={go} disabled={state === "busy"} className={btn}>{state === "busy" ? "Memverifikasi…" : "Verifikasi email saya"}</button>}
      <Notice kind={state === "ok" ? "success" : state === "error" ? "error" : null}>{state === "ok" ? "Email terverifikasi. Silakan masuk." : msg}</Notice>
      {state === "ok" && <Link href="/masuk" className="inline-block underline">Masuk sekarang</Link>}
      {state === "error" && <Link href="/masuk" className="inline-block underline">Kirim ulang verifikasi dari halaman masuk</Link>}
    </div>
  );
}

export function ForgotPassword() {
  const [err, setErr] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const v = validateEmailOnly(email);
    setErr(v);
    if (v) return;
    setBusy(true);
    const r = await clientRequest("POST", "/auth/password-reset/request", { email: email.trim() });
    setBusy(false);
    if (r.ok) setDone(true); else setServerErr(r.error);
  }
  if (done) return <p role="status">Jika email tersebut terdaftar, tautan atur ulang kata sandi telah dikirim. Tautan berlaku 30 menit dan hanya dapat dipakai sekali.</p>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!err} aria-describedby={err ? "email-err" : undefined} />
        {err && <p id="email-err" className="mt-1 text-sm text-clay-600">{err}</p>}</div>
      <Notice kind={serverErr ? "error" : null}>{serverErr}</Notice>
      <button className={btn} disabled={busy}>{busy ? "Mengirim…" : "Kirim tautan"}</button>
      <p className="text-center text-sm"><Link className="underline" href="/masuk">Kembali ke halaman masuk</Link></p>
    </form>
  );
}

export function ResetPassword({ token }: { token: string | null }) {
  useStripToken();
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [serverErr, setServerErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = { password: String(f.get("password") ?? ""), confirm: String(f.get("confirm") ?? "") };
    const er = validateNewPassword(v);
    setErrs(er);
    if (Object.keys(er).length) return;
    setState("busy");
    const r = await clientRequest("POST", "/auth/password-reset/confirm", { token, new_password: v.password });
    if (r.ok) return setState("ok");
    setState("idle"); setServerErr(r.error);
  }
  if (!token) return <p role="alert" className="text-clay-600">Tautan tidak lengkap. Minta tautan baru dari halaman “Lupa kata sandi”.</p>;
  if (state === "ok") return <div role="status" className="space-y-2"><p>Kata sandi diperbarui. Semua sesi lama telah dikeluarkan.</p><Link className="underline" href="/masuk">Masuk</Link></div>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {(["password", "confirm"] as const).map((n) => (
        <div key={n}><label htmlFor={n} className="mb-1 block text-sm font-medium">{n === "password" ? "Kata sandi baru" : "Ulangi kata sandi baru"}</label>
          <input id={n} name={n} type="password" autoComplete="new-password" className={inputCls} aria-invalid={!!errs[n]} />
          {n === "password" && !errs[n] && <p className="mt-1 text-xs text-slate-600">Minimal 12 karakter.</p>}
          {errs[n] && <p className="mt-1 text-sm text-clay-600">{errs[n]}</p>}</div>))}
      <Notice kind={serverErr ? "error" : null}>{serverErr}</Notice>
      <button className={btn} disabled={state === "busy"}>{state === "busy" ? "Menyimpan…" : "Simpan kata sandi baru"}</button>
    </form>
  );
}
