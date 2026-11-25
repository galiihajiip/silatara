import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";
import {
  PakeliranWayangStage,
  ScrollRevealSection,
  ScrollStaggerContainer,
  ScrollStaggerItem,
} from "@/components/landing/LandingScrollMotion";
import {
  BatikParangPattern,
  BatikTruntumPattern,
  BatikTumpalBand,
  BorobudurEmblem,
  JavaneseCornerOrnament,
  JavaneseSectionDivider,
  KerisOrnament,
  MegaMendungPlume,
  SilatStanceEmblem,
} from "@/components/JavaneseMotifs";
import { MovementCard } from "@/components/knowledge/Bits";
import { SunsetCloudsHero } from "@/components/landing/SunsetCloudsHero";
import { apiGet } from "@/lib/api";
import type { CharacterManifest } from "@/lib/character";
import type { DirectoryStats } from "@/lib/directory";
import type { MovementItem, ResearchSummary } from "@/lib/research";

const faq = [
  [
    "Bagaimana pelacakan gerak bekerja tanpa sensor khusus?",
    "Model deteksi tubuh (MediaPipe) berjalan langsung di peramban Anda dan membaca 33 titik tubuh serta titik-titik jari dari kamera biasa. Anda tidak memerlukan sensor, pakaian, atau perangkat tambahan.",
  ],
  [
    "Apakah video saya direkam atau diunggah?",
    "Tidak. Gambar kamera diproses di perangkat Anda dan tidak dikirim ke server. Setelah skor dihitung, data gerak dihapus dari memori. Hanya angka ringkasan yang bisa Anda simpan bila Anda masuk dan menyetujuinya.",
  ],
  [
    "Apakah skor itu penilaian resmi perguruan?",
    "Bukan. Skor menunjukkan seberapa sesuai gerakan Anda dengan panduan gerak di SILATARA, lengkap dengan alasan per kriteria. Teknik yang sebenarnya perlu diperiksa pelatih langsung.",
  ],
  [
    "Apakah saya harus masuk untuk belajar?",
    "Tidak. Pustaka gerakan, kursus, warisan, dan peta terbuka untuk semua. Masuk hanya diperlukan untuk menyimpan progres dan riwayat skor latihan.",
  ],
  [
    "Seberapa lengkap peta tempat latihannya?",
    "Peta ini masih bertumbuh dan belum mencakup semua perguruan. Tempat yang alamatnya belum diketahui ditampilkan pada tingkat kabupaten/kota, bukan di titik tebakan. Anda dapat mengirim tempat baru atau koreksi lewat formulir di halaman peta.",
  ],
];

const TICKER_ITEMS = [
  "WARISAN NUSANTARA",
  "38 PROVINSI",
  "PERAGA 3D FASE DEMI FASE",
  "LATIHAN KAMERA DI PERANGKAT",
  "GUNUNGAN KAYON",
  "PENCAK SILAT",
];

function SectionFramingHeader({
  eyebrow,
  title,
  subtitle,
  headingId,
  light,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  headingId?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl min-w-0 space-y-3 text-center">
      <div className="flex min-w-0 items-center justify-center gap-3 sm:gap-5">
        <MegaMendungPlume
          className={`hidden h-7 w-20 shrink-0 sm:block ${light ? "text-[#FDE68A]/55" : "text-[#3B0D0C]/35"}`}
        />
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <p
              className={`text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-[#FDE68A]" : "text-[#B45309]"}`}
            >
              {eyebrow}
            </p>
          )}
          <h2
            id={headingId}
            className={`text-balance text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-[#3B0D0C]"}`}
          >
            {title}
          </h2>
        </div>
        <MegaMendungPlume
          flip
          className={`hidden h-7 w-20 shrink-0 sm:block ${light ? "text-[#FDE68A]/55" : "text-[#3B0D0C]/35"}`}
        />
      </div>
      {subtitle && (
        <p
          className={`mx-auto max-w-2xl text-balance text-sm leading-relaxed sm:text-base ${light ? "text-[#FFF8EE]/85" : "text-[#3B0D0C]/75"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default async function Home() {
  const [sum, mv, ch, pr, dir] = await Promise.all([
    apiGet<ResearchSummary>("/research/summary"),
    apiGet<{ items: MovementItem[] }>("/research/movements"),
    apiGet<CharacterManifest>("/research/character"),
    apiGet<{ items: { movement_id: string; status: string }[] }>("/research/assessment/protocols"),
    apiGet<DirectoryStats>("/directory/stats"),
  ]);
  const featured = mv.ok
    ? ["kuda-kuda-depan", "kuda-kuda-tengah", "langkah-angkatan", "sikap-pasang-1"]
        .map((s) => mv.data.items.find((m) => m.slug === s))
        .filter((m): m is MovementItem => !!m)
    : [];
  const practice = pr.ok ? pr.data.items.find((p) => p.status === "active") : undefined;
  const practiceHref = practice
    ? `/library/${practice.movement_id.split(".").pop()}/latihan`
    : "/library";

  /* Fallback metrics when API is offline */
  const stats = [
    sum.ok ? [String(sum.data.provinces.total), "provinsi ditelusuri"] : ["38", "provinsi ditelusuri"],
    sum.ok
      ? [String(sum.data.movements.total), "gerakan diuraikan fase demi fase"]
      : ["120+", "gerakan diuraikan fase demi fase"],
    ch.ok
      ? [String(ch.data.clips.filter((c) => c.checks_passed).length), "gerakan dengan peraga 3D"]
      : ["40+", "gerakan dengan peraga 3D"],
    dir.ok
      ? [String(dir.data.total_places), "lokasi latihan di peta"]
      : ["200+", "lokasi latihan di peta"],
  ] as string[][];

  /* 4-card Nusantara Showcase Gallery with cohesive faceted low-poly transparent PNGs */
  const showcaseCards = [
    {
      href: "/library",
      img: "/landing/poly/poly-kuda-kuda.png",
      label: "Fondasi Gerak",
      title: "Kuda-Kuda Tengah",
      caption: "Pijakan kokoh dan keseimbangan postur dasar.",
    },
    {
      href: "/academy",
      img: "/landing/poly/poly-tendangan.png",
      label: "Akademi Silat",
      title: "Jurus Tendangan & Kelincahan",
      caption: "Rangkaian gerak terstruktur dari pemula hingga mahir.",
    },
    {
      href: "/heritage",
      img: "/landing/poly/poly-gunungan.png",
      label: "Warisan Nusantara",
      title: "Mahkota Gunungan & Kearifan Nusantara",
      caption: "Ragam tradisi pencak silat dari 38 provinsi.",
    },
    {
      href: "/community",
      img: "/landing/poly/poly-wayang-kesatria.png",
      label: "Komunitas & Perguruan",
      title: "Jiwa Kesatria & Wayang Nusantara",
      caption: "Terhubung langsung dengan pelatih dan padepokan.",
    },
  ];

  /* Panggung Padepokan Nusantara revealed low-poly cards */
  const padepokanCards = [
    {
      href: "/heritage",
      img: "/landing/poly/poly-gunungan.png",
      eyebrow: "Warisan Nusantara",
      title: "Akar Budaya 38 Provinsi",
      desc: "Telusuri ragam aliran, sejarah, dan kearifan pencak silat dari seluruh penjuru Nusantara.",
      cta: "Jelajahi Warisan",
    },
    {
      href: "/library",
      img: "/landing/poly/poly-kuda-kuda.png",
      eyebrow: "Pustaka Gerakan 3D",
      title: "Bedah Jurus Fase demi Fase",
      desc: "Putar peraga 3D 360 derajat, atur tempo gerak, dan pahami fondasi kuda-kuda dengan jelas.",
      cta: "Buka Pustaka Gerakan",
    },
    {
      href: "/app",
      img: "/landing/silat-masters-perguruan-transparent.png",
      eyebrow: "Ruang Belajar & Perguruan",
      title: "Latihan Mandiri di Perangkat",
      desc: "Latih gerak solo pemula dengan umpan balik kamera pribadi, lalu lanjutkan bersama pelatih.",
      cta: "Masuk Ruang Belajar",
    },
  ];

  return (
    <div data-fullbleed data-landing-page className="w-full min-w-0 overflow-x-clip bg-[#FFF8EE]">
      {/* ================= BAND 1 (SURFACE A: WARM IVORY BATIK #FFF8EE) HERO ================= */}
      <SunsetCloudsHero practiceHref={practiceHref} />

      {/* ================= CULTURAL TICKER STRIP (SURFACE B BRIDGE #3B0D0C) ================= */}
      <div
        aria-hidden="true"
        className="w-full overflow-hidden border-y border-[#FDE68A]/25 bg-[#3B0D0C] py-3.5"
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-4 text-center sm:gap-x-5">
          {TICKER_ITEMS.map((item, i) => (
            <span key={item} className="inline-flex items-center gap-4 sm:gap-5">
              <span className="whitespace-nowrap text-[11px] font-bold tracking-[0.18em] text-[#FDE68A] sm:text-xs">
                {item}
              </span>
              {i < TICKER_ITEMS.length - 1 && (
                <span className="text-[10px] text-[#FDE68A]/55">✦</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ================= BAND 2 (SURFACE B: DEEP MAROON BATIK #3B0D0C) PANGGUNG PADEPOKAN ================= */}
      <ScrollExpandMedia
        bgImageSrc="/landing/poly/poly-merapi-sunset-wide.jpg"
        mediaSrc="/landing/poly/poly-padepokan-wide.jpg"
        title="Panggung Padepokan Nusantara"
        date="SILATARA · PELESTARIAN & LATIHAN MANDIRI"
        mediaCaption="Padepokan Pendopo · Latihan Senja di Lereng Merapi"
        scrollToExpand="Gulir ke bawah untuk membuka panggung"
      >
        <div className="grid gap-5 md:grid-cols-3">
          {padepokanCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="card-interactive group flex flex-col overflow-hidden rounded-3xl border border-[#FDE68A]/25 bg-[#3B0D0C] shadow-lg"
            >
              {/* Clean Surface A Warm Ivory Batik stage for transparent low-poly subjects */}
              <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[#FFF8EE] p-4">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 text-[#3B0D0C] opacity-[0.06]"
                >
                  <BatikTruntumPattern />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16)_0%,transparent_68%)]"
                />
                <div className="relative h-full w-full">
                  <Image
                    src={card.img}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-contain object-center drop-shadow-[0_10px_18px_rgba(59,13,12,0.18)] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Crisp Surface B editorial caption footer */}
              <div className="flex flex-1 flex-col justify-between border-t border-[#FDE68A]/20 bg-[#3B0D0C] p-6 text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FDE68A]">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-1.5 text-lg font-extrabold text-white">{card.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#FFF8EE]/85">{card.desc}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FDE68A] transition-transform group-hover:translate-x-0.5">
                  {card.cta} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </ScrollExpandMedia>

      {/* ================= BAND 3 (SURFACE A: WARM IVORY BATIK #FFF8EE) 4-CARD SHOWCASE GALLERY ================= */}
      <section
        aria-label="Jelajahi Silatara"
        data-surface="ivory-batik"
        className="relative w-full min-w-0 overflow-hidden bg-[#FFF8EE] py-16 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 text-[#3B0D0C] opacity-[0.065]"
        >
          <BatikParangPattern />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 px-5">
          {/* Editorial split header */}
          <ScrollRevealSection className="mb-10 grid gap-6 lg:grid-cols-2 lg:items-end">
            <div className="space-y-3">
              <JavaneseSectionDivider variant="gading" className="h-5 w-40 text-[#B45309]/65" />
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-4xl">
                Bukan Hanya Peninggalan Masa Lalu
              </h2>
              <p className="max-w-lg text-sm leading-relaxed text-[#3B0D0C]/80 sm:text-base">
                Pencak silat bukan sekadar peninggalan masa lalu, melainkan napas budaya yang terus bergerak.
              </p>
            </div>
            <div className="border-l-4 border-[#3B0D0C]/35 pl-5 lg:text-right">
              <p className="text-sm font-medium italic leading-relaxed text-[#3B0D0C]">
                &ldquo;Gerak adalah bahasa yang melampaui kata, mengalir dari generasi ke generasi sebagai warisan yang hidup.&rdquo;
              </p>
            </div>
          </ScrollRevealSection>

          {/* 4-card gallery strip with clean faceted low-poly subjects */}
          <ScrollStaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {showcaseCards.map((card) => (
              <ScrollStaggerItem key={card.href} className="flex">
                <Link
                  href={card.href}
                  className="card-interactive group flex w-full flex-col overflow-hidden rounded-3xl border border-[#3B0D0C]/15 bg-[#FFF8EE] shadow-md"
                >
                  <div className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-[#FFF8EE] p-4 sm:h-60">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 text-[#3B0D0C] opacity-[0.055]"
                    >
                      <BatikTruntumPattern />
                    </div>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.16)_0%,transparent_66%)]"
                    />
                    <div className="relative h-full w-full">
                      <Image
                        src={card.img}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        loading="lazy"
                        className="object-contain object-center drop-shadow-[0_12px_20px_rgba(59,13,12,0.18)] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between border-t border-[#FDE68A]/25 bg-[#3B0D0C] p-5 text-white">
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FDE68A]">
                        {card.label}
                      </p>
                      <p className="text-base font-extrabold leading-snug text-white">{card.title}</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#FFF8EE]/80">{card.caption}</p>
                    </div>
                  </div>
                </Link>
              </ScrollStaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ================= BAND 4 (SURFACE B: DEEP ROYAL MAROON BATIK #3B0D0C, IMAGE #6) ================= */}
      <section
        aria-label="Cakupan saat ini"
        data-surface="maroon-batik"
        className="relative w-full min-w-0 overflow-hidden bg-[#3B0D0C] py-16 sm:py-20"
      >
        {/* Batik Tumpal gold top/bottom trim */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-6 text-[#FDE68A] opacity-[0.22]">
          <BatikTumpalBand className="h-full w-full" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rotate-180 text-[#FDE68A] opacity-[0.22]">
          <BatikTumpalBand className="h-full w-full" />
        </div>
        {/* Background Batik Parang pattern + warm gold center glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-[#FDE68A] opacity-[0.068]">
          <BatikParangPattern />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.16)_0%,transparent_70%)] blur-2xl"
        />

        {/* Symmetrical low-poly Gunungan & Wayang Kesatria outer margin accents (desktop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 bottom-6 hidden h-48 w-36 select-none opacity-25 xl:block"
        >
          <Image
            src="/landing/poly/poly-gunungan.png"
            alt=""
            fill
            sizes="144px"
            loading="lazy"
            className="object-contain"
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 bottom-4 hidden h-52 w-36 select-none opacity-25 xl:block"
        >
          <Image
            src="/landing/poly/poly-wayang-kesatria.png"
            alt=""
            fill
            sizes="144px"
            loading="lazy"
            className="object-contain"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 px-5">
          <ScrollRevealSection>
            <SectionFramingHeader
              eyebrow="Napas Nusantara"
              title="Cakupan Dokumentasi Terbuka"
              subtitle="SILATARA merekam kekayaan gerakan dari penjuru Nusantara, terbuka untuk semua."
              light
            />
          </ScrollRevealSection>

          <ScrollStaggerContainer as="dl" className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map(([n, l]) => (
              <ScrollStaggerItem
                key={l}
                className="relative overflow-hidden rounded-3xl border border-[#FDE68A]/25 bg-white/[0.07] p-6 text-center shadow-xs backdrop-blur-sm transition-colors hover:border-[#FDE68A]/45 hover:bg-white/[0.11]"
              >
                <JavaneseCornerOrnament
                  corner="tl"
                  className="pointer-events-none absolute left-2 top-2 h-5 w-5 text-[#FDE68A]/35"
                />
                <JavaneseCornerOrnament
                  corner="br"
                  className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 text-[#FDE68A]/35"
                />
                <dd className="relative z-10 text-4xl font-extrabold tracking-tight text-[#FDE68A]">{n}</dd>
                <dt className="relative z-10 mt-1.5 text-sm text-[#FFF8EE]/85">{l}</dt>
              </ScrollStaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ================= BAND 5 (SURFACE A: WARM IVORY BATIK #FFF8EE) 3 PILAR BENTO ================= */}
      <section
        aria-label="Pilar Pembelajaran"
        data-surface="ivory-batik"
        className="relative w-full min-w-0 overflow-hidden bg-[#FFF8EE] py-16 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 text-[#3B0D0C] opacity-[0.065]"
        >
          <BatikParangPattern />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 space-y-12 px-5">
          <ScrollRevealSection>
            <SectionFramingHeader
              eyebrow="Pilar Pembelajaran"
              title="Semua yang Anda Butuhkan untuk Mengenal dan Belajar Silat"
              subtitle="Dari memahami tradisinya, melihat gerakan diperagakan, sampai mencoba sendiri di depan kamera dan menemukan tempat latihan terdekat."
            />
          </ScrollRevealSection>

          {/* 3 Bento Cards strictly in 2-surface palette */}
          <ScrollStaggerContainer className="grid items-stretch gap-6 md:grid-cols-3">
            <ScrollStaggerItem className="flex">
              <Link
                href="/library"
                className="card-interactive group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#3B0D0C]/15 bg-[#FFF8EE] p-8 shadow-sm"
              >
                <JavaneseCornerOrnament
                  corner="tr"
                  className="pointer-events-none absolute right-3 top-3 h-7 w-7 text-[#3B0D0C]/25 transition-colors group-hover:text-[#B45309]/55"
                />
                <div className="space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3B0D0C]/12 bg-[#3B0D0C]/[0.06] text-[#3B0D0C]">
                    <SilatStanceEmblem className="h-7 w-7" />
                  </div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#B45309]">
                    Pustaka Gerakan
                  </span>
                  <h3 className="text-balance text-xl font-bold text-[#3B0D0C]">
                    Peraga 3D, fase demi fase
                  </h3>
                  <p className="text-balance text-sm leading-relaxed text-[#3B0D0C]/75">
                    Setiap gerakan diperagakan karakter 3D yang bisa dijeda, diperlambat, dan dilihat dari depan, samping, atau diputar 360 derajat, lengkap dengan uraian tiap fasenya.
                  </p>
                </div>
                <div className="mt-8 border-t border-[#3B0D0C]/10 pt-4 text-xs font-bold text-[#B45309]">
                  Buka Pustaka Gerakan &rarr;
                </div>
              </Link>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="flex">
              <Link
                href={practiceHref}
                className="card-interactive group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#FDE68A]/30 bg-[#3B0D0C] p-8 text-white shadow-xl ring-1 ring-[#FDE68A]/15"
              >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-[#FDE68A] opacity-[0.07]">
                  <BatikParangPattern />
                </div>
                <JavaneseCornerOrnament
                  corner="tr"
                  className="pointer-events-none absolute right-3 top-3 h-7 w-7 text-[#FDE68A]/35"
                />
                <div className="relative z-10 space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#FDE68A]">
                    <KerisOrnament className="h-7 w-auto" />
                  </div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#FDE68A]">
                    Latihan Kamera
                  </span>
                  <h3 className="text-balance text-xl font-bold text-white">
                    Skor 0&ndash;100 yang bisa dijelaskan
                  </h3>
                  <p className="text-balance text-sm leading-relaxed text-[#FFF8EE]/85">
                    Kamera membaca tubuh dan jari Anda di perangkat sendiri, membandingkannya dengan panduan gerak, lalu menampilkan skor per kriteria beserta saran perbaikan. Video tidak dikirim ke mana pun.
                  </p>
                </div>
                <div className="relative z-10 mt-8 border-t border-[#FDE68A]/15 pt-4 text-xs font-bold text-[#FDE68A]">
                  Coba Latihan Sekarang &rarr;
                </div>
              </Link>
            </ScrollStaggerItem>

            <ScrollStaggerItem className="flex">
              <Link
                href="/community"
                className="card-interactive group relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-[#3B0D0C]/15 bg-[#FFF8EE] p-8 shadow-sm"
              >
                <JavaneseCornerOrnament
                  corner="tr"
                  className="pointer-events-none absolute right-3 top-3 h-7 w-7 text-[#3B0D0C]/25 transition-colors group-hover:text-[#B45309]/55"
                />
                <div className="space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3B0D0C]/12 bg-[#3B0D0C]/[0.06] text-[#3B0D0C]">
                    <BorobudurEmblem className="h-7 w-7" />
                  </div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#B45309]">
                    Peta Perguruan
                  </span>
                  <h3 className="text-balance text-xl font-bold text-[#3B0D0C]">
                    Temukan tempat latihan
                  </h3>
                  <p className="text-balance text-sm leading-relaxed text-[#3B0D0C]/75">
                    Cari perguruan, padepokan, dan pusat latihan menurut provinsi, kabupaten/kota, atau lokasi terdekat Anda. Peta bertumbuh seiring kiriman dan koreksi dari pengguna.
                  </p>
                </div>
                <div className="mt-8 border-t border-[#3B0D0C]/10 pt-4 text-xs font-bold text-[#B45309]">
                  Buka Peta &rarr;
                </div>
              </Link>
            </ScrollStaggerItem>
          </ScrollStaggerContainer>
        </div>
      </section>

      {/* ================= BAND 6 (SURFACE B: DEEP MAROON BATIK #3B0D0C) PANGGUNG PAKELIRAN ================= */}
      <PakeliranWayangStage>
        <div className="space-y-10">
          <ScrollRevealSection className="mx-auto max-w-2xl min-w-0 space-y-3 text-center">
            <JavaneseSectionDivider variant="gading" className="mx-auto h-5 w-44 text-[#FDE68A]/70" />
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Teknologi yang Menghormati Keragaman Tradisi
            </h2>
            <p className="text-balance text-sm leading-relaxed text-[#FFF8EE]/85">
              Pencak silat berbeda di tiap daerah dan perguruan. Kami tidak menyeragamkannya menjadi satu standar.
            </p>
          </ScrollRevealSection>
          <ScrollStaggerContainer className="grid gap-6 md:grid-cols-3">
            {[
              [
                "01 / DI PERANGKAT",
                "Privasi sejak awal",
                "Kamera hanya menyala setelah Anda setuju, dapat dihentikan kapan saja, dan gambar tidak pernah meninggalkan perangkat Anda.",
              ],
              [
                "02 / TERUKUR",
                "Skor yang transparan",
                "Setiap skor berasal dari sudut dan posisi tubuh yang benar-benar terukur. Bila tubuh tidak terlihat jelas, kami tidak memberi skor palsu.",
              ],
              [
                "03 / TERBUKA",
                "Untuk semua orang",
                "Materi umum dapat dibaca tanpa mendaftar. Latihan kamera ditujukan untuk gerak solo tingkat pemula yang aman dilakukan sendiri.",
              ],
            ].map(([k, t, d]) => (
              <ScrollStaggerItem
                key={k}
                className="card-interactive relative space-y-3 overflow-hidden rounded-2xl border border-[#FDE68A]/25 bg-white/[0.07] p-6 backdrop-blur-md transition-colors hover:border-[#FDE68A]/45 hover:bg-white/[0.11]"
              >
                <JavaneseCornerOrnament
                  corner="tl"
                  className="pointer-events-none absolute left-2 top-2 h-5 w-5 text-[#FDE68A]/35"
                />
                <span className="font-mono text-xs font-bold text-[#FDE68A]">{k}</span>
                <h3 className="text-balance text-lg font-bold text-white">{t}</h3>
                <p className="text-balance text-xs leading-relaxed text-[#FFF8EE]/85">{d}</p>
              </ScrollStaggerItem>
            ))}
          </ScrollStaggerContainer>
        </div>
      </PakeliranWayangStage>

      {/* ================= BAND 7 (SURFACE A: WARM IVORY BATIK #FFF8EE) GERAKAN DASAR + FAQ ================= */}
      <section
        data-surface="ivory-batik"
        className="relative w-full min-w-0 overflow-hidden bg-[#FFF8EE] py-16 sm:py-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 text-[#3B0D0C] opacity-[0.065]"
        >
          <BatikParangPattern />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 space-y-16 px-5">
          {/* Gerakan Unggulan (only rendered when API supplies featured movements) */}
          {featured.length > 0 && (
            <div aria-labelledby="gerakan-h" className="space-y-8">
              <ScrollRevealSection className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-2">
                  <JavaneseSectionDivider variant="gading" className="h-5 w-40 text-[#B45309]/65" />
                  <h2 id="gerakan-h" className="text-3xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-4xl">
                    Mulai dari Gerakan Dasar
                  </h2>
                  <p className="text-sm text-[#3B0D0C]/80 sm:text-base">
                    Sikap dan kuda-kuda adalah fondasi hampir semua gerak pencak silat.
                  </p>
                </div>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#B45309] hover:text-[#3B0D0C]"
                >
                  Lihat semua gerakan <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </ScrollRevealSection>
              <ScrollStaggerContainer as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((m) => (
                  <ScrollStaggerItem
                    as="li"
                    key={m.slug}
                    className="rounded-3xl border border-[#3B0D0C]/15 bg-[#FFF8EE] p-4 shadow-xs"
                  >
                    <MovementCard m={m} />
                  </ScrollStaggerItem>
                ))}
              </ScrollStaggerContainer>
            </div>
          )}

          {/* FAQ */}
          <section id="faq" aria-labelledby="faq-h" className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
            <div className="space-y-4">
              <JavaneseSectionDivider variant="gading" className="h-5 w-36 text-[#B45309]/65" />
              <h2 id="faq-h" className="text-balance text-3xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-4xl">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-sm leading-relaxed text-[#3B0D0C]/80">
                Tentang cara kerja pelacakan gerak, privasi kamera, dan peta tempat latihan.
              </p>
            </div>
            <div className="space-y-3">
              {faq.map(([q, a]) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-[#3B0D0C]/15 bg-[#FFF8EE]/95 p-5 shadow-xs backdrop-blur-xs open:border-[#3B0D0C]/30 open:bg-white open:shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#3B0D0C] [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-[#B45309] transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[#3B0D0C]/80">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>

      {/* ================= BAND 8 (SURFACE B: DEEP MAROON BATIK #3B0D0C) CLOSING CTA ================= */}
      <section
        aria-label="Ajakan Mulai Belajar"
        data-surface="maroon-batik"
        className="relative w-full min-w-0 overflow-hidden bg-[#3B0D0C] pb-14 pt-16 text-center text-white sm:pb-16 sm:pt-20"
      >
        {/* Top & bottom Batik Tumpal gold borders */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-6 text-[#FDE68A] opacity-[0.22]">
          <BatikTumpalBand className="h-full w-full" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rotate-180 text-[#FDE68A] opacity-[0.22]">
          <BatikTumpalBand className="h-full w-full" />
        </div>

        {/* Full-bleed warm-gold Batik Parang texture */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 text-[#FDE68A] opacity-[0.068]">
          <BatikParangPattern />
        </div>

        {/* Warm golden Blencong halo behind faceted Gunungan crest */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-4 h-64 w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.22)_0%,transparent_70%)] blur-2xl"
        />

        {/* Crisp faceted low-poly flanking figures on desktop */}
        <div className="pointer-events-none absolute bottom-0 left-3 hidden h-64 w-52 select-none md:block lg:left-10 lg:h-76 lg:w-64">
          <Image
            src="/landing/poly/poly-kuda-kuda.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 16rem, 13rem"
            loading="lazy"
            className="object-contain object-bottom drop-shadow-[0_14px_26px_rgba(0,0,0,0.35)]"
          />
        </div>
        <div className="pointer-events-none absolute bottom-0 right-3 hidden h-64 w-48 select-none md:block lg:right-10 lg:h-76 lg:w-56">
          <Image
            src="/landing/poly/poly-wayang-kesatria.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 14rem, 12rem"
            loading="lazy"
            className="object-contain object-bottom drop-shadow-[0_14px_26px_rgba(0,0,0,0.35)]"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 px-5">
          <ScrollRevealSection className="mx-auto max-w-2xl min-w-0 space-y-5">
            <div aria-hidden="true" className="relative mx-auto h-20 w-16 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Image
                src="/landing/poly/poly-gunungan.png"
                alt=""
                fill
                sizes="64px"
                loading="lazy"
                className="object-contain"
              />
            </div>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Siap Melangkah ke Gerakan Pertama?
            </h2>
            <p className="text-balance text-[#FFF8EE]/85">
              Mulai dari kuda-kuda, lihat peragaannya, lalu coba sendiri.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/library"
                className="rounded-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#FDE68A] px-8 py-3.5 text-sm font-extrabold text-[#3B0D0C] shadow-md shadow-black/25 transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-lg"
              >
                Buka Pustaka Gerakan
              </Link>
              <Link
                href="/community"
                className="rounded-full border border-[#FDE68A]/40 bg-white/[0.08] px-8 py-3.5 text-sm font-semibold text-[#FFF8EE] backdrop-blur-xs transition-all hover:-translate-y-0.5 hover:border-[#FDE68A]/70 hover:bg-white/[0.15]"
              >
                Temukan Tempat Latihan
              </Link>
            </div>
          </ScrollRevealSection>

          {/* Attribution neatly grounded inside closing band */}
          <p className="mx-auto mt-12 max-w-lg text-center text-xs leading-relaxed text-[#FFF8EE]/70">
            Ornamen wayang, gunungan, keris, dan ragam hias batik Nusantara diadaptasi dari koleksi vektor terbuka Wikimedia Commons (CC BY-SA 3.0 / 4.0, CC0), OpenClipart (CC0), serta Pepryan &amp; Hugeicons (MIT). Ilustrasi low-poly Nusantara: koleksi visual SILATARA.
          </p>
        </div>
      </section>
    </div>
  );
}
