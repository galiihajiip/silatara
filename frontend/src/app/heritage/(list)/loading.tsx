export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-12">
      <span className="sr-only">Memuat halaman Jelajahi Warisan…</span>

      <div className="rounded-[28px] border border-[#7c1d1d]/30 bg-[#4a120b]/90 px-6 py-10 sm:rounded-[32px] sm:px-10 sm:py-12">
        <div className="max-w-2xl space-y-4">
          <div className="h-6 w-48 rounded-full bg-white/15" />
          <div className="h-10 w-4/5 rounded-xl bg-white/25" />
          <div className="h-4 w-full rounded bg-white/15" />
          <div className="flex flex-wrap gap-2.5 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-7 w-36 rounded-full bg-white/15" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 rounded-[26px] border border-[#e7d7c8] bg-[#fffaf5]" />
        ))}
      </div>

      <div className="rounded-[28px] border border-[#e7d7c8] bg-[#faf7f4] p-5 sm:p-6">
        <div className="h-28 rounded-[22px] border border-[#ece2d8] bg-white" />
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((p) => (
            <div key={p} className="h-12 rounded-2xl border border-[#fed7aa] bg-[#fff6ee]" />
          ))}
        </div>
      </div>
    </div>
  );
}
