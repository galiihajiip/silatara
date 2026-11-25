import Link from "next/link";
import { ArrowRight, BookOpen, FileText, Footprints, MapPin } from "lucide-react";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import type { TraditionItem } from "@/lib/research";

/** Rapikan ringkasan tradisi agar bebas dari sitasi akademis berlebih di akhir kalimat. */
export function cleanTraditionSummary(summary: string): string {
  return summary
    .replace(/\s*\([^)]*(?:\b\d{4}\b|hlm\.|dkk\.|et al\.|sumber)[^)]*\)/gi, "")
    .replace(/\s*\[[^\]]*(?:\b\d{4}\b|hlm\.|sumber)[^\]]*\]/gi, "")
    .replace(/\s*[\u2014\u2013-]\s*(?:sumber|rujukan|lihat)\s*:.*$/i, "")
    .replace(/\s+menurut\s+[A-Z][^.,;]*(?:,\s*\d{4})?/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim()
    .replace(/\s*[\u2014\u2015]\s*/g, ", ");
}

export function TraditionShowcaseCard({ tradition }: { tradition: TraditionItem }) {
  const pills: { key: string; label: string; primary?: boolean; Icon: typeof Footprints }[] = [];
  if (tradition.movement_count > 0) {
    pills.push({
      key: "movements",
      label: `${tradition.movement_count} gerakan`,
      primary: true,
      Icon: Footprints,
    });
  }
  if (tradition.course_count > 0) {
    pills.push({ key: "courses", label: `${tradition.course_count} kursus`, Icon: BookOpen });
  }
  if (tradition.related_entity_count > 0) {
    pills.push({
      key: "entities",
      label: `${tradition.related_entity_count} catatan`,
      Icon: FileText,
    });
  }

  const summary = cleanTraditionSummary(tradition.public_summary);

  return (
    <Link
      href={`/heritage/${tradition.slug}`}
      className="card-interactive group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#e7d7c8] bg-gradient-to-b from-[#fffaf5] via-white to-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#ea580c]/55 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ea580c]"
    >
      {/* Rich Royal Maroon & Warm Amber Top Accent Band */}
      <div className="relative overflow-hidden border-b border-[#fed7aa]/60 bg-gradient-to-r from-[#2e0909] via-[#5a160e] to-[#8f2317] px-6 py-3.5 text-white">
        <SilatPatternTumpal className="text-[#fde68a]" opacity={0.14} />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#fbbf24]/20 blur-2xl"
        />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#fde68a]">
            <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#fbbf24]" />
            <span>{tradition.region ?? "Nusantara"}</span>
          </p>
          {tradition.local_name && (
            <span className="rounded-full border border-[#fde68a]/35 bg-white/12 px-2.5 py-0.5 text-[11px] font-semibold text-[#fff7ed] backdrop-blur-xs">
              {tradition.local_name}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl font-extrabold leading-snug tracking-tight text-[#2e0909] transition-colors group-hover:text-[#7c1d1d]">
          {tradition.name}
        </h3>

        {summary && (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{summary}</p>
        )}

        {pills.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {pills.map(({ key, label, primary, Icon }) => (
              <span
                key={key}
                className={
                  primary
                    ? "inline-flex items-center gap-1.5 rounded-full border border-[#6d1b11]/20 bg-[#6d1b11]/10 px-3 py-1 text-xs font-semibold text-[#4a120b]"
                    : "inline-flex items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-medium text-[#9a3412]"
                }
              >
                <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#c2410c]" />
                <span>{label}</span>
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between border-t border-[#fed7aa]/70 pt-4 text-sm font-semibold text-[#6d1b11] transition-colors group-hover:text-[#9a3412]">
            <span>Telusuri tradisi</span>
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
