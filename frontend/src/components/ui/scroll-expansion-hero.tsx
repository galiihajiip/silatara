"use client";

/**
 * ScrollExpandMedia
 * Framer Motion scroll-expansion stage anchored on Surface B (#3B0D0C Deep Royal
 * Maroon Batik with gold Batik Parang & bottom Batik Tumpal trim) so the landing
 * page strictly maintains its 2-color Batik surface system.
 *
 * Layout invariants:
 * - overflow-x-clip on section and split-title wrapper guarantees
 *   document.documentElement.scrollWidth <= window.innerWidth at 390px and 1280px.
 * - mode="page-scroll" (default) NEVER calls window.scrollTo(0, 0) or traps scroll.
 * - mode="wheel-lock" remains supported optionally via prop without listener churn.
 * - Numeric maxWidth / height transforms ensure butter-smooth 60fps interpolation.
 * - prefers-reduced-motion shows the expanded panorama statically.
 * - Decorative media uses alt="" for axe-core compliance.
 */

import React, { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { BatikParangPattern, BatikTumpalBand } from "@/components/JavaneseMotifs";

export interface ScrollExpandMediaProps {
  /** Type of main media to display */
  mediaType?: "video" | "image";
  /** Source URL for the main media (image or video) */
  mediaSrc: string;
  /** Poster image for video, or override thumbnail */
  posterSrc?: string;
  /** Background faceted low-poly artwork shown behind the expanding frame */
  bgImageSrc: string;
  /** Large display title (first word + rest split horizontally on scroll) */
  title?: string;
  /** Small eyebrow label above the title */
  date?: string;
  /** Subtle caption pill anchored inside the bottom of the expanding media stage */
  mediaCaption?: string;
  /** Hint text shown below the compact card while unexpanded */
  scrollToExpand?: string;
  /** Whether the title blends softly with the background artwork */
  textBlend?: boolean;
  /** Scroll mode: page-scroll uses native scroll; wheel-lock intercepts wheel/touch events */
  mode?: "page-scroll" | "wheel-lock";
  /** Content revealed smoothly below the expanding stage */
  children?: React.ReactNode;
  className?: string;
}

export function ScrollExpandMedia({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title = "Panggung Padepokan Nusantara",
  date,
  mediaCaption,
  scrollToExpand,
  textBlend = false,
  mode = "page-scroll",
  children,
  className = "",
}: ScrollExpandMediaProps) {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Page-scroll progress: 0 as section enters lower viewport -> 1 as stage centers comfortably
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 88%", "center 54%"],
  });

  // Standalone wheel-lock progress (only active when mode === "wheel-lock")
  const wheelMotion = useMotionValue(shouldReduceMotion ? 1 : 0);
  const wheelProgressRef = useRef(shouldReduceMotion ? 1 : 0);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      wheelProgressRef.current = 1;
      wheelMotion.set(1);
    }
  }, [shouldReduceMotion, wheelMotion]);

  useEffect(() => {
    if (mode !== "wheel-lock" || shouldReduceMotion) return;

    const updateProgress = (delta: number) => {
      const next = Math.min(Math.max(wheelProgressRef.current + delta, 0), 1);
      wheelProgressRef.current = next;
      wheelMotion.set(next);
    };

    const handleWheel = (e: WheelEvent) => {
      if (
        wheelProgressRef.current < 1 ||
        (e.deltaY < 0 && window.scrollY <= 5)
      ) {
        e.preventDefault();
        updateProgress(e.deltaY * 0.0012);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const currentY = e.touches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      if (
        wheelProgressRef.current < 1 ||
        (deltaY < 0 && window.scrollY <= 5)
      ) {
        e.preventDefault();
        updateProgress(deltaY * 0.004);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mode, shouldReduceMotion, wheelMotion]);

  const activeProgress = mode === "wheel-lock" ? wheelMotion : scrollYProgress;

  // Pure numeric pixel transforms inside responsive stage: 60fps interpolation, zero overflow
  const frameMaxWidth = useTransform(
    activeProgress,
    [0, 1],
    shouldReduceMotion ? [1140, 1140] : [360, 1140],
  );
  const frameHeight = useTransform(
    activeProgress,
    [0, 1],
    shouldReduceMotion ? [520, 520] : [250, 520],
  );
  const mediaScale = useTransform(
    activeProgress,
    [0, 1],
    shouldReduceMotion ? [1, 1] : [1.1, 1],
  );

  // Full-bleed low-poly Merapi sunset vista blooms subtly through Surface B #3B0D0C Batik
  const bgOpacity = useTransform(
    activeProgress,
    [0, 0.5, 1],
    shouldReduceMotion ? [0.42, 0.42, 0.42] : [0.22, 0.36, 0.48],
  );

  // Split title horizontal translate (strictly bounded inside overflow-x-clip)
  const titleLeftX = useTransform(
    activeProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, -16],
  );
  const titleRightX = useTransform(
    activeProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, 16],
  );

  // Scroll hint gently fades out as stage expands
  const hintOpacity = useTransform(activeProgress, [0, 0.45], [1, 0]);

  // Showcase cards stay softly legible early and rise crisply into full focus
  const childrenOpacity = useTransform(
    activeProgress,
    [0.2, 0.82],
    shouldReduceMotion ? [1, 1] : [0.45, 1],
  );
  const childrenY = useTransform(
    activeProgress,
    [0.2, 0.82],
    shouldReduceMotion ? [0, 0] : [18, 0],
  );

  const words = (title ?? "").trim().split(/\s+/).filter(Boolean);
  const firstWord = words[0] ?? "";
  const restOfTitle = words.slice(1).join(" ");

  return (
    <section
      ref={sectionRef}
      aria-label={title}
      className={`relative overflow-x-clip bg-[#3B0D0C] pb-20 pt-16 text-white sm:pb-24 sm:pt-20 ${className}`}
    >
      {/* Surface B: Subtle golden Batik Parang texture across Deep Royal Maroon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-[#FDE68A] opacity-[0.06]"
      >
        <BatikParangPattern />
      </div>

      {/* Full-bleed low-poly Merapi sunset artwork blended into #3B0D0C */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: bgOpacity }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Image
          src={bgImageSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#3B0D0C]/92 via-[#3B0D0C]/58 to-[#3B0D0C]/96" />
      </motion.div>

      {/* Bottom gold Batik Tumpal trim transitioning crisply into Surface A */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rotate-180 text-[#FDE68A] opacity-20"
      >
        <BatikTumpalBand className="h-full w-full" />
      </div>

      {/* Foreground showcase stage */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-4 sm:gap-8 sm:px-6">
        {date && (
          <div className="inline-flex max-w-full items-center justify-center gap-2 rounded-full border border-[#FDE68A]/25 bg-white/10 px-3.5 py-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#FDE68A] backdrop-blur-xs sm:px-4 sm:text-[11px] sm:tracking-[0.2em]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" aria-hidden="true" />
            <span>{date}</span>
          </div>
        )}

        {/* Split heading bounded cleanly inside overflow-x-clip */}
        {title && (
          <div className="w-full overflow-x-clip px-2 text-center">
            <h2
              className={`flex flex-wrap items-baseline justify-center gap-x-3 text-balance text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] ${
                textBlend ? "mix-blend-screen" : ""
              } text-white`}
            >
              <motion.span
                style={{ x: titleLeftX }}
                className="inline-block will-change-transform"
              >
                {firstWord}
              </motion.span>
              {restOfTitle && (
                <motion.span
                  style={{ x: titleRightX }}
                  className="inline-block bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B] bg-clip-text text-transparent will-change-transform"
                >
                  {restOfTitle}
                </motion.span>
              )}
            </h2>
          </div>
        )}

        {/* Expanding panoramic media stage */}
        <div className="flex w-full justify-center">
          <motion.div
            style={{ maxWidth: frameMaxWidth, height: frameHeight }}
            className="relative max-h-[66vh] w-full overflow-hidden rounded-[2rem] border border-[#FDE68A]/35 bg-[#2B0808] shadow-[0_24px_70px_-18px_rgba(20,4,4,0.65)] ring-1 ring-inset ring-[#FDE68A]/20 will-change-transform"
          >
            <motion.div
              style={{ scale: mediaScale }}
              className="absolute inset-0 will-change-transform"
            >
              {mediaType === "video" ? (
                <video
                  src={mediaSrc}
                  poster={posterSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-hidden="true"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={mediaSrc}
                  alt=""
                  fill
                  sizes="(min-width: 1140px) 1140px, 92vw"
                  className="object-cover object-center"
                  priority
                />
              )}
            </motion.div>

            {/* Warm cinema vignette + subtle gold edge rim */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#3B0D0C]/75 via-transparent to-[#3B0D0C]/15"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[#FDE68A]/25"
            />

            {mediaCaption && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6 sm:bottom-5">
                <span className="rounded-full border border-[#FDE68A]/30 bg-[#3B0D0C]/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-[#FEF3C7] backdrop-blur-md">
                  {mediaCaption}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll hint */}
        {scrollToExpand && !shouldReduceMotion && (
          <motion.p
            style={{ opacity: hintOpacity }}
            className="text-center text-xs font-semibold tracking-[0.16em] text-[#FDE68A]/85"
            aria-hidden="true"
          >
            {scrollToExpand}
          </motion.p>
        )}

        {/* Visual showcase cards revealed beneath the stage */}
        {children && (
          <motion.div
            style={{ opacity: childrenOpacity, y: childrenY }}
            className="w-full max-w-[1140px] will-change-transform"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
}
