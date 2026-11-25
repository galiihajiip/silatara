import { useId } from "react";
import type { PracticeDayPoint } from "@/lib/types";
import { formatDuration } from "@/lib/format";

/** Tren durasi latihan harian (bukan skor kemampuan). SVG + tabel tersembunyi untuk pembaca layar. */
export function ActivityChart({ days }: { days: PracticeDayPoint[] }) {
  const gradId = useId();
  const max = Math.max(60, ...days.map((d) => d.active_seconds));
  const w = 560, h = 132, gap = 8, bw = (w - gap * Math.max(0, days.length - 1)) / Math.max(1, days.length);
  const total = days.reduce((s, d) => s + d.active_seconds, 0);
  const active = days.filter((d) => d.sessions > 0).length;
  const label = `Durasi latihan aktif per hari selama ${days.length} hari terakhir: total ${formatDuration(total * 1000)}, aktif pada ${active} hari.`;
  return (
    <figure>
      <svg role="img" aria-label={label} viewBox={`0 0 ${w} ${h + 22}`} className="w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#6d1b11" />
          </linearGradient>
        </defs>
        <line x1="0" y1={h * 0.5} x2={w} y2={h * 0.5} stroke="#f1f5f9" strokeDasharray="4 4" />
        <line x1="0" y1={h} x2={w} y2={h} stroke="#e2e8f0" />
        {days.map((d, i) => {
          const bh = d.active_seconds ? Math.max(6, (d.active_seconds / max) * (h - 10)) : 0;
          const x = i * (bw + gap);
          return (
            <g key={d.date}>
              {bh > 0 ? (
                <rect x={x} y={h - bh} width={bw} height={bh} rx="6" fill={`url(#${gradId})`}>
                  <title>{`${d.date}: ${formatDuration(d.active_seconds * 1000)}, ${d.sessions} sesi`}</title>
                </rect>
              ) : (
                <rect x={x} y={h - 4} width={bw} height="4" rx="2" fill="#e2e8f0" />
              )}
              {(i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2)) && (
                <text x={x + bw / 2} y={h + 16} textAnchor="middle" fontSize="11" fill="#64748b">
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{label}</figcaption>
      <table className="sr-only">
        <caption>Latihan per hari</caption>
        <thead><tr><th scope="col">Tanggal</th><th scope="col">Sesi</th><th scope="col">Durasi aktif</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.sessions}</td><td>{formatDuration(d.active_seconds * 1000)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
