"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/Brand";

export function shouldHideFooter(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/app" || pathname.startsWith("/app/")) return true;
  if (/^\/(masuk|daftar|lupa-sandi|atur-ulang-sandi|verifikasi-email)(\/|$)/.test(pathname)) return true;
  if (/\/latihan(\/|$)/.test(pathname)) return true;
  if (/\/practice(\/|$)/.test(pathname)) return true;
  return false;
}

const FOOTER_COLUMNS = [
  {
    title: "Belajar",
    links: [
      { href: "/library", label: "Pustaka Gerakan" },
      { href: "/academy", label: "Akademi" },
      { href: "/library/kuda-kuda-tengah/latihan", label: "Latihan Kamera" },
    ],
  },
  {
    title: "Jelajahi",
    links: [
      { href: "/heritage", label: "Warisan 38 Provinsi" },
      { href: "/community/peta", label: "Peta Perguruan" },
      { href: "/community/kirim-tempat", label: "Kirim Tempat" },
    ],
  },
  {
    title: "Akun",
    links: [
      { href: "/masuk", label: "Masuk" },
      { href: "/daftar", label: "Daftar" },
      { href: "/status", label: "Status Layanan" },
    ],
  },
] as const;

export function SiteFooter() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;

  return (
    <footer
      data-site-footer
      className="relative z-10 border-t border-amber-200/15 bg-[#3B0D0C] text-[#FFF8EE]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F59E0B]/55 to-transparent"
      />

      <div className="mx-auto max-w-[1200px] px-6 py-10 sm:py-11">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="max-w-xs space-y-3.5">
            <Link
              href="/"
              aria-label="SILATARA: beranda"
              className="inline-flex w-fit items-center rounded-full border border-[#FDE68A]/35 bg-[#FFF8EE] px-4 py-1.5 shadow-sm transition-transform duration-200 hover:scale-[1.02]"
            >
              <BrandLogo size={30} href={null} />
            </Link>
            <p className="text-sm leading-relaxed text-[#E7D5C5]">
              Arsip gerak pencak silat Nusantara berbasis AI.
            </p>
          </div>

          <nav
            aria-label="Tautan kaki halaman"
            className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 sm:gap-x-10 lg:gap-x-12"
          >
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="space-y-2.5">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDE68A]">
                  {col.title}
                </h2>
                <ul className="space-y-2 text-sm text-[#E7D5C5]">
                  {col.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-block transition-colors duration-150 hover:text-amber-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-amber-200/15 pt-5 text-xs text-[#E7D5C5]/80 sm:flex-row sm:items-center">
          <p>© 2026 SILATARA · Warisan Gerak, Generasi Bergerak</p>
          <p>Privasi kamera di perangkat · Peta © kontributor OpenStreetMap</p>
        </div>
      </div>
    </footer>
  );
}
