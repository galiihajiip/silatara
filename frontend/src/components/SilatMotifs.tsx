import React, { useId } from "react";

/**
 * Authentic Indonesian Pencak Silat Cultural Motifs
 * Re-imagined in Royal Maroon, Chocolate Bronze & Warm Orange/Gold Palette
 * - Kawung (Empat Penjuru Mata Angin & Keseimbangan Silat)
 * - Tumpal / Pucuk Rebung (Keteguhan & Ketajaman Pendekar)
 * - Songket Tenun Nusantara (Tenun Sabuk & Samping Tradisi)
 */

export function SilatPatternKawung({
  className = "text-[#381a0e]",
  opacity = 0.03,
}: {
  className?: string;
  opacity?: number;
}) {
  const patternId = `silat-kawung-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          {/* Central 4-petal Kawung intersection */}
          <ellipse
            cx="24"
            cy="12"
            rx="6"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="24"
            cy="36"
            rx="6"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="12"
            cy="24"
            rx="11"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="36"
            cy="24"
            rx="11"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />

          {/* Corner quarter motifs */}
          <circle cx="24" cy="24" r="2" fill="currentColor" />
          <circle cx="0" cy="0" r="2" fill="currentColor" />
          <circle cx="48" cy="0" r="2" fill="currentColor" />
          <circle cx="0" cy="48" r="2" fill="currentColor" />
          <circle cx="48" cy="48" r="2" fill="currentColor" />

          {/* Radiating corner petals */}
          <ellipse
            cx="0"
            cy="24"
            rx="11"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="48"
            cy="24"
            rx="11"
            ry="6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="24"
            cy="0"
            rx="6"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <ellipse
            cx="24"
            cy="48"
            rx="6"
            ry="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export function SilatPatternTumpal({
  className = "text-[#4a120b]",
  opacity = 0.04,
}: {
  className?: string;
  opacity?: number;
}) {
  const patternId = `silat-tumpal-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={patternId}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Chevron / Pucuk Rebung Tumpal Triangles */}
          <path
            d="M0 40 L20 0 L40 40 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M6 40 L20 12 L34 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <path
            d="M12 40 L20 24 L28 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export function SilatMotifRibbon({
  className = "",
}: {
  className?: string;
}) {
  // Elegant traditional border divider motif in warm red & amber
  return (
    <div
      className={`flex items-center justify-center gap-3 select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
      <div className="flex items-center gap-1.5 text-orange-600/70">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#7f1d1d] font-silat">
          SILATARA
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
        </svg>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
    </div>
  );
}
