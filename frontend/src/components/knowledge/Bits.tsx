import Link from "next/link";
import { Footprints } from "lucide-react";
import type { AnimationRef, MovementItem } from "@/lib/research";
import { LEVEL_ID, SAFETY_CLASS_LABEL } from "@/lib/research";
import { AnimationPlayer } from "@/components/knowledge/AnimationPlayer";

/** Apakah kelas keselamatan memerlukan pendampingan pelatih/pasangan (bukan latihan solo mandiri). */
export function isSupervisedSafety(cls: string | null | undefined): boolean {
  return Boolean(cls && !cls.startsWith("solo_"));
}

/**
 * Bersihkan teks uraian gerakan dari kalimat basa-basi latihan mandiri,
 * rujukan silang internal, dan sitasi akademis di tengah kalimat agar praktis dibaca.
 */
export function cleanMovementText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\bDapat dilatih sendiri(?:\s+oleh\s+pemula)?\.?/gi, "")
    .replace(/\s*\(lihat\s+common\.[a-z0-9_.-]+\)/gi, "")
    .replace(/\s*\((?:supervised_only|solo_beginner|solo_intermediate|solo_advanced|partner_required)\)/gi, "")
    .replace(
      /\s*\([^)]*(?:\b\d{4}\b|hlm\.|dkk\.|et al\.|menurut\s+[A-Z]|saran kami|sumber tidak|tidak disebut|tergambar di ilustrasi|Herdiana|Nugroho|Januarno|Atok Iskandar|Ediwar)[^)]*\)/gi,
      "",
    )
    .replace(/\s*,?\s*menurut\s+[A-Z][A-Za-z.\s]*(?:\(\d{4}\))?/g, "")
    .replace(/(?:^|[.;]\s*)(?:Angka jarak|Sudut|Lebar)\s+tidak disebut(?:\s+sumber)?\.?/gi, "")
    .replace(/;\s*sumber tidak menyebut[^.;]*/gi, "")
    .replace(/^Tidak dirinci(?:\s+dalam)?\s+sumber\s*;\s*/i, "")
    .replace(/;\s*tanyakan detailnya kepada pelatih\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

/** Penanda ringkas untuk tingkat, fase, atau perhatian keselamatan. */
export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn" | "ok";
}) {
  const cls =
    tone === "warn"
      ? "border border-[#fed7aa] bg-[#fff6ee] text-[#9a3412]"
      : tone === "ok"
        ? "border border-[#6d1b11]/20 bg-[#6d1b11]/10 text-[#2e0909]"
        : "border border-[#e7d7c8] bg-[#faf7f4] text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function SafetyPill({ cls }: { cls: string }) {
  return (
    <Pill tone={cls === "solo_beginner" ? "ok" : "warn"}>{SAFETY_CLASS_LABEL[cls] ?? cls}</Pill>
  );
}

/** Visual gerakan: pemutar animasi bila tersedia; bila belum, panel ilustratif yang tenang. */
export function MovementVisual({
  a,
  title,
  compact = false,
  variant = "default",
}: {
  a: AnimationRef;
  title: string;
  compact?: boolean;
  variant?: "default" | "hero";
}) {
  if (a.status === "generated" && a.url) {
    return <AnimationPlayer src={a.url} title={title} compact={compact} variant={variant} />;
  }
  const hero = variant === "hero";
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 border border-[#e7d7c8] bg-[#fff6ee] p-6 text-center ${
        hero ? "aspect-[16/10] max-h-[420px] rounded-[20px]" : "aspect-[9/11] rounded-xl p-4"
      }`}
    >
      <Footprints
        aria-hidden
        className={hero ? "h-10 w-10 text-[#9a3412]" : "h-8 w-8 text-[#9a3412]"}
      />
      <p className={hero ? "font-serif text-xl text-[#2e0909]" : "font-serif text-lg text-[#2e0909]"}>
        {title}
      </p>
      {!compact && <p className="text-xs text-slate-600">Ikuti urutan langkah di bawah.</p>}
    </div>
  );
}

export function MovementCard({ m }: { m: MovementItem }) {
  return (
    <article className="group">
      <Link href={`/library/${m.slug}`} className="block" aria-label={m.name}>
        <MovementVisual a={m.animation} title={m.name} compact />
      </Link>
      <h3 className="mt-2 font-medium text-[#2e0909]">
        <Link href={`/library/${m.slug}`} className="hover:underline">
          {m.name}
        </Link>
      </h3>
      <p className="text-xs text-slate-600">
        {m.category_label} · {LEVEL_ID[m.level] ?? m.level} · {m.phases} fase
      </p>
    </article>
  );
}
