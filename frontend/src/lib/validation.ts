/** Validasi form sisi klien (UX). Server tetap memvalidasi ulang, ini bukan batas keamanan. */
export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL = /^[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}$/;

export function validateLogin(v: { email: string; password: string }): FieldErrors<"email" | "password"> {
  const e: FieldErrors<"email" | "password"> = {};
  if (!EMAIL.test(v.email.trim())) e.email = "Masukkan alamat email yang valid.";
  if (!v.password) e.password = "Kata sandi wajib diisi.";
  return e;
}

export function validateRegister(v: {
  email: string; password: string; display_name: string; confirm: string;
}): FieldErrors<"email" | "password" | "display_name" | "confirm"> {
  const e: FieldErrors<"email" | "password" | "display_name" | "confirm"> = {};
  const name = v.display_name.trim();
  if (name.length < 2 || name.length > 80) e.display_name = "Nama tampilan 2–80 karakter.";
  if (!EMAIL.test(v.email.trim())) e.email = "Masukkan alamat email yang valid.";
  if (v.password.length < 12) e.password = "Kata sandi minimal 12 karakter.";
  else if (v.password.length > 128) e.password = "Kata sandi maksimal 128 karakter.";
  if (v.confirm !== v.password) e.confirm = "Konfirmasi kata sandi tidak sama.";
  return e;
}

const NEXT_ALLOWED_PREFIXES = ["/app", "/academy", "/heritage", "/community", "/status", "/undangan"];

/**
 * Tujuan redirect pasca-login yang aman (anti open-redirect).
 * Hanya path internal berawalan allowlist; menolak URL eksternal, protocol-relative (`//`),
 * backslash, karakter kontrol/spasi, dan varian ter-encode (`/%2F/evil`, `/%5Cevil`).
 */
export function safeNext(next: string | null | undefined, fallback = "/app"): string {
  if (!next || next.length > 512) return fallback;
  if (/[\u0000-\u001f\u007f\\\s]/.test(next)) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return fallback;
  }
  if (/[\u0000-\u001f\\]/.test(decoded) || decoded.startsWith("//") || /^\/+[a-z][a-z0-9+.-]*:/i.test(decoded)) return fallback;
  let url: URL;
  try {
    url = new URL(next, "http://silatara.invalid");
  } catch {
    return fallback;
  }
  if (url.origin !== "http://silatara.invalid") return fallback;
  const ok = NEXT_ALLOWED_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
  return ok ? url.pathname + url.search + url.hash : fallback;
}

export function validateNewPassword(v: { password: string; confirm: string }): FieldErrors<"password" | "confirm"> {
  const e: FieldErrors<"password" | "confirm"> = {};
  if (v.password.length < 12) e.password = "Kata sandi minimal 12 karakter.";
  else if (v.password.length > 128) e.password = "Kata sandi maksimal 128 karakter.";
  if (v.confirm !== v.password) e.confirm = "Konfirmasi kata sandi tidak sama.";
  return e;
}

export function validateEmailOnly(email: string): string | undefined {
  return EMAIL.test(email.trim()) ? undefined : "Masukkan alamat email yang valid.";
}
