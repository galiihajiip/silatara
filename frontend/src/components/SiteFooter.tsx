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

export function SiteFooter() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;

  const fl = "transition-colors hover:text-red-900";
  return (
    <footer
      data-site-footer
      className="relative z-10 border-t border-slate-200/80 bg-white"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo size={44} />
            <p className="max-w-md text-sm leading-relaxed text-slate-600">
              Platform untuk mengenal, mempelajari, dan melestarikan pencak silat Indonesia. Pengetahuan umum terbuka untuk semua; berlatihlah bersama pelatih untuk menguasai teknik.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Belajar</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link className={fl} href="/library">Pustaka Gerakan</Link></li>
              <li><Link className={fl} href="/academy">Akademi</Link></li>
              <li><Link className={fl} href="/library/kuda-kuda-tengah/latihan">Latihan Kamera</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Jelajahi</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link className={fl} href="/heritage">Warisan 38 Provinsi</Link></li>
              <li><Link className={fl} href="/community">Peta Perguruan</Link></li>
              <li><Link className={fl} href="/community/kirim-tempat">Kirim Tempat Latihan</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Akun</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link className={fl} href="/masuk">Masuk</Link></li>
              <li><Link className={fl} href="/daftar">Daftar</Link></li>
              <li><Link className={fl} href="/status">Status Layanan</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 text-xs text-slate-500 md:flex-row">
          <p>© 2026 SILATARA. Warisan Gerak, Generasi Bergerak.</p>
          <p>Peta: © kontributor OpenStreetMap · Kamera diproses di perangkat Anda, video tidak dikirim.</p>
        </div>
      </div>
    </footer>
  );
}
