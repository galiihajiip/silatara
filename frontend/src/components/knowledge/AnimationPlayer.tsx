"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SPEEDS = [0.5, 1, 1.5] as const;
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

/**
 * Pemutar animasi gerak (SVG SMIL buatan SILATARA). SVG disisipkan langsung agar dapat dijeda/diputar dan diatur
 * kecepatannya: animasi SMIL dijeda lalu waktunya dimajukan manual sesuai kecepatan. Hormati prefers-reduced-motion
 * (mulai dalam keadaan jeda). Berkas berasal dari server sendiri dan divalidasi tanpa skrip (tools/animation).
 */
export function AnimationPlayer({
  src,
  title,
  compact = false,
  variant = "default",
}: {
  src: string;
  title: string;
  compact?: boolean;
  variant?: "default" | "hero";
}) {
  const host = useRef<HTMLDivElement>(null);
  const [markup, setMarkup] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [choice, setChoice] = useState<boolean | null>(null); // null = ikuti preferensi sistem
  const playing = choice ?? !reducedMotion;
  const setPlaying = (v: boolean | ((p: boolean) => boolean)) => setChoice(typeof v === "function" ? v(playing) : v);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => {
    let alive = true;
    fetch(src, { cache: "force-cache" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((t) => { if (alive && t.trimStart().startsWith("<svg")) setMarkup(t); else if (alive) setFailed(true); })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [src]);

  useEffect(() => {
    const svg = host.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svg || typeof svg.pauseAnimations !== "function") return;
    svg.setAttribute("width", "100%");
    svg.removeAttribute("height");
    if (!playing) { svg.pauseAnimations(); return; }
    if (speed === 1) { svg.unpauseAnimations(); return; }
    svg.pauseAnimations();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      svg.setCurrentTime(svg.getCurrentTime() + ((now - last) / 1000) * speed);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [markup, playing, speed]);

  const hero = variant === "hero";
  if (failed) {
    return (
      <div className={hero ? "flex justify-center rounded-[20px] border border-slate-200/80 bg-parchment-100/50 p-6" : ""}>
        {/* eslint-disable-next-line @next/next/no-img-element -- cadangan bila SVG tidak dapat disisipkan */}
        <img
          src={src}
          alt={`Animasi ${title}`}
          width={360}
          height={440}
          className={hero ? "h-auto w-full max-w-[340px] rounded-xl bg-paper-50" : "h-auto w-full rounded-xl border border-line-200 bg-paper-50"}
        />
      </div>
    );
  }
  return (
    <figure className={`overflow-hidden border ${hero ? "rounded-[20px] border-slate-200/80 bg-white" : "rounded-xl border-line-200 bg-paper-50"}`}>
      <div className={hero ? "flex items-center justify-center bg-parchment-100/45 px-4 py-6" : ""}>
        <div
          ref={host}
          role="img"
          aria-label={`Animasi ${title}`}
          className={hero ? "aspect-[9/11] w-full max-w-[320px] sm:max-w-[350px]" : "aspect-[9/11] w-full"}
          // SVG milik SILATARA (dibuat generator, divalidasi tanpa skrip/URL eksternal)
          dangerouslySetInnerHTML={markup ? { __html: markup } : undefined}
        />
      </div>
      {!compact && (
        <figcaption className={`flex flex-wrap items-center justify-between gap-2 border-t border-line-200 ${hero ? "px-4 py-3 sm:px-5" : "px-3 py-2"}`}>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-pressed={!playing}
            className={`inline-flex items-center gap-1.5 text-sm font-medium text-forest-900 hover:bg-parchment-100 ${hero ? "rounded-full border border-slate-200 px-3.5 py-1.5" : "rounded-lg px-2 py-1"}`}
          >
            {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
            {playing ? "Jeda" : "Putar"}
          </button>
          <div role="group" aria-label="Kecepatan animasi" className="flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSpeed(s); setPlaying(true); }}
                aria-pressed={speed === s}
                className={`${hero ? "rounded-full px-3 py-1 text-xs font-medium" : "rounded-lg px-2 py-1 text-xs"} ${speed === s ? "bg-forest-700 text-paper-50" : "text-slate-600 hover:bg-parchment-100"}`}
              >
                {s.toString().replace(".", ",")}×
              </button>
            ))}
          </div>
        </figcaption>
      )}
    </figure>
  );
}
