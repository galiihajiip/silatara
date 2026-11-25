import Image from "next/image";
import Link from "next/link";

/** Satu-satunya sumber simbol brand: potongan persegi dari maskot SILATARA (public/brand/silatara-mark.png). */
export function BrandMark({ size = 36, priority = false, className = "" }: { size?: number; priority?: boolean; className?: string }) {
  return <Image src="/brand/silatara-mark.png" alt="" aria-hidden width={size} height={size} priority={priority} className={`shrink-0 object-contain ${className}`} />;
}

/** Logo resmi SILATARA (public/brand/silatara-logo-full.png, rasio 934×245). `size` = tinggi dalam px. */
export function BrandLogo({ size = 40, href = "/", priority = false, className = "" }: { size?: number; tone?: "dark" | "light"; href?: string | null; priority?: boolean; className?: string }) {
  const img = (
    <Image src="/brand/silatara-logo-full.png" alt="SILATARA" width={934} height={245} priority={priority}
      style={{ height: size, width: "auto" }} className={`object-contain ${className}`} />
  );
  return href ? <Link href={href} aria-label="SILATARA: beranda" className="inline-flex items-center">{img}</Link> : <span className="inline-flex items-center">{img}</span>;
}

/** Penanda memuat bermerek (menggantikan spinner generik). */
export function BrandLoader({ label = "Memuat…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
      <BrandMark size={56} className="brand-breathe" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
