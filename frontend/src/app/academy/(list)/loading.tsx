export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-8">
      <span className="sr-only">Memuat daftar kelas Akademi…</span>
      <div className="rounded-[28px] border border-[#fed7aa] bg-[#fff6ee] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl flex-1 space-y-2.5">
            <div className="h-5 w-24 rounded-full bg-orange-200/70" />
            <div className="h-8 w-3/4 rounded-lg bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200/80" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((p) => (
              <div key={p} className="h-8 w-32 rounded-full bg-white" />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e7d7c8] bg-white p-3">
        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.15fr]">
          <div className="space-y-4 rounded-[22px] bg-[#4a120b]/90 p-6 sm:p-7">
            <div className="h-3 w-36 rounded bg-white/25" />
            <div className="h-7 w-4/5 rounded-lg bg-white/30" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-white/20" />
              <div className="h-3.5 w-5/6 rounded bg-white/20" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {[0, 1, 2, 3].map((c) => (
                <div key={c} className="h-6 w-20 rounded-full bg-white/20" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5 pt-4">
              <div className="h-10 w-44 rounded-full bg-white/80" />
              <div className="h-10 w-36 rounded-full bg-white/20" />
            </div>
          </div>
          <div className="rounded-[22px] border border-[#fed7aa] bg-[#faf7f4] p-5 sm:p-6">
            <div className="mb-3.5 h-3 w-28 rounded bg-orange-200/80" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((m) => (
                <div key={m} className="h-14 rounded-2xl bg-white" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e7d7c8] bg-[#faf7f4] p-5 sm:p-6">
        <div className="mb-4 h-5 w-44 rounded bg-orange-200/70" />
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((e) => (
            <div key={e} className="h-44 rounded-[22px] border border-[#ece2d8] bg-white p-5" />
          ))}
        </div>
      </div>
    </div>
  );
}
