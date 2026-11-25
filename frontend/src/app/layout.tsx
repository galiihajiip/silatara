import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Plus_Jakarta_Sans, Roboto } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// Font di-host sendiri oleh Next (diunduh saat build); peramban pengunjung tidak menghubungi Google.
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-plus-jakarta", display: "swap" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-cinzel-face", display: "swap" });
const cinzelDeco = Cinzel_Decorative({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-cinzel-deco", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESC = "Jelajahi kekayaan pencak silat Nusantara: tradisi dari 38 provinsi, gerakan yang diperagakan karakter 3D fase demi fase, peta tempat latihan, dan latihan kamera yang berjalan di perangkat Anda.";
const TITLE = "SILATARA: Warisan Gerak, Generasi Bergerak";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s | SILATARA" },
  description: DESC,
  applicationName: "SILATARA",
  openGraph: { type: "website", siteName: "SILATARA", locale: "id_ID", title: TITLE, description: DESC },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};
export const viewport: Viewport = { themeColor: "#4a0d0d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${roboto.variable} ${cinzel.variable} ${cinzelDeco.variable}`}>
      <body className="flex min-h-dvh flex-col bg-[#f8fafc] bg-batik-kawung font-sans text-slate-900 antialiased selection:bg-orange-500/20 selection:text-red-950">
        <a href="#utama" className="sr-only focus:not-sr-only focus:absolute focus:m-3 focus:rounded-lg focus:bg-white focus:p-3 focus:shadow-md">Lewati ke konten utama</a>
        <SiteHeader />
        <main id="utama" className="flex w-full flex-1 flex-col overflow-x-clip animate-page-entrance">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 [&:has(>[data-fullbleed])]:flex [&:has(>[data-fullbleed])]:max-w-none [&:has(>[data-fullbleed])]:flex-1 [&:has(>[data-fullbleed])]:flex-col [&:has(>[data-fullbleed])]:p-0">
            {children}
          </div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
