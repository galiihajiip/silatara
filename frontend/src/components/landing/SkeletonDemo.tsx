import { POSE_BODY_CONNECTIONS } from "@/features/practice/skeleton";
import { syntheticStandingPose } from "@/features/practice/synthetic-pose";

/** Visualisasi kerangka SINTETIS (dibuat kode), bukan rekaman manusia dan bukan gerakan pencak silat. */
export function SkeletonDemo() {
  const lm = syntheticStandingPose({ t: 900 }).landmarks;
  const P = (i: number) => ({ x: lm[i].x * 400, y: lm[i].y * 500 });
  const joints = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  return (
    <figure className="relative">
      <svg viewBox="0 0 400 500" role="img" aria-label="Ilustrasi kerangka tubuh pada Practice Studio (gambar ilustrasi, bukan rekaman manusia)." className="mx-auto h-auto w-full max-w-sm rounded-2xl bg-obsidian-900 ring-1 ring-white/10">
        <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" strokeOpacity=".05" /></pattern></defs>
        <rect width="400" height="500" fill="url(#grid)" />
        {POSE_BODY_CONNECTIONS.map(([a, b]) => { const A = P(a), B = P(b); return <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#e8793a" strokeWidth="5" strokeLinecap="round" />; })}
        {joints.map((i) => { const p = P(i); return <circle key={i} cx={p.x} cy={p.y} r="6.5" fill="#f0b64a" stroke="#0f1512" strokeWidth="2" />; })}
        <rect x="14" y="14" rx="8" width="150" height="26" fill="#0f1512" fillOpacity=".85" />
        <text x="24" y="32" fontSize="13" fill="#f0b64a" fontFamily="ui-sans-serif, system-ui, sans-serif">Ilustrasi kerangka tubuh</text>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-paper-50/70">Kerangka dihitung di perangkat dari kamera pilihan Anda. Gambar di atas hanya ilustrasi sintetis.</figcaption>
    </figure>
  );
}
