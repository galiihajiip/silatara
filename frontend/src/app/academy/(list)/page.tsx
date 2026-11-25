import Link from "next/link";
import { ArrowRight, Box, Camera, GraduationCap, ListOrdered, MapPinned } from "lucide-react";
import { SilatPatternKawung } from "@/components/SilatMotifs";
import { apiGet } from "@/lib/api";
import type { Curricula } from "@/lib/research";
import { AcademyCourseCard } from "./AcademyCourseCard";

export const metadata = {
  title: "Akademi",
  description:
    "Belajar pencak silat selangkah demi selangkah: kursus terstruktur dengan animasi, uraian fase, panduan latihan mandiri, dan kuis, terbuka untuk semua.",
  alternates: { canonical: "/academy" },
};

const PILLARS = [
  { label: "Peraga 3D 360°", Icon: Box },
  { label: "Uraian Fase", Icon: ListOrdered },
  { label: "Latihan Kamera AI", Icon: Camera },
] as const;

const EXPLORE_CARDS = [
  {
    href: "/library",
    eyebrow: "Peraga Interaktif",
    title: "Pustaka Gerakan 3D",
    description:
      "Amati setiap gerak dasar dari berbagai sudut, jeda tiap fase, dan pelajari urutan posturnya.",
    cta: "Buka pustaka",
    Icon: Box,
  },
  {
    href: "/app/practice",
    eyebrow: "Umpan Balik Langsung",
    title: "Latihan Kamera AI",
    description:
      "Coba gerakan di depan kamera perangkatmu dengan evaluasi postur privat tanpa unggah video.",
    cta: "Mulai latihan",
    Icon: Camera,
  },
  {
    href: "/community/peta",
    eyebrow: "Komunitas & Padepokan",
    title: "Peta Perguruan Nusantara",
    description:
      "Temukan perguruan, padepokan, dan tempat latihan terdekat untuk berlatih bersama pelatih.",
    cta: "Lihat peta",
    Icon: MapPinned,
  },
] as const;

export default async function AcademyPage() {
  const k = await apiGet<Curricula>("/research/curricula");
  const courses = k.ok ? k.data.items : [];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Framed Editorial Banner */}
      <header className="relative overflow-hidden rounded-[28px] border border-[#7c1d1d]/35 bg-gradient-to-br from-[#2e0909] via-[#4a120b] to-[#6d1b11] p-6 text-white shadow-lg sm:p-8">
        <SilatPatternKawung className="text-[#fed7aa]" opacity={0.075} />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#ea580c]/30 via-[#fbbf24]/15 to-transparent blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#fed7aa]/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#fde68a] shadow-2xs backdrop-blur-xs">
              <GraduationCap aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>Akademi</span>
            </p>
            <h1 className="font-serif text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.15rem]">
              Belajar pencak silat selangkah demi selangkah
            </h1>
            <p className="text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">
              Kurikulum terstruktur dari sikap dasar hingga pola langkah, dilengkapi peraga 3D,
              uraian fase, dan panduan latihan mandiri tanpa perlu mendaftar.
            </p>
          </div>

          <ul aria-label="Metode belajar Akademi" className="flex flex-wrap gap-2 lg:justify-end">
            {PILLARS.map(({ label, Icon }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-[#fde68a]/30 bg-white/12 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs backdrop-blur-xs"
              >
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Course Showcase */}
      {courses.length > 0 ? (
        <ul className="space-y-6">
          {courses.map((course) => (
            <AcademyCourseCard key={course.slug} course={course} />
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-dashed border-[#fed7aa] bg-[#fff6ee] px-6 py-10 text-center">
          <p className="font-semibold text-[#2e0909]">Kurikulum belum tersedia saat ini</p>
          <p className="mt-1 text-sm text-slate-600">
            Silakan muat ulang beberapa saat lagi untuk melihat daftar kelas Akademi.
          </p>
        </div>
      )}

      {/* Lanjutkan Eksplorasi Bento Strip */}
      <section
        aria-labelledby="eksplorasi-h"
        className="rounded-[28px] border border-[#e7d7c8] bg-[#FFFDF9] p-5 shadow-xs sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9a3412]">
              Ekosistem Belajar
            </p>
            <h2
              id="eksplorasi-h"
              className="mt-0.5 font-serif text-xl font-extrabold tracking-tight text-[#2e0909] sm:text-2xl"
            >
              Lanjutkan Eksplorasi
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            Padukan materi kurikulum dengan peraga 3D, latihan kamera, dan perguruan terdekat.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {EXPLORE_CARDS.map(({ href, eyebrow, title, description, cta, Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-interactive group flex h-full flex-col rounded-[22px] border border-[#ece2d8] bg-white bg-gradient-to-b from-[#fffaf5] to-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ea580c]/55 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#fed7aa] bg-[#fff6ee] text-[#7c1d1d] transition-colors group-hover:bg-[#6d1b11] group-hover:text-white">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                  {eyebrow}
                </span>
              </div>

              <h3 className="mt-4 font-serif text-lg font-extrabold text-[#2e0909] transition-colors group-hover:text-[#7c1d1d]">
                {title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>

              <div className="mt-5 flex items-center justify-between border-t border-[#fed7aa]/60 pt-3.5 text-xs font-semibold text-[#6d1b11]">
                <span>{cta}</span>
                <ArrowRight
                  aria-hidden
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
