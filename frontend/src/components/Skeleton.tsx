export function ListSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-5">
      <span className="sr-only">Memuat...</span>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="h-8 w-56 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-[24px] border border-slate-200/70 bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-[24px] border border-slate-200/70 bg-white" />
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-8">
      <span className="sr-only">Memuat...</span>
      <div className="rounded-[28px] border border-[#fed7aa] bg-[#fff6ee] p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <div className="h-4 w-28 rounded-full bg-orange-200/70" />
          <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200/80" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-full border border-[#e7d7c8] bg-white" />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex h-52 flex-col justify-between rounded-[24px] border border-[#e7d7c8] bg-white p-5"
          >
            <div className="space-y-3">
              <div className="h-3.5 w-24 rounded-full bg-orange-200/70" />
              <div className="h-6 w-4/5 rounded-lg bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-200/75" />
            </div>
            <div className="h-4 w-28 rounded bg-slate-200/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat...</span>
      <div className="h-4 w-48 rounded-full bg-slate-200" />
      <div className="rounded-[28px] border border-[#e7d7c8] bg-[#fffaf5] p-6 sm:p-8">
        <div className="max-w-2xl space-y-3">
          <div className="h-4 w-32 rounded-full bg-orange-200/70" />
          <div className="h-9 w-2/3 rounded-xl bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200/80" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="aspect-[4/3] w-full rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4]" />
          <div className="space-y-3 rounded-[24px] border border-[#e7d7c8] bg-white p-6">
            <div className="h-5 w-44 rounded-lg bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200/80" />
            <div className="h-4 w-5/6 rounded bg-slate-200/80" />
            <div className="h-4 w-4/6 rounded bg-slate-200/70" />
          </div>
        </div>
        <aside className="space-y-4">
          <div className="h-48 rounded-[24px] border border-[#e7d7c8] bg-white p-5" />
          <div className="h-36 rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4] p-5" />
        </aside>
      </div>
    </div>
  );
}

export function MediaStageSkeleton({ className = "aspect-[4/3] w-full" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`animate-pulse flex flex-col justify-between rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4] p-4 ${className}`}
    >
      <span className="sr-only">Memuat...</span>
      <div className="flex items-center justify-between gap-2">
        <div className="h-5 w-28 rounded-full bg-orange-200/70" />
        <div className="h-7 w-20 rounded-full bg-white" />
      </div>
      <div className="mx-auto h-16 w-16 rounded-full bg-slate-200/80" />
      <div className="flex items-center justify-between gap-3">
        <div className="h-8 w-24 rounded-full bg-white" />
        <div className="h-3 flex-1 rounded-full bg-slate-200/80" />
        <div className="h-8 w-20 rounded-full bg-white" />
      </div>
    </div>
  );
}

export function MapPageSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat...</span>
      <div className="space-y-2">
        <div className="h-3.5 w-28 rounded-full bg-orange-200/70" />
        <div className="h-9 w-80 max-w-full rounded-xl bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] border border-[#e7d7c8] bg-white p-4" />
        ))}
      </div>
      <div className="h-[22rem] w-full rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4] sm:h-[26rem]" />
      <div className="flex flex-wrap gap-3 rounded-[20px] border border-[#e7d7c8] bg-white p-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-40 rounded-xl bg-slate-200/80" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-36 rounded-[24px] border border-[#e7d7c8] bg-white p-5" />
        ))}
      </div>
    </div>
  );
}

export function StudioWorkspaceSkeleton() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-6">
      <span className="sr-only">Memuat...</span>
      <div className="rounded-[28px] border border-[#fed7aa] bg-[#fff6ee] p-6">
        <div className="space-y-2.5">
          <div className="h-3.5 w-32 rounded-full bg-orange-200/70" />
          <div className="h-8 w-72 max-w-full rounded-xl bg-slate-200" />
          <div className="h-4 w-96 max-w-full rounded bg-slate-200/80" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="aspect-[16/10] w-full rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4]" />
        <div className="space-y-4">
          <div className="h-44 rounded-[24px] border border-[#e7d7c8] bg-white p-5" />
          <div className="h-32 rounded-[24px] border border-[#e7d7c8] bg-white p-5" />
        </div>
      </div>
      <div className="h-40 rounded-[24px] border border-[#e7d7c8] bg-white p-5" />
    </div>
  );
}
