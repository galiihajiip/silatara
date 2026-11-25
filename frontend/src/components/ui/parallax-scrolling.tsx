"use client";

/**
 * ParallaxComponent + ParallaxLayerStage
 * Multi-layer GSAP ScrollTrigger + Lenis smooth-scroll parallax.
 *
 * Key design decisions:
 * - All GSAP/Lenis initialisation runs ONLY inside useEffect (browser only).
 * - window.matchMedia guarded against jsdom (Vitest): `window.matchMedia?.(...)`
 * - prefers-reduced-motion skips all parallax animations gracefully.
 * - Full cleanup on unmount: tl.kill(), ScrollTrigger.getAll().forEach(st => st.kill()),
 *   gsap.ticker.remove(), lenis.destroy().
 * - Decorative layers use alt="" and aria-hidden="true" for axe-core compliance.
 */

import React, { useEffect, useRef } from "react";
import Image from "next/image";

// --- Types -------------------------------------------------------------------

export interface ParallaxLayer {
  /** data-parallax-layer id: "1" | "2" | "3" | "4" */
  id: "1" | "2" | "3" | "4";
  /** yPercent offset at end of scroll (layer 1 furthest/fastest lag, 4 foreground/slowest) */
  yPercent: number;
}

export const DEFAULT_LAYERS: ParallaxLayer[] = [
  { id: "1", yPercent: 54 },
  { id: "2", yPercent: 38 },
  { id: "3", yPercent: 22 },
  { id: "4", yPercent: 6 },
];

// --- Hook: useParallaxLayers -------------------------------------------------

/**
 * Wire GSAP ScrollTrigger + Lenis parallax onto [data-parallax-layer="1|2|3|4"]
 * elements inside containerRef. Safe for SSR, jsdom, and reduced-motion.
 */
export function useParallaxLayers(
  containerRef: React.RefObject<HTMLElement | null>,
  layers: ParallaxLayer[] = DEFAULT_LAYERS,
) {
  const layersKey = layers.map((l) => `${l.id}:${l.yPercent}`).join("|");

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;
    // Reduced-motion guard (also safe if window.matchMedia is undefined in jsdom)
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduced) return;

    const parsedLayers: ParallaxLayer[] = layersKey
      .split("|")
      .filter(Boolean)
      .map((entry) => {
        const [id, y] = entry.split(":");
        return { id: id as ParallaxLayer["id"], yPercent: Number(y) };
      });

    let cancelled = false;
    let cleanupFn: (() => void) | null = null;

    // Dynamic import so SSR and test environments remain safe
    Promise.all([
      import("gsap").then((m) => m.gsap),
      import("gsap/ScrollTrigger").then((m) => m.ScrollTrigger),
      import("lenis").then((m) => m.default),
    ])
      .then(([gsap, ScrollTrigger, Lenis]) => {
        if (cancelled || !containerRef.current) return;

        gsap.registerPlugin(ScrollTrigger);

        // Setup Lenis smooth scroll synced to GSAP's unified RAF ticker
        const lenisInstance = new Lenis({
          autoRaf: false,
          lerp: 0.1,
          smoothWheel: true,
        });

        function updateLenis(time: number) {
          lenisInstance.raf(time * 1000);
        }

        lenisInstance.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(updateLenis);
        gsap.ticker.lagSmoothing(0);

        // Animate each parallax depth layer smoothly as hero exits viewport
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: "0% 0%",
            end: "100% 0%",
            scrub: 0.3,
          },
        });

        parsedLayers.forEach(({ id, yPercent }) => {
          const els = containerRef.current?.querySelectorAll(
            `[data-parallax-layer="${id}"]`,
          );
          if (els && els.length > 0) {
            tl.to(els.length === 1 ? els[0] : Array.from(els), { yPercent, ease: "none" }, 0);
          }
        });

        cleanupFn = () => {
          tl.kill();
          ScrollTrigger.getAll().forEach((st) => st.kill());
          gsap.ticker.remove(updateLenis);
          lenisInstance.destroy();
        };
      })
      .catch(() => {
        // Silently ignore in environments where gsap/lenis cannot initialise
      });

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, [containerRef, layersKey]);
}

// --- ParallaxLayerStage ------------------------------------------------------

/**
 * Wraps a container with data-parallax-layers and wires useParallaxLayers.
 * Drop-in wrapper so SunsetCloudsHero keeps its pure SVG invariants.
 */
export function ParallaxLayerStage({
  children,
  className = "",
  layers = DEFAULT_LAYERS,
}: {
  children: React.ReactNode;
  className?: string;
  layers?: ParallaxLayer[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useParallaxLayers(ref, layers);

  return (
    <div ref={ref} data-parallax-layers className={className}>
      {children}
    </div>
  );
}

// --- ParallaxComponent -------------------------------------------------------

/**
 * Full SakaJawa-grade layered parallax showcase with lineless Merapi sunset
 * artwork, Padepokan Joglo midground, Pendekar lantern scene, and foreground
 * warrior silhouette. Decorative images use alt="" for axe-core compliance.
 */
export function ParallaxComponent({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useParallaxLayers(containerRef);

  return (
    <section
      aria-label="Panggung Padepokan Nusantara, tampilan paralaks berlapis"
      className={`relative h-[560px] overflow-hidden bg-[#3B0D0C] sm:h-[700px] lg:h-[840px] ${className}`}
    >
      <div
        ref={containerRef}
        data-parallax-layers
        className="absolute inset-0 h-full w-full overflow-hidden"
      >
        {/* Layer 1: Far background faceted low-poly Merapi sunset vista */}
        <div
          data-parallax-layer="1"
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 inset-x-0 bottom-0 will-change-transform"
        >
          <Image
            src="/landing/poly/poly-merapi-sunset-wide.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FEF3C7]/30 via-transparent to-transparent" />
        </div>

        {/* Layer 2: Midground faceted low-poly Padepokan Joglo with top sky fade */}
        <div
          data-parallax-layer="2"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-10 h-[80%] will-change-transform [mask-image:linear-gradient(to_bottom,transparent_0%,black_28%,black_100%)]"
        >
          <Image
            src="/landing/poly/poly-padepokan-wide.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-bottom opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2e0909]/35 via-transparent to-transparent" />
        </div>

        {/* Layer 3: Centered faceted burnished gold Gunungan Wayang */}
        <div
          data-parallax-layer="3"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 left-1/2 h-[320px] w-[240px] -translate-x-1/2 will-change-transform sm:h-[420px] sm:w-[320px]"
        >
          <Image
            src="/landing/poly/poly-gunungan.png"
            alt=""
            fill
            sizes="(min-width: 640px) 320px, 240px"
            className="object-contain object-bottom opacity-85 drop-shadow-2xl"
          />
        </div>

        {/* Layer 4: Foreground faceted low-poly Pendekar Kuda-Kuda Tengah */}
        <div
          data-parallax-layer="4"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 h-auto w-[280px] -translate-x-1/2 will-change-transform sm:w-[380px] lg:w-[460px]"
        >
          <Image
            src="/landing/poly/poly-kuda-kuda.png"
            alt=""
            width={520}
            height={600}
            sizes="(min-width: 1024px) 460px, (min-width: 640px) 380px, 280px"
            className="h-auto w-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Static bottom transition into Warm Ivory Batik canvas */}
      <div
        aria-hidden="true"
        className="parallax__fade pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#FFF8EE]"
      />
    </section>
  );
}
