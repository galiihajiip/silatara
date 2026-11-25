"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { BrandLogo } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { ROLE_LABEL } from "@/lib/format";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/heritage", label: "Jelajahi Warisan" },
  { href: "/library", label: "Pustaka Gerakan" },
  { href: "/academy", label: "Akademi" },
  { href: "/community", label: "Peta Perguruan" },
];

const UNIFIED_PILL =
  "pointer-events-auto flex h-14 items-center justify-between gap-4 rounded-full border border-[#7C1D1D]/15 bg-[#FFF8EE]/92 px-4 shadow-[0_12px_34px_rgba(59,13,12,0.10),inset_0_1px_0_rgba(245,158,11,0.24)] ring-1 ring-[#D97706]/20 backdrop-blur-md sm:h-[60px] sm:px-5";

const UNIFIED_NAV_ACTIVE =
  "bg-gradient-to-r from-[#3B0D0C] via-[#6D1815] to-[#B45309] font-semibold text-[#FFF8EE] shadow-sm shadow-[#3B0D0C]/20 ring-1 ring-[#D97706]/30";

const UNIFIED_NAV_INACTIVE =
  "text-[#3B0D0C]/80 hover:bg-[#fff6ee] hover:text-[#6d1b11]";

const UNIFIED_CTA =
  "whitespace-nowrap rounded-full bg-gradient-to-r from-[#3B0D0C] via-[#6D1815] to-[#B45309] font-semibold text-[#FFF8EE] shadow-sm shadow-[#3B0D0C]/20 transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-md";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AUTH_STANDALONE_RE = /^\/(masuk|daftar|lupa-sandi|atur-ulang-sandi|verifikasi-email)(\/|$)/;

export function shouldHideHeader(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_STANDALONE_RE.test(pathname);
}

export function SiteHeaderClient({
  user,
  isCms,
}: {
  user: User | null;
  isCms?: boolean;
}) {
  const pathname = usePathname() ?? "/";
  const inApp = isCms !== undefined ? isCms : pathname.startsWith("/app");
  const isLanding = !inApp && pathname === "/";
  const hideHeader = !inApp && shouldHideHeader(pathname);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  if (hideHeader) return null;

  return (
    <header
      data-site-header
      data-landing-header={isLanding ? "" : undefined}
      className={`${isLanding ? "fixed inset-x-0" : "sticky"} top-0 z-50 bg-transparent pointer-events-none font-sans`}
    >
      <div
        className={`mx-auto ${isLanding ? "max-w-[1280px]" : "max-w-[1440px]"} px-4 pb-2.5 pt-3.5 sm:px-6 lg:px-8`}
      >
        <div className={UNIFIED_PILL}>
          {/* Logo Identitas SILATARA */}
          <div className="flex shrink-0 items-center gap-3 pl-0.5">
            <BrandLogo size={32} priority className="transition-transform duration-200 hover:scale-[1.03]" />
          </div>

          {/* Navigasi Utama Desktop */}
          <nav aria-label="Utama" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => {
              const isActive = inApp ? false : l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                    isActive ? UNIFIED_NAV_ACTIVE : UNIFIED_NAV_INACTIVE
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            {inApp && (
              <Link
                href="/app"
                aria-current="page"
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition-all duration-200 ${UNIFIED_NAV_ACTIVE}`}
              >
                Dasbor
              </Link>
            )}
          </nav>

          {/* Sisi Kanan: Utilitas & Akses Pengguna Desktop */}
          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            {user ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label={`Menu profil ${user.display_name}`}
                  className="flex items-center gap-2 rounded-full border border-[#7C1D1D]/18 bg-[#FFF8EE] py-1 pl-1.5 pr-3 text-left transition-all duration-200 hover:border-[#D97706]/50 hover:bg-[#fff6ee]"
                >
                  <span
                    aria-hidden
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3B0D0C] via-[#7c1d1d] to-[#D97706] text-[11px] font-bold text-white shadow-xs"
                  >
                    {initials(user.display_name)}
                  </span>
                  <span className="max-w-[8.5rem] truncate text-xs font-semibold text-[#3B0D0C]">
                    {user.display_name}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Menu pengguna"
                    className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#7C1D1D]/15 bg-[#FFF8EE] p-1.5 shadow-[0_14px_38px_rgba(59,13,12,0.16)] animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="border-b border-[#3B0D0C]/10 px-3 py-2">
                      <p className="truncate text-xs font-bold text-[#3B0D0C]">{user.display_name}</p>
                      <p className="truncate text-[11px] text-[#3B0D0C]/65">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-[#3B0D0C]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3B0D0C]">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/app"
                        role="menuitem"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#3B0D0C] transition-colors hover:bg-[#fff6ee] hover:text-[#6d1b11]"
                      >
                        <LayoutDashboard aria-hidden className="h-4 w-4 text-[#C2410C]" />
                        <span>Dasbor</span>
                      </Link>

                      <div className="flex items-center rounded-xl px-3 py-1.5 transition-colors hover:bg-[#fff6ee]">
                        <LogOut aria-hidden className="h-4 w-4 text-[#3B0D0C]/65" />
                        <LogoutButton className="w-full text-left text-xs font-semibold text-[#3B0D0C] transition-all duration-200 hover:bg-[#fff6ee] hover:text-[#6d1b11]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="whitespace-nowrap rounded-full border border-[#7C1D1D]/20 bg-transparent px-4 py-1.5 text-[13px] font-semibold text-[#3B0D0C] transition-all duration-200 hover:border-[#7C1D1D]/45 hover:bg-[#fff6ee] hover:text-[#6d1b11]"
                >
                  Masuk
                </Link>
                <Link href="/academy" className={`${UNIFIED_CTA} px-4 py-1.5 text-[13px]`}>
                  Mulai Belajar
                </Link>
              </>
            )}
          </div>

          {/* Sisi Kanan: Menu Seluler & Peran */}
          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <span className="rounded-full bg-[#3B0D0C]/10 px-2.5 py-1 text-xs font-semibold text-[#3B0D0C]">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            )}
            <details className="relative">
              <summary
                aria-label="Buka menu"
                className="flex cursor-pointer list-none items-center rounded-full border border-[#7C1D1D]/20 bg-[#FFF8EE] p-2 text-[#3B0D0C] transition-all duration-200 hover:bg-[#fff6ee]"
              >
                <Menu aria-hidden className="h-4 w-4" />
              </summary>
              <nav
                aria-label="Utama (seluler)"
                className="absolute right-0 z-50 mt-2 flex w-64 flex-col gap-1 rounded-[20px] border border-[#7C1D1D]/15 bg-[#FFF8EE] p-3 shadow-[0_16px_42px_rgba(59,13,12,0.18)]"
              >
                {user && (
                  <div className="mb-1 flex items-center gap-2.5 rounded-2xl bg-[#3B0D0C]/[0.06] px-3 py-2">
                    <span
                      aria-label={user.display_name}
                      title={user.display_name}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3B0D0C] via-[#7c1d1d] to-[#D97706] text-xs font-bold text-white"
                    >
                      {initials(user.display_name)}
                    </span>
                    <span className="min-w-0 truncate text-xs font-bold text-[#3B0D0C]">
                      {user.display_name}
                    </span>
                  </div>
                )}
                {LINKS.map((l) => {
                  const isActive = inApp ? false : l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive ? UNIFIED_NAV_ACTIVE : UNIFIED_NAV_INACTIVE
                      }`}
                    >
                      {l.label}
                    </Link>
                  );
                })}
                {user ? (
                  <>
                    <Link
                      href="/app"
                      aria-current={inApp ? "page" : undefined}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        inApp ? UNIFIED_NAV_ACTIVE : UNIFIED_NAV_INACTIVE
                      }`}
                    >
                      Dasbor
                    </Link>
                    <hr className="my-1 border-[#3B0D0C]/12" />
                    <div className="flex items-center px-1">
                      <LogOut aria-hidden className="ml-2 h-4 w-4 text-[#3B0D0C]/65" />
                      <LogoutButton className="w-full rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-[#3B0D0C] transition-all duration-200 hover:bg-[#fff6ee] hover:text-[#6d1b11]" />
                    </div>
                  </>
                ) : (
                  <>
                    <hr className="my-1 border-[#3B0D0C]/12" />
                    <Link
                      href="/masuk"
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-[#3B0D0C] transition-all duration-200 hover:bg-[#fff6ee] hover:text-[#6d1b11]"
                    >
                      Masuk
                    </Link>
                    <Link href="/academy" className={`${UNIFIED_CTA} mt-1 py-2 text-center text-xs`}>
                      Mulai Belajar
                    </Link>
                  </>
                )}
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
