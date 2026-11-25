"use client";

/**
 * LandingScrollMotion
 * Framer Motion scroll-driven reveal helpers & Wayang Kulit Pakeliran stage
 * anchored on Surface B (#3B0D0C Deep Royal Maroon Batik with gold Tumpal trim)
 * for strict 2-color Batik surface continuity across SILATARA's landing page.
 */

import React, { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { BatikTumpalBand } from "@/components/JavaneseMotifs";

function canUseInView(shouldReduceMotion: boolean | null): boolean {
  if (shouldReduceMotion) return false;
  if (typeof window !== "undefined" && typeof IntersectionObserver === "undefined") {
    return false;
  }
  return true;
}

// --- ScrollRevealSection -----------------------------------------------------

export function ScrollRevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  amount?: number | "some" | "all";
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!canUseInView(shouldReduceMotion)) {
    return <div className={className}>{children}</div>;
  }

  const variants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: "some" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- ScrollStaggerContainer & ScrollStaggerItem ------------------------------

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.03 },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};

export function ScrollStaggerContainer({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number | "some" | "all";
  as?: "div" | "ul" | "ol" | "dl";
}) {
  const shouldReduceMotion = useReducedMotion();
  const Tag = as;

  if (!canUseInView(shouldReduceMotion)) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag =
    as === "ul"
      ? motion.ul
      : as === "ol"
        ? motion.ol
        : as === "dl"
          ? motion.dl
          : motion.div;

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: "some" }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export function ScrollStaggerItem({
  children,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const shouldReduceMotion = useReducedMotion();
  const Tag = as;

  if (!canUseInView(shouldReduceMotion)) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = as === "li" ? motion.li : motion.div;

  return (
    <MotionTag variants={staggerChild} className={className}>
      {children}
    </MotionTag>
  );
}

// --- ScrollWayangParallax ----------------------------------------------------

export function ScrollWayangParallax({
  children,
  className = "",
  direction = "left",
  targetRef,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "up";
  targetRef: React.RefObject<HTMLElement | null>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const yRange = direction === "up" ? [14, -14] : [16, -16];
  const xRange =
    direction === "left" ? [12, -22] : direction === "right" ? [-12, 22] : [0, 0];

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : yRange,
  );
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : xRange,
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    shouldReduceMotion ? [0.58, 0.58, 0.58, 0.58] : [0.34, 0.65, 0.65, 0.36],
  );

  return (
    <motion.div
      aria-hidden="true"
      style={{ y, x, opacity }}
      className={`pointer-events-none select-none overflow-hidden will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

// --- BlencongGlow ------------------------------------------------------------

export function BlencongGlow({ className = "" }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  if (!canUseInView(shouldReduceMotion)) {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.38)_0%,rgba(234,88,12,0.18)_45%,transparent_72%)] opacity-40 blur-2xl ${className}`}
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0.14, scale: 0.9 }}
      whileInView={{ opacity: 0.4, scale: 1 }}
      viewport={{ once: true, amount: "some" }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      className={`pointer-events-none rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.38)_0%,rgba(234,88,12,0.18)_45%,transparent_72%)] blur-2xl will-change-transform ${className}`}
    />
  );
}

// --- WayangMedallion (internal helper) ---------------------------------------

/**
 * Circular radial-masked kelir medallion that clips the outer square canvas of
 * Wikimedia Wayang SVGs so only the curved leather shadow-puppet glows warmly
 * in burnished gold on the Surface B #3B0D0C Royal Maroon Batik stage.
 */
function WayangMedallion({
  src,
  sizeClass,
  extraClass = "",
}: {
  src: string;
  sizeClass: string;
  extraClass?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-full [mask-image:radial-gradient(circle_at_center,black_38%,transparent_70%)] ${sizeClass} ${extraClass}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full scale-[1.34] object-cover object-center opacity-85 brightness-110 contrast-125 saturate-150 sepia-[0.8] mix-blend-luminosity"
      />
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.22)_0%,rgba(59,13,12,0.58)_65%,#3B0D0C_100%)]" />
    </div>
  );
}

// --- PakeliranWayangStage ----------------------------------------------------

/**
 * Full-bleed Surface B (#3B0D0C Deep Royal Maroon Batik) Wayang Kulit Pakeliran
 * stage with gold Batik Tumpal top/bottom borders, glowing blencong rim lighting,
 * golden shadow-puppet Wayang flanks, and faceted burnished-gold Gunungan crest.
 */
export function PakeliranWayangStage({
  children,
  backdrop,
  className = "",
}: {
  children: React.ReactNode;
  backdrop?: React.ReactNode;
  className?: string;
}) {
  const stageRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={stageRef}
      aria-label="Panggung Pakeliran SILATARA"
      className={`relative w-full min-w-0 overflow-hidden bg-[#3B0D0C] py-16 text-white sm:py-20 ${className}`}
    >
      {backdrop}

      {/* Top & bottom gold Batik Tumpal borders matching Surface B (#3B0D0C) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-6 text-[#FDE68A] opacity-20"
      >
        <BatikTumpalBand className="h-full w-full" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rotate-180 text-[#FDE68A] opacity-20"
      >
        <BatikTumpalBand className="h-full w-full" />
      </div>

      {/* Glowing Blencong lamp rim light centered over the stage */}
      <BlencongGlow className="absolute -top-8 left-1/2 h-80 w-[38rem] -translate-x-1/2" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.2)_0%,transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.2)_0%,transparent_70%)] blur-2xl"
      />

      {/* Left parted-curtain golden leather Wayang medallions: Rama + Shinta */}
      <ScrollWayangParallax
        targetRef={stageRef}
        direction="left"
        className="absolute -bottom-8 -left-10 hidden items-end md:flex"
      >
        <WayangMedallion
          src="/landing/svg/wayang-rama.svg"
          sizeClass="h-60 w-60 lg:h-72 lg:w-72"
        />
        <WayangMedallion
          src="/landing/svg/wayang-shinta.svg"
          sizeClass="-ml-24 mb-6 hidden h-48 w-48 opacity-80 xl:block"
        />
      </ScrollWayangParallax>

      {/* Right parted-curtain golden leather Wayang medallions: Garuda + Hanoman */}
      <ScrollWayangParallax
        targetRef={stageRef}
        direction="right"
        className="absolute -bottom-8 -right-10 hidden items-end md:flex"
      >
        <WayangMedallion
          src="/landing/svg/wayang-garuda.svg"
          sizeClass="-mr-24 mb-6 hidden h-48 w-48 opacity-80 xl:block"
        />
        <WayangMedallion
          src="/landing/svg/wayang-hanoman.svg"
          sizeClass="h-60 w-60 lg:h-72 lg:w-72"
        />
      </ScrollWayangParallax>

      <div className="relative z-10 mx-auto max-w-[1200px] min-w-0 px-5">
        {/* Center faceted burnished-gold low-poly Gunungan crest */}
        <div className="flex justify-center pb-4">
          <div
            aria-hidden="true"
            className="relative h-20 w-16 drop-shadow-[0_0_24px_rgba(245,158,11,0.45)] sm:h-24 sm:w-20"
          >
            <Image
              src="/landing/poly/poly-gunungan.png"
              alt=""
              fill
              sizes="80px"
              className="object-contain"
            />
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
