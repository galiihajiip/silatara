"use client";

import { Fragment, useEffect, useId, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";
import {
  ParallaxLayerStage,
  type ParallaxLayer,
} from "@/components/ui/parallax-scrolling";

const HERO_PARALLAX_LAYERS: ParallaxLayer[] = [
  { id: "1", yPercent: 28 },
  { id: "2", yPercent: 18 },
  { id: "3", yPercent: 10 },
  { id: "4", yPercent: 4 },
];

const LINE_ONE_WORDS = ["Warisan", "Gerak,"];
const LINE_TWO_WORDS = ["Generasi", "Bergerak"];
const LOGO_HOLD_MS = 3200;
const HEADLINE_HOLD_MS = 4200;

/** Crisp 4-point star path centered at (cx, cy) with outer radius r and tight inner waist */
function fourPointStarPath(cx: number, cy: number, r: number): string {
  const inner = Number((r * 0.22).toFixed(2));
  return [
    `M${cx},${cy - r}`,
    `Q${cx + inner * 0.45},${cy - inner * 0.45} ${cx + r},${cy}`,
    `Q${cx + inner * 0.45},${cy + inner * 0.45} ${cx},${cy + r}`,
    `Q${cx - inner * 0.45},${cy + inner * 0.45} ${cx - r},${cy}`,
    `Q${cx - inner * 0.45},${cy - inner * 0.45} ${cx},${cy - r}Z`,
  ].join(" ");
}

/**
 * Hero SILATARA with a clean, Batik-free warm sunset-cream sky gradient,
 * gentle floating clouds (awan), twinkling antique-gold stars (bintang),
 * a fixed-height centered sequential choreography stage looping smoothly
 * between Beat 1 (Large official SILATARA Logo with golden halo, float, and
 * CSS mask metallic gold shimmer (zero raster image tags) and Beat 2
 * (Kinetic staggered "Warisan Gerak, Generasi Bergerak" headline + subtitle),
 * grounded over 100% solid opaque faceted low-poly Merapi, Candi, Joglo, and
 * Gunungan Kayon mountains with zero transparency holes or parallax gaps.
 *
 * Test invariants (sunset-clouds-hero.test.tsx & brand.test.ts):
 *   - container.querySelectorAll("img").length === 0
 *   - container.querySelectorAll("svg linearGradient").length >= 8
 *   - stopOpacity="0" present on sky/cloud/ridge gradients (never on mountain bodies)
 *   - container.querySelectorAll("article").length === 0
 *   - axe.run(container).violations === []
 */
export function SunsetCloudsHero({ practiceHref }: { practiceHref: string }) {
  const uid = useId().replace(/:/g, "");
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"logo" | "headline">("logo");

  useEffect(() => {
    if (shouldReduceMotion) return;
    const duration = phase === "logo" ? LOGO_HOLD_MS : HEADLINE_HOLD_MS;
    const timer = window.setTimeout(() => {
      setPhase((current) => (current === "logo" ? "headline" : "logo"));
    }, duration);
    return () => window.clearTimeout(timer);
  }, [phase, shouldReduceMotion]);

  const isLogo = shouldReduceMotion || phase === "logo";
  const isHeadline = shouldReduceMotion || phase === "headline";

  const logoBgStyle = {
    backgroundImage: 'url("/brand/silatara-logo-full.png")',
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  } as const;

  const logoMaskStyle = {
    maskImage: 'url("/brand/silatara-logo-full.png")',
    WebkitMaskImage: 'url("/brand/silatara-logo-full.png")',
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  } as const;

  return (
    <section
      aria-label="Pengantar SILATARA"
      data-surface="sunset-sky"
      className="relative isolate overflow-x-clip bg-gradient-to-b from-[#F3E1C8] via-[#FBF0DF] to-[#FAD3A0]"
    >
      {/* ParallaxLayerStage coordinates all 4 depth layers + foreground focal stage depth shift */}
      <ParallaxLayerStage
        layers={HERO_PARALLAX_LAYERS}
        className="relative w-full overflow-hidden pb-44 pt-24 sm:pb-56 sm:pt-28 lg:pb-64 lg:pt-32"
      >
        {/* ============ BACKGROUND SKY + CLOUDS + STARS + SOLID MOUNTAINS ============ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          {/* SKY BACKDROP: Clean warm dusk glow + subtle twinkling antique-gold stars (bintang) */}
          <div data-hero-stars className="pointer-events-none absolute inset-x-0 top-0 h-[76%] overflow-hidden">
            {/* Soft radial golden horizon glow behind the headline & Merapi silhouette */}
            <div className="sunset-glow-pulse absolute bottom-[-60px] left-1/2 h-[300px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.24)_0%,rgba(217,119,6,0.09)_46%,transparent_72%)] sm:h-[380px] sm:w-[760px]" />

            {/* Left sky star cluster (anchored left so visible cleanly on both mobile & desktop) */}
            <svg
              viewBox="0 0 360 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-0 top-12 h-auto w-[195px] sm:top-14 sm:w-[320px] lg:w-[410px]"
            >
              {/* Four-point antique-gold star sparkles */}
              <g className="hero-star-twinkle-a" style={{ transformOrigin: "84px 66px" }}>
                <circle cx="84" cy="66" r="10" fill="#FEF3C7" fillOpacity="0.55" />
                <path d={fourPointStarPath(84, 66, 9)} fill="#C26A08" />
                <circle cx="84" cy="66" r="1.8" fill="#FFFBEB" />
              </g>
              <g className="hero-star-twinkle-b" style={{ transformOrigin: "212px 44px" }}>
                <circle cx="212" cy="44" r="7.5" fill="#FDE68A" fillOpacity="0.45" />
                <path d={fourPointStarPath(212, 44, 6.5)} fill="#B45309" />
              </g>
              <g className="hero-star-twinkle-c" style={{ transformOrigin: "152px 164px" }}>
                <circle cx="152" cy="164" r="8" fill="#FEF3C7" fillOpacity="0.5" />
                <path d={fourPointStarPath(152, 164, 7.2)} fill="#D97706" />
                <circle cx="152" cy="164" r="1.4" fill="#FFFBEB" />
              </g>
              <g className="hero-star-twinkle-a" style={{ transformOrigin: "286px 118px" }}>
                <path d={fourPointStarPath(286, 118, 5.4)} fill="#D97706" fillOpacity="0.88" />
              </g>
              <g className="hero-star-twinkle-b" style={{ transformOrigin: "54px 218px" }}>
                <path d={fourPointStarPath(54, 218, 6)} fill="#B45309" fillOpacity="0.82" />
              </g>
              <g className="hero-star-twinkle-c" style={{ transformOrigin: "252px 226px" }}>
                <path d={fourPointStarPath(252, 226, 4.8)} fill="#D97706" fillOpacity="0.78" />
              </g>
              {/* Delicate pinprick star dots */}
              <circle cx="38" cy="108" r="1.8" fill="#B45309" fillOpacity="0.72" className="hero-star-twinkle-b" />
              <circle cx="128" cy="98" r="1.5" fill="#D97706" fillOpacity="0.75" className="hero-star-twinkle-c" />
              <circle cx="176" cy="78" r="1.4" fill="#B45309" fillOpacity="0.68" />
              <circle cx="256" cy="68" r="1.7" fill="#D97706" fillOpacity="0.72" className="hero-star-twinkle-a" />
              <circle cx="326" cy="84" r="1.5" fill="#C26A08" fillOpacity="0.65" />
              <circle cx="96" cy="144" r="1.4" fill="#B45309" fillOpacity="0.62" />
              <circle cx="214" cy="152" r="1.6" fill="#D97706" fillOpacity="0.68" className="hero-star-twinkle-b" />
              <circle cx="112" cy="206" r="1.7" fill="#C26A08" fillOpacity="0.66" className="hero-star-twinkle-a" />
              <circle cx="192" cy="236" r="1.4" fill="#B45309" fillOpacity="0.58" />
              <circle cx="312" cy="186" r="1.5" fill="#D97706" fillOpacity="0.62" className="hero-star-twinkle-c" />
            </svg>

            {/* Top-center delicate star arch above hero title/logo */}
            <svg
              viewBox="0 0 480 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-1/2 top-14 h-auto w-[280px] -translate-x-1/2 sm:top-16 sm:w-[460px] lg:w-[560px]"
            >
              <g className="hero-star-twinkle-b" style={{ transformOrigin: "82px 42px" }}>
                <path d={fourPointStarPath(82, 42, 5.4)} fill="#C26A08" fillOpacity="0.82" />
              </g>
              <g className="hero-star-twinkle-c" style={{ transformOrigin: "234px 28px" }}>
                <circle cx="234" cy="28" r="6" fill="#FEF3C7" fillOpacity="0.45" />
                <path d={fourPointStarPath(234, 28, 5)} fill="#B45309" fillOpacity="0.8" />
              </g>
              <g className="hero-star-twinkle-a" style={{ transformOrigin: "392px 40px" }}>
                <path d={fourPointStarPath(392, 40, 5.8)} fill="#D97706" fillOpacity="0.85" />
              </g>
              <circle cx="42" cy="64" r="1.4" fill="#B45309" fillOpacity="0.58" />
              <circle cx="148" cy="34" r="1.5" fill="#D97706" fillOpacity="0.65" className="hero-star-twinkle-a" />
              <circle cx="192" cy="52" r="1.3" fill="#B45309" fillOpacity="0.52" />
              <circle cx="294" cy="36" r="1.5" fill="#D97706" fillOpacity="0.65" className="hero-star-twinkle-b" />
              <circle cx="342" cy="54" r="1.3" fill="#C26A08" fillOpacity="0.56" />
              <circle cx="438" cy="62" r="1.5" fill="#B45309" fillOpacity="0.6" className="hero-star-twinkle-c" />
            </svg>

            {/* Right sky star cluster (anchored right so visible cleanly on both mobile & desktop) */}
            <svg
              viewBox="0 0 360 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-0 top-12 h-auto w-[195px] sm:top-14 sm:w-[320px] lg:w-[410px]"
            >
              <g className="hero-star-twinkle-b" style={{ transformOrigin: "272px 62px" }}>
                <circle cx="272" cy="62" r="10.5" fill="#FEF3C7" fillOpacity="0.55" />
                <path d={fourPointStarPath(272, 62, 9.2)} fill="#C26A08" />
                <circle cx="272" cy="62" r="1.8" fill="#FFFBEB" />
              </g>
              <g className="hero-star-twinkle-a" style={{ transformOrigin: "144px 48px" }}>
                <circle cx="144" cy="48" r="7.5" fill="#FDE68A" fillOpacity="0.45" />
                <path d={fourPointStarPath(144, 48, 6.4)} fill="#B45309" />
              </g>
              <g className="hero-star-twinkle-c" style={{ transformOrigin: "204px 162px" }}>
                <circle cx="204" cy="162" r="8" fill="#FEF3C7" fillOpacity="0.5" />
                <path d={fourPointStarPath(204, 162, 7.2)} fill="#D97706" />
                <circle cx="204" cy="162" r="1.4" fill="#FFFBEB" />
              </g>
              <g className="hero-star-twinkle-b" style={{ transformOrigin: "74px 116px" }}>
                <path d={fourPointStarPath(74, 116, 5.4)} fill="#D97706" fillOpacity="0.88" />
              </g>
              <g className="hero-star-twinkle-a" style={{ transformOrigin: "306px 212px" }}>
                <path d={fourPointStarPath(306, 212, 6.2)} fill="#B45309" fillOpacity="0.82" />
              </g>
              <g className="hero-star-twinkle-c" style={{ transformOrigin: "108px 224px" }}>
                <path d={fourPointStarPath(108, 224, 4.8)} fill="#D97706" fillOpacity="0.78" />
              </g>
              {/* Delicate pinprick star dots */}
              <circle cx="322" cy="112" r="1.8" fill="#B45309" fillOpacity="0.72" className="hero-star-twinkle-a" />
              <circle cx="232" cy="96" r="1.5" fill="#D97706" fillOpacity="0.75" className="hero-star-twinkle-c" />
              <circle cx="182" cy="82" r="1.4" fill="#B45309" fillOpacity="0.68" />
              <circle cx="102" cy="72" r="1.7" fill="#D97706" fillOpacity="0.72" className="hero-star-twinkle-b" />
              <circle cx="36" cy="90" r="1.5" fill="#C26A08" fillOpacity="0.65" />
              <circle cx="262" cy="146" r="1.4" fill="#B45309" fillOpacity="0.62" />
              <circle cx="144" cy="154" r="1.6" fill="#D97706" fillOpacity="0.68" className="hero-star-twinkle-a" />
              <circle cx="248" cy="204" r="1.7" fill="#C26A08" fillOpacity="0.66" className="hero-star-twinkle-b" />
              <circle cx="164" cy="234" r="1.4" fill="#B45309" fillOpacity="0.58" />
              <circle cx="52" cy="184" r="1.5" fill="#D97706" fillOpacity="0.62" className="hero-star-twinkle-c" />
            </svg>
          </div>

          {/* CLEAN FLOATING CLOUDS (AWAN): Soft layered clouds drifting gently in the plain sky */}
          <div data-hero-clouds className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Upper-left calm billowing cloud bank */}
            <div className="sunset-cloud-drift-left absolute -left-12 top-24 w-[225px] sm:-left-8 sm:top-24 sm:w-[350px] lg:-left-4 lg:top-28 lg:w-[440px]">
              <svg viewBox="0 0 460 155" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-cloud-tl-top`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                    <stop offset="68%" stopColor="#FFF7EA" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#F9DFC0" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id={`${uid}-cloud-tl-shade`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.72" />
                    <stop offset="62%" stopColor="#F6CFA5" stopOpacity="0.48" />
                    <stop offset="100%" stopColor="#F6CFA5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Soft rear cloud puff */}
                <path
                  d="M28 118 C28 96 48 80 74 82 C88 54 122 36 160 40 C196 44 222 64 234 86 C256 76 286 80 304 98 C328 96 352 104 364 118 L364 134 L28 134 Z"
                  fill={`url(#${uid}-cloud-tl-shade)`}
                />
                {/* Crisp luminous foreground cloud silhouette */}
                <path
                  d="M10 124 C10 100 32 82 62 84 C74 56 106 38 144 44 C166 22 208 18 238 38 C264 34 292 48 304 72 C328 66 356 78 368 98 C394 96 420 108 434 124 L434 146 L10 146 Z"
                  fill={`url(#${uid}-cloud-tl-top)`}
                />
              </svg>
            </div>

            {/* Upper-right calm billowing cloud bank */}
            <div className="sunset-cloud-drift-right absolute -right-12 top-28 w-[235px] sm:-right-8 sm:top-26 sm:w-[360px] lg:-right-4 lg:top-30 lg:w-[460px]">
              <svg viewBox="0 0 480 155" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-cloud-tr-top`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                    <stop offset="68%" stopColor="#FFF7EA" stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#F9DFC0" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id={`${uid}-cloud-tr-shade`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.72" />
                    <stop offset="62%" stopColor="#F6CFA5" stopOpacity="0.48" />
                    <stop offset="100%" stopColor="#F6CFA5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Soft rear cloud puff */}
                <path
                  d="M116 118 C128 102 152 94 176 96 C194 78 224 72 248 84 C262 58 294 38 330 40 C366 42 396 62 408 86 C432 84 452 98 452 118 L452 136 L116 136 Z"
                  fill={`url(#${uid}-cloud-tr-shade)`}
                />
                {/* Crisp luminous foreground cloud silhouette */}
                <path
                  d="M42 124 C56 106 84 94 112 96 C126 76 154 66 180 72 C194 46 226 32 256 38 C286 16 330 22 354 46 C388 42 420 60 432 86 C454 84 470 100 470 124 L470 146 L42 146 Z"
                  fill={`url(#${uid}-cloud-tr-top)`}
                />
              </svg>
            </div>

            {/* Mid-left gentle horizon cloud wisp gliding behind the left ridge */}
            <div className="sunset-cloud-drift-mid absolute -left-6 bottom-[255px] w-[205px] opacity-90 sm:left-[2%] sm:bottom-[305px] sm:w-[300px] lg:left-[4%] lg:bottom-[348px] lg:w-[375px]">
              <svg viewBox="0 0 380 105" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-cloud-horizon-l`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.9" />
                    <stop offset="65%" stopColor="#FDE4C3" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#FAD3A0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 82 C20 64 44 54 70 58 C86 38 118 28 148 36 C172 20 212 22 234 42 C258 38 284 48 296 64 C322 62 348 70 366 84 L366 98 L12 98 Z"
                  fill={`url(#${uid}-cloud-horizon-l)`}
                />
              </svg>
            </div>

            {/* Mid-right gentle horizon cloud wisp gliding behind the right ridge */}
            <div className="sunset-cloud-drift-right absolute -right-6 bottom-[248px] w-[205px] opacity-90 sm:right-[2%] sm:bottom-[298px] sm:w-[300px] lg:right-[4%] lg:bottom-[340px] lg:w-[375px]">
              <svg viewBox="0 0 380 105" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-cloud-horizon-r`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.9" />
                    <stop offset="65%" stopColor="#FDE4C3" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#FAD3A0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M14 84 C32 70 58 62 84 64 C96 46 124 38 148 42 C170 22 210 20 234 36 C264 28 296 38 312 58 C338 54 360 64 368 82 L368 98 L14 98 Z"
                  fill={`url(#${uid}-cloud-horizon-r)`}
                />
              </svg>
            </div>
          </div>

          {/* SHOOTING STARS (BINTANG JATUH): Subtle diagonal golden meteor streaks in open upper sky */}
          <div
            data-hero-shooting-stars
            className="pointer-events-none absolute inset-x-0 top-12 h-[42%] overflow-hidden"
          >
            {/* Upper-left diagonal golden meteor */}
            <div className="hero-meteor-streak-a absolute left-[6%] top-[6%] w-[155px] sm:left-[12%] sm:top-[8%] sm:w-[220px]">
              <svg viewBox="0 0 220 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-meteor-gold-a`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0" />
                    <stop offset="48%" stopColor="#D97706" stopOpacity="0.62" />
                    <stop offset="84%" stopColor="#F59E0B" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FFFBEB" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <polygon points="8,8 194,76 190,81 5,11" fill={`url(#${uid}-meteor-gold-a)`} />
                <circle cx="195" cy="78" r="9" fill="#FDE68A" fillOpacity="0.55" />
                <path d={fourPointStarPath(195, 78, 6.8)} fill="#B45309" />
                <circle cx="195" cy="78" r="2.2" fill="#FFFBEB" />
              </svg>
            </div>

            {/* Upper-right diagonal amber meteor */}
            <div className="hero-meteor-streak-b absolute right-[6%] top-[10%] w-[140px] sm:right-[11%] sm:top-[10%] sm:w-[198px]">
              <svg viewBox="0 0 200 88" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
                <defs>
                  <linearGradient id={`${uid}-meteor-gold-b`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#B45309" stopOpacity="0" />
                    <stop offset="48%" stopColor="#C26A08" stopOpacity="0.58" />
                    <stop offset="84%" stopColor="#F59E0B" stopOpacity="0.92" />
                    <stop offset="100%" stopColor="#FFFBEB" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <polygon points="192,8 22,72 26,77 195,11" fill={`url(#${uid}-meteor-gold-b)`} />
                <circle cx="22" cy="74" r="8" fill="#FDE68A" fillOpacity="0.52" />
                <path d={fourPointStarPath(22, 74, 6)} fill="#B45309" />
                <circle cx="22" cy="74" r="1.9" fill="#FFFBEB" />
              </svg>
            </div>
          </div>

          {/* DISTANT FLYING BIRDS (BURUNG): Graceful tiny silhouettes gliding cleanly across the dusk sky */}
          <div
            data-hero-birds
            className="pointer-events-none absolute inset-x-0 top-16 h-[50%] overflow-hidden"
          >
            {/* Left-to-mid distant 3-bird flock gliding smoothly in front of upper clouds */}
            <div className="hero-sky-bird-a absolute left-[8%] top-[24%] w-[112px] sm:left-[12%] sm:top-[22%] sm:w-[148px]">
              <svg viewBox="0 0 150 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full text-[#5C1A15]">
                <g className="hero-bird-flap" style={{ transformOrigin: "82px 24px" }}>
                  <path
                    d="M64 25 Q73 16 82 23 Q91 16 100 25 Q91 21 82 26 Q73 21 64 25 Z"
                    fill="currentColor"
                    fillOpacity="0.72"
                  />
                </g>
                <g className="hero-bird-flap" style={{ transformOrigin: "44px 36px", animationDelay: "-0.45s" }}>
                  <path
                    d="M31 37 Q37.5 30.5 44 35.5 Q50.5 30.5 57 37 Q50.5 34 44 38 Q37.5 34 31 37 Z"
                    fill="currentColor"
                    fillOpacity="0.58"
                  />
                </g>
                <g className="hero-bird-flap" style={{ transformOrigin: "118px 34px", animationDelay: "-0.9s" }}>
                  <path
                    d="M107 35 Q112.5 29.5 118 33.8 Q123.5 29.5 129 35 Q123.5 32.5 118 35.8 Q112.5 32.5 107 35 Z"
                    fill="currentColor"
                    fillOpacity="0.48"
                  />
                </g>
              </svg>
            </div>

            {/* Right distant 2-bird pair gliding gently above eastern ridge */}
            <div className="hero-sky-bird-b absolute right-[8%] top-[34%] w-[92px] sm:right-[13%] sm:top-[30%] sm:w-[124px]">
              <svg viewBox="0 0 124 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full text-[#5C1A15]">
                <g className="hero-bird-flap" style={{ transformOrigin: "46px 20px", animationDelay: "-0.3s" }}>
                  <path
                    d="M30 21 Q38 13.5 46 19.5 Q54 13.5 62 21 Q54 17.5 46 22 Q38 17.5 30 21 Z"
                    fill="currentColor"
                    fillOpacity="0.64"
                  />
                </g>
                <g className="hero-bird-flap" style={{ transformOrigin: "86px 30px", animationDelay: "-0.85s" }}>
                  <path
                    d="M74 31 Q80 25 86 29.5 Q92 25 98 31 Q92 28.5 86 31.8 Q80 28.5 74 31 Z"
                    fill="currentColor"
                    fillOpacity="0.48"
                  />
                </g>
              </svg>
            </div>
          </div>

          {/* LAYER 1: Golden sunset prism behind Merapi + 100% SOLID OPAQUE far Merapi & sister peaks */}
          <div
            data-parallax-layer="1"
            className="pointer-events-none absolute inset-x-0 -bottom-24 h-[430px] overflow-hidden will-change-transform sm:h-[510px] lg:-bottom-28 lg:h-[590px]"
          >
            <svg
              viewBox="0 0 1440 600"
              preserveAspectRatio="xMidYMax slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 h-full w-full"
            >
              <defs>
                {/* Sky light effects (transparent fade OK: sky only, never mountain bodies) */}
                <linearGradient id={`${uid}-sky-ray`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0" />
                  <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id={`${uid}-sun-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.88" />
                  <stop offset="52%" stopColor="#F59E0B" stopOpacity="0.52" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.18" />
                </linearGradient>
                <linearGradient id={`${uid}-plume-poly`} x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#D97706" stopOpacity="0.28" />
                  <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#FFF8EE" stopOpacity="0" />
                </linearGradient>

                {/* 100% OPAQUE far mountain gradients (warm sunset atmospheric depth baked into solid hex) */}
                <linearGradient id={`${uid}-merapi-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D47A38" stopOpacity="1" />
                  <stop offset="48%" stopColor="#943927" stopOpacity="1" />
                  <stop offset="100%" stopColor="#581A16" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-merapi-shade`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#86362A" stopOpacity="1" />
                  <stop offset="52%" stopColor="#5C1D19" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-merapi-far-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C97D52" stopOpacity="1" />
                  <stop offset="55%" stopColor="#8E4133" stopOpacity="1" />
                  <stop offset="100%" stopColor="#561E19" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-merapi-far-shade`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9B5041" stopOpacity="1" />
                  <stop offset="55%" stopColor="#6A2620" stopOpacity="1" />
                  <stop offset="100%" stopColor="#431311" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Delicate faceted golden light rays */}
              <polygon points="720,255 210,0 440,0" fill={`url(#${uid}-sky-ray)`} opacity="0.4" />
              <polygon points="720,255 590,0 850,0" fill={`url(#${uid}-sky-ray)`} opacity="0.5" />
              <polygon points="720,255 1000,0 1230,0" fill={`url(#${uid}-sky-ray)`} opacity="0.4" />

              {/* Faceted burnished-gold sun prism behind Merapi */}
              <polygon
                points="720,152 792,182 822,254 792,326 720,356 648,326 618,254 648,182"
                fill={`url(#${uid}-sun-lit)`}
                opacity="0.34"
              />
              <polygon
                points="720,178 772,202 794,254 772,306 720,330 668,306 646,254 668,202"
                fill={`url(#${uid}-sun-lit)`}
                opacity="0.7"
              />
              <polygon points="720,178 772,202 720,254" fill="#FEF3C7" fillOpacity="0.42" />
              <polygon points="720,178 668,202 720,254" fill="#FDE68A" fillOpacity="0.3" />

              {/* Geometric crater plume */}
              <polygon points="720,152 746,126 782,122 752,146" fill={`url(#${uid}-plume-poly)`} />
              <polygon points="746,126 788,96 838,88 782,122" fill={`url(#${uid}-plume-poly)`} opacity="0.78" />
              <polygon points="788,96 842,66 894,70 838,88" fill={`url(#${uid}-plume-poly)`} opacity="0.45" />

              {/* Continuous 100% OPAQUE far mountain base silhouette extending all the way to y=600 */}
              <polygon
                data-mountain-base="layer-1"
                points="0,326 164,240 296,304 368,328 556,224 718,148 864,224 956,294 1146,190 1324,242 1440,294 1440,600 0,600"
                fill={`url(#${uid}-merapi-shade)`}
              />

              {/* Solid opaque faceted Mount Merapi & sister volcanic peaks */}
              <polygon points="0,326 164,240 210,368 0,600" fill={`url(#${uid}-merapi-far-shade)`} />
              <polygon points="164,240 296,304 368,328 368,600 210,368" fill={`url(#${uid}-merapi-far-lit)`} />
              <polygon points="368,328 556,224 718,148 676,386 368,600" fill={`url(#${uid}-merapi-lit)`} />
              <polygon points="556,224 718,148 658,256 482,318" fill="#E08A3A" />
              <polygon points="718,148 864,224 1052,334 1052,600 676,600 676,386" fill={`url(#${uid}-merapi-shade)`} />
              <polygon points="718,148 784,218 730,286 676,386" fill="#6E201C" />
              <polygon points="956,294 1146,190 1116,388 956,600" fill={`url(#${uid}-merapi-far-lit)`} />
              <polygon points="1146,190 1324,242 1440,294 1440,600 1116,600 1116,388" fill={`url(#${uid}-merapi-far-shade)`} />
            </svg>
          </div>

          {/* LAYER 2: 100% SOLID OPAQUE mid-range faceted hills (continuous central saddle behind Gunungan) + Candi & Joglo */}
          <div
            data-parallax-layer="2"
            className="pointer-events-none absolute inset-x-0 -bottom-20 h-[420px] overflow-hidden will-change-transform sm:h-[500px] lg:h-[580px]"
          >
            <svg
              viewBox="0 0 1440 580"
              preserveAspectRatio="xMidYMax slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 h-full w-full"
            >
              <defs>
                {/* 100% OPAQUE mid-ground mountain gradients */}
                <linearGradient id={`${uid}-mid-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C96A1E" stopOpacity="1" />
                  <stop offset="46%" stopColor="#7C1D1D" stopOpacity="1" />
                  <stop offset="100%" stopColor="#440F0E" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-mid-shade`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6D1815" stopOpacity="1" />
                  <stop offset="55%" stopColor="#4A0D0D" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-mid-valley`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#581412" stopOpacity="1" />
                  <stop offset="55%" stopColor="#420D0C" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-candi-poly`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6D1815" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Continuous 100% OPAQUE mid-range base silhouette bridging solidly behind Gunungan down to y=580 */}
              <polygon
                data-mountain-base="layer-2"
                points="0,298 188,246 356,304 552,232 674,310 720,326 766,310 924,226 1084,294 1252,248 1440,292 1440,580 0,580"
                fill={`url(#${uid}-mid-valley)`}
              />

              {/* Left mid-range faceted ridge (100% opaque) */}
              <polygon points="0,298 188,246 356,304 186,412 0,412" fill={`url(#${uid}-mid-lit)`} />
              <polygon points="188,246 356,304 492,262 342,398 186,412" fill={`url(#${uid}-mid-shade)`} />
              <polygon points="356,304 552,232 674,310 510,418 342,398" fill={`url(#${uid}-mid-lit)`} />
              <polygon points="552,232 674,310 592,356 472,316" fill="#B24A16" />

              {/* Center saddle facets bridging directly behind Gunungan (100% opaque, zero gap) */}
              <polygon points="674,310 720,326 668,424 510,418" fill={`url(#${uid}-mid-shade)`} />
              <polygon points="720,326 766,310 904,418 668,424" fill={`url(#${uid}-mid-valley)`} />

              {/* Right mid-range faceted ridge (100% opaque) */}
              <polygon points="766,310 924,226 1084,294 904,418" fill={`url(#${uid}-mid-lit)`} />
              <polygon points="924,226 1084,294 1252,248 1106,418 904,418" fill={`url(#${uid}-mid-shade)`} />
              <polygon points="1084,294 1252,248 1440,292 1440,580 1106,580 1106,418" fill={`url(#${uid}-mid-lit)`} />

              {/* Solid grounded deep-maroon lower apron extending cleanly to y=580 */}
              <polygon points="0,398 1440,388 1440,580 0,580" fill={`url(#${uid}-mid-shade)`} />

              {/* Crisp geometric low-poly Candi Borobudur / Prambanan silhouette (left ridge) */}
              <g fill={`url(#${uid}-candi-poly)`}>
                <polygon points="164,312 326,312 314,292 176,292" />
                <polygon points="186,292 304,292 294,278 196,278" />
                <polygon points="208,278 282,278 274,266 216,266" />
                <polygon points="228,266 245,222 262,266" />
                <polygon points="245,222 262,266 245,266" fill="#3B0D0C" />
                <polygon points="242,222 245,204 248,222" fill="#F59E0B" />
                <polygon points="196,278 208,248 220,278" />
                <polygon points="270,278 282,248 294,278" />
                <polygon points="174,292 183,270 192,292" />
                <polygon points="298,292 307,270 316,292" />
              </g>

              {/* Crisp geometric low-poly Javanese Joglo Pendopo silhouette (right ridge) */}
              <g>
                <polygon points="1188,282 1218,300 1188,314 1158,300" fill="#D97706" />
                <polygon points="1188,288 1204,300 1188,308 1172,300" fill="#FEF3C7" />
                <polygon points="1126,298 1166,274 1188,274 1146,298" fill="#6D1815" />
                <polygon points="1188,274 1210,274 1250,298 1230,298" fill="#3B0D0C" />
                <polygon points="1166,274 1180,236 1188,236 1188,274" fill="#8C2618" />
                <polygon points="1188,236 1196,236 1210,274 1188,274" fill="#3B0D0C" />
                <polygon points="1185,236 1188,224 1191,236" fill="#F59E0B" />
                <rect x="1152" y="296" width="5" height="22" fill="#3B0D0C" />
                <rect x="1174" y="296" width="5" height="22" fill="#3B0D0C" />
                <rect x="1197" y="296" width="5" height="22" fill="#3B0D0C" />
                <rect x="1219" y="296" width="5" height="22" fill="#3B0D0C" />
                <polygon points="1142,316 1234,316 1242,328 1134,328" fill="#3B0D0C" />
              </g>
            </svg>
          </div>

          {/* LAYER 3: 100% SOLID OPAQUE near low-poly amphitheater ridge + Faceted Gunungan Kayon */}
          <div
            data-parallax-layer="3"
            className="pointer-events-none absolute inset-x-0 -bottom-16 h-[400px] overflow-hidden will-change-transform sm:h-[480px] lg:h-[560px]"
          >
            <svg
              viewBox="0 0 1440 560"
              preserveAspectRatio="xMidYMax slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 h-full w-full"
            >
              <defs>
                <linearGradient id={`${uid}-near-lit`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9A3412" stopOpacity="1" />
                  <stop offset="52%" stopColor="#5C1513" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-near-deep`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#5C1513" stopOpacity="1" />
                  <stop offset="58%" stopColor="#3B0D0C" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-ridge-gold`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
                  <stop offset="28%" stopColor="#FDE68A" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.95" />
                  <stop offset="72%" stopColor="#FDE68A" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${uid}-kayon-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="1" />
                  <stop offset="48%" stopColor="#F59E0B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Continuous 100% OPAQUE near ridge base silhouette down to y=560 */}
              <polygon
                data-mountain-base="layer-3"
                points="0,318 148,258 314,312 464,364 624,386 720,394 816,386 976,364 1126,312 1292,258 1440,318 1440,560 0,560"
                fill="#3B0D0C"
              />

              <polygon points="0,318 148,258 314,312 184,426 0,426" fill={`url(#${uid}-near-lit)`} />
              <polygon points="148,258 314,312 464,364 184,426" fill={`url(#${uid}-near-deep)`} />
              <polygon points="314,312 464,364 624,386 436,460 184,426" fill="#4A0D0D" />

              <polygon points="1440,318 1292,258 1126,312 1256,426 1440,426" fill={`url(#${uid}-near-deep)`} />
              <polygon points="1292,258 1126,312 976,364 1256,426" fill={`url(#${uid}-near-lit)`} />
              <polygon points="1126,312 976,364 816,386 1004,460 1256,426" fill="#3B0D0C" />

              <polygon points="0,426 436,460 624,386 720,394 816,386 1004,460 1440,426 1440,560 0,560" fill={`url(#${uid}-near-deep)`} />
              <polygon points="624,386 720,394 720,560 436,460" fill="#4A0D0D" />
              <polygon points="816,386 720,394 720,560 1004,460" fill="#3B0D0C" />

              <polyline
                points="148,258 314,312 464,364 624,386 720,394 816,386 976,364 1126,312 1292,258"
                stroke={`url(#${uid}-ridge-gold)`}
                strokeWidth="2.2"
                fill="none"
              />

              {/* Subtle golden aura behind central Gunungan Kayon (backed by 100% solid Layer 2 mountain) */}
              <polygon points="720,236 804,336 720,432 636,336" fill="#F59E0B" fillOpacity="0.2" />

              {/* Centerpiece: Crisp Faceted Low-Poly Gunungan Kayon */}
              <g>
                <polygon points="720,248 774,344 756,416 720,444 720,248" fill="#3B0D0C" />
                <polygon points="720,248 666,344 684,416 720,444 720,248" fill="#6D1815" />
                <polygon points="720,248 748,302 720,322 692,302" fill="#8C2618" />
                <polygon points="720,248 720,322 692,302" fill="#B45309" />
                <polygon points="720,362 678,334 690,378" fill={`url(#${uid}-kayon-gold)`} fillOpacity="0.92" />
                <polygon points="720,362 762,334 750,378" fill="#F59E0B" fillOpacity="0.78" />
                <polygon points="720,334 688,308 698,342" fill="#FDE68A" fillOpacity="0.86" />
                <polygon points="720,334 752,308 742,342" fill="#F59E0B" fillOpacity="0.7" />
                <polygon points="720,276 726,334 720,398 714,334" fill={`url(#${uid}-kayon-gold)`} />
                <polygon points="704,420 712,398 728,398 736,420" fill="#D97706" />
                <polygon points="713,420 716,406 724,406 727,420" fill="#FEF3C7" />
                <polygon
                  points="720,248 774,344 756,416 720,444 684,416 666,344"
                  stroke={`url(#${uid}-kayon-gold)`}
                  strokeWidth="2"
                  fill="none"
                />
              </g>
            </svg>
          </div>

          {/* LAYER 4: Foreground 100% SOLID OPAQUE Deep Royal Maroon (#3B0D0C) terraces meeting Band A */}
          <div
            data-parallax-layer="4"
            className="pointer-events-none absolute inset-x-0 -bottom-10 h-[340px] overflow-hidden will-change-transform sm:h-[420px] lg:h-[500px]"
          >
            <svg
              viewBox="0 0 1440 500"
              preserveAspectRatio="xMidYMax slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 h-full w-full"
            >
              <defs>
                <linearGradient id={`${uid}-fore-left`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5C1513" stopOpacity="1" />
                  <stop offset="58%" stopColor="#3B0D0C" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
                <linearGradient id={`${uid}-fore-right`} x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4A0D0D" stopOpacity="1" />
                  <stop offset="58%" stopColor="#3B0D0C" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3B0D0C" stopOpacity="1" />
                </linearGradient>
              </defs>

              <polygon points="0,318 118,354 248,408 248,500 0,500" fill={`url(#${uid}-fore-left)`} />
              <polygon points="0,318 118,354 68,412 0,396" fill="#631714" />
              <polygon points="118,354 248,408 424,442 424,500 224,500" fill="#3B0D0C" />
              <polyline points="0,318 118,354 248,408 424,442" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />

              <polygon points="1440,318 1322,354 1192,408 1192,500 1440,500" fill={`url(#${uid}-fore-right)`} />
              <polygon points="1440,318 1322,354 1372,412 1440,396" fill="#521311" />
              <polygon points="1322,354 1192,408 1016,442 1016,500 1216,500" fill="#3B0D0C" />
              <polyline points="1440,318 1322,354 1192,408 1016,442" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />

              {/* Grounded solid Surface B (#3B0D0C) base extending cleanly past viewport edge to y=500 */}
              <polygon data-mountain-base="layer-4" points="0,434 1440,434 1440,500 0,500" fill="#3B0D0C" />
            </svg>
          </div>
        </div>

        {/* Static bottom seam anchor so parallax movement never exposes a gap above the maroon ticker strip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent via-[#3B0D0C]/80 to-[#3B0D0C]"
        />

        {/* ===================== FOREGROUND CONTENT ===================== */}
        <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* FIXED-HEIGHT SEQUENTIAL CHOREOGRAPHY STAGE (Beat 1: SILATARA Logo <-> Beat 2: Kinetic Headline + Subtitle, ZERO layout shift) */}
            <div data-parallax-layer="3" className="w-full will-change-transform">
              {shouldReduceMotion ? (
                <div
                  data-hero-stage
                  data-hero-phase="reduced-motion"
                  className="flex min-h-[260px] w-full flex-col items-center justify-center gap-5"
                >
                  <div
                    role="img"
                    aria-label="SILATARA"
                    style={logoBgStyle}
                    className="h-[74px] w-[282px] drop-shadow-[0_12px_26px_rgba(59,13,12,0.2)] sm:h-[92px] sm:w-[350px]"
                  />
                  <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-5xl md:text-[3.5rem] md:leading-[1.08]">
                    Warisan Gerak,{" "}
                    <span className="bg-gradient-to-r from-[#3B0D0C] via-[#C2410C] to-[#F59E0B] bg-clip-text text-transparent">
                      Generasi Bergerak
                    </span>
                  </h1>
                  <p className="max-w-2xl text-balance text-sm font-medium leading-relaxed text-[#3B0D0C]/85 sm:text-lg">
                    Kenali kekayaan pencak silat Nusantara, pelajari geraknya fase demi fase dari peraga 3D, dan berlatih di depan kamera dengan umpan balik pribadi langsung di perangkat Anda.
                  </p>
                </div>
              ) : (
                <div
                  data-hero-stage
                  data-hero-phase={phase}
                  className="relative flex min-h-[280px] w-full items-center justify-center sm:min-h-[290px] md:min-h-[305px]"
                >
                  {/* BEAT 1: LARGE PROMINENT OFFICIAL SILATARA LOGO WITH GOLDEN HALO, FLOAT & METALLIC SHIMMER */}
                  <motion.div
                    initial={false}
                    animate={
                      isLogo
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: -16, scale: 0.94 }
                    }
                    transition={{
                      duration: isLogo ? 0.72 : 0.5,
                      delay: isLogo ? 0.14 : 0,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`absolute inset-0 flex flex-col items-center justify-center ${
                      isLogo ? "" : "pointer-events-none"
                    }`}
                  >
                    <div className="hero-fade-up relative flex flex-col items-center">
                      {/* Warm amber-gold radial halo aura behind logo */}
                      <div
                        aria-hidden="true"
                        className="hero-logo-halo pointer-events-none absolute -inset-x-12 -inset-y-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.34)_0%,rgba(217,119,6,0.14)_46%,transparent_72%)] blur-xl"
                      />

                      {/* Delicate flanking golden diamond sparkle glints */}
                      <svg
                        viewBox="0 0 28 28"
                        fill="none"
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-8 top-2 hidden h-5 w-5 text-[#D97706]/85 sm:block"
                      >
                        <path d="M14 2L16.4 11.6L26 14L16.4 16.4L14 26L11.6 16.4L2 14L11.6 11.6L14 2Z" fill="currentColor" />
                      </svg>
                      <svg
                        viewBox="0 0 28 28"
                        fill="none"
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-8 bottom-3 hidden h-4 w-4 text-[#F59E0B]/90 sm:block"
                      >
                        <path d="M14 2L16.4 11.6L26 14L16.4 16.4L14 26L11.6 16.4L2 14L11.6 11.6L14 2Z" fill="currentColor" />
                      </svg>

                      {/* Floating authentic SILATARA brand wordmark (CSS mask shimmer, crisp 934x245 ratio) */}
                      <div className="hero-logo-float relative">
                        <div
                          role="img"
                          aria-label="SILATARA"
                          style={logoBgStyle}
                          className="relative h-[82px] w-[312px] drop-shadow-[0_14px_30px_rgba(59,13,12,0.22)] sm:h-[112px] sm:w-[426px] md:h-[132px] md:w-[504px]"
                        >
                          {/* Metallic gold glint ribbon clipped strictly to the SILATARA letterforms */}
                          <div
                            aria-hidden="true"
                            style={logoMaskStyle}
                            className="pointer-events-none absolute inset-0 overflow-hidden"
                          >
                            <span className="hero-gold-sweep block h-full w-[42%] bg-gradient-to-r from-transparent via-[#FEF3C7]/85 to-transparent" />
                          </div>
                        </div>
                      </div>

                      {/* Refined golden illumination line beneath the emblem */}
                      <motion.div
                        aria-hidden="true"
                        initial={false}
                        animate={isLogo ? { scaleX: 1, opacity: 1 } : { scaleX: 0.25, opacity: 0 }}
                        transition={{ duration: 0.68, delay: isLogo ? 0.22 : 0, ease: [0.22, 1, 0.36, 1] }}
                        className="mt-4 h-[2.5px] w-48 origin-center rounded-full bg-gradient-to-r from-transparent via-[#D97706]/85 to-transparent sm:w-64"
                      />
                    </div>
                  </motion.div>

                  {/* BEAT 2: KINETIC EDITORIAL HEADLINE + SUBTITLE UNFOLDING INTO THE SAME CENTERED STAGE */}
                  <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.97 }}
                    animate={
                      isHeadline
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: -14, scale: 0.97 }
                    }
                    transition={{
                      duration: isHeadline ? 0.64 : 0.46,
                      delay: isHeadline ? 0.16 : 0,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`absolute inset-0 flex flex-col items-center justify-center ${
                      isHeadline ? "" : "pointer-events-none"
                    }`}
                  >
                    <h1 className="text-balance text-4xl font-extrabold tracking-tight text-[#3B0D0C] sm:text-5xl md:text-[3.75rem] md:leading-[1.08]">
                      <span className="block">
                        {LINE_ONE_WORDS.map((word, index) => (
                          <Fragment key={word}>
                            <span className="inline-block overflow-hidden pb-1 align-bottom">
                              <motion.span
                                initial={{ y: "92%", opacity: 0 }}
                                animate={
                                  isHeadline
                                    ? { y: "0%", opacity: 1 }
                                    : { y: "-32%", opacity: 0 }
                                }
                                transition={{
                                  duration: isHeadline ? 0.62 : 0.38,
                                  delay: isHeadline ? 0.18 + index * 0.085 : 0,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="inline-block drop-shadow-[0_2px_10px_rgba(59,13,12,0.08)]"
                              >
                                {word}
                              </motion.span>
                            </span>
                            {index < LINE_ONE_WORDS.length - 1 ? " " : null}
                          </Fragment>
                        ))}
                      </span>

                      <span className="relative mt-0.5 inline-block">
                        <span className="sr-only"> </span>
                        {LINE_TWO_WORDS.map((word, index) => (
                          <Fragment key={word}>
                            <span className="inline-block overflow-hidden pb-1.5 align-bottom">
                              <motion.span
                                initial={{ y: "96%", opacity: 0 }}
                                animate={
                                  isHeadline
                                    ? { y: "0%", opacity: 1 }
                                    : { y: "-32%", opacity: 0 }
                                }
                                transition={{
                                  duration: isHeadline ? 0.66 : 0.38,
                                  delay: isHeadline ? 0.32 + index * 0.095 : 0,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="hero-headline-shimmer inline-block bg-clip-text text-transparent"
                              >
                                {word}
                              </motion.span>
                            </span>
                            {index < LINE_TWO_WORDS.length - 1 ? " " : null}
                          </Fragment>
                        ))}

                        {/* Kinetic burnished-gold brush accent line sweeping under Generasi Bergerak */}
                        <motion.span
                          aria-hidden="true"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={isHeadline ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                          transition={{
                            duration: isHeadline ? 0.72 : 0.34,
                            delay: isHeadline ? 0.46 : 0,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="mx-auto mt-1 block h-[3px] w-full max-w-[18rem] origin-left rounded-full bg-gradient-to-r from-[#3B0D0C]/80 via-[#C2410C] to-[#F59E0B] sm:max-w-[24rem]"
                        />
                      </span>
                    </h1>

                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={isHeadline ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
                      transition={{
                        duration: isHeadline ? 0.58 : 0.34,
                        delay: isHeadline ? 0.42 : 0,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="mt-4 max-w-2xl text-balance text-sm font-medium leading-relaxed text-[#3B0D0C]/85 sm:mt-5 sm:text-lg"
                    >
                      Kenali kekayaan pencak silat Nusantara, pelajari geraknya fase demi fase dari peraga 3D, dan berlatih di depan kamera dengan umpan balik pribadi langsung di perangkat Anda.
                    </motion.p>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Subtle 2-beat cadence indicator (Logo <-> Headline) */}
            {!shouldReduceMotion && (
              <div aria-hidden="true" className="mt-2 flex items-center justify-center gap-2">
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    phase === "logo"
                      ? "w-8 bg-gradient-to-r from-[#3B0D0C] via-[#9A3412] to-[#D97706]"
                      : "w-2 bg-[#3B0D0C]/25"
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    phase === "headline"
                      ? "w-8 bg-gradient-to-r from-[#3B0D0C] via-[#9A3412] to-[#D97706]"
                      : "w-2 bg-[#3B0D0C]/25"
                  }`}
                />
              </div>
            )}

            <div className="hero-fade-up mt-6 flex flex-wrap items-center justify-center gap-3.5 sm:mt-7 sm:gap-4">
              <Link
                href="/library"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3B0D0C] via-[#6D1815] to-[#B45309] px-7 py-3.5 text-sm font-semibold text-[#FFF8EE] shadow-md shadow-[#3B0D0C]/25 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg sm:px-8 sm:text-base"
              >
                <span>Jelajahi Pustaka Gerakan</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href={practiceHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#3B0D0C]/25 bg-[#FFF8EE]/95 px-7 py-3.5 text-sm font-semibold text-[#3B0D0C] shadow-xs backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[#3B0D0C]/45 hover:bg-white hover:shadow-md sm:px-8 sm:text-base"
              >
                <Camera aria-hidden="true" className="h-4 w-4 text-[#B45309]" />
                <span>Coba Latihan Kamera</span>
              </Link>
            </div>
          </div>
        </div>
      </ParallaxLayerStage>
    </section>
  );
}
