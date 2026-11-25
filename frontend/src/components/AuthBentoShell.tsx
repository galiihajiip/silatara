import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/Brand";

const TRUST_EMBLEMS = [
  { src: "/landing/poly/poly-kuda-kuda.png", key: "kuda-kuda" },
  { src: "/landing/poly/poly-tendangan.png", key: "tendangan" },
  { src: "/landing/poly/poly-gunungan.png", key: "gunungan" },
] as const;

export function AuthBentoShell({
  eyebrow = "Akun SILATARA",
  title,
  description,
  children,
  extraSlot,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  extraSlot?: React.ReactNode;
}) {
  return (
    <div
      data-fullbleed
      data-auth-page
      className="relative isolate grid min-h-dvh w-full grid-cols-1 overflow-x-clip bg-[#FFFBF5] lg:grid-cols-2"
    >
      {/* LEFT 50% EDGE-TO-EDGE SCENIC PANEL: Pure text-free Padepokan illustration with soft reduced opacity */}
      <aside
        aria-hidden="true"
        className="relative min-h-[240px] overflow-hidden bg-[#3B0D0C] sm:min-h-[320px] lg:min-h-dvh"
      >
        <Image
          src="/landing/poly/poly-padepokan-wide.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center opacity-75"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#3B0D0C]/20 via-transparent to-[#270706]/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(39,7,6,0.32)_100%)]" />
      </aside>

      {/* RIGHT 50% EDGE-TO-EDGE CLEAN WARM IVORY PANEL: Header + Centered Auth Card + Heritage Strip */}
      <div className="relative isolate flex flex-col justify-between bg-[#FFFBF5] px-5 py-7 sm:px-10 sm:py-9 lg:min-h-dvh lg:px-12 lg:py-10 xl:px-16">
        {/* Whisper-clean soft radial warm ivory highlight (zero patterns) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_75%_55%_at_50%_38%,rgba(254,243,199,0.42)_0%,transparent_72%)]"
        />

        {/* Top bar: SILATARA brand logo + subtle Kembali ke Beranda link */}
        <div className="mx-auto flex w-full max-w-[460px] flex-wrap items-center justify-between gap-3">
          <BrandLogo size={38} priority />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#3B0D0C]/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#3B0D0C]/80 shadow-2xs transition-colors hover:border-[#3B0D0C]/28 hover:bg-[#FFF8EE] hover:text-[#3B0D0C]"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5 text-[#B45309]" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Centered Auth Form Card */}
        <div className="mx-auto my-auto w-full max-w-[460px] py-6 sm:py-8">
          <div className="rounded-3xl border border-[#3B0D0C]/[0.08] bg-white p-6 shadow-[0_14px_40px_rgba(59,13,12,0.06)] sm:p-8">
            <div className="mb-6 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B45309]">
                {eyebrow}
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-[#3B0D0C]/70">
                {description}
              </p>
            </div>

            {children}

            {extraSlot ? <div className="mt-5">{extraSlot}</div> : null}
          </div>
        </div>

        {/* Bottom Heritage Pill Strip */}
        <div className="mx-auto flex w-full max-w-[460px] items-center justify-between gap-2.5 rounded-2xl border border-[#3B0D0C]/[0.08] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(59,13,12,0.03)] sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div aria-hidden="true" className="flex shrink-0 -space-x-2">
              {TRUST_EMBLEMS.map((item) => (
                <span
                  key={item.key}
                  className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[#3B0D0C]/12 bg-white p-1 ring-2 ring-[#FFFBF5]"
                >
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-contain p-0.5"
                  />
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold tracking-tight text-[#3B0D0C]">
                38 Provinsi · 120+ Gerakan Terarsip
              </p>
              <p className="truncate text-[11px] text-[#3B0D0C]/65">
                Terbuka untuk pelajar &amp; perguruan
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 whitespace-nowrap rounded-full border border-[#D97706]/25 bg-[#FEF3C7]/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A3412] sm:inline-flex">
            Nusantara
          </span>
        </div>
      </div>
    </div>
  );
}
