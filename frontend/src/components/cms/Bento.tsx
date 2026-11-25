import type { LucideIcon } from "lucide-react";

export function CmsPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-bronze-700">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-forest-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoKpi({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  valueTestId,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: LucideIcon;
  accent?: boolean;
  valueTestId?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)] ${
        accent
          ? "border-transparent bg-gradient-to-br from-[#4a0d0d] via-[#6d1b11] to-[#c2410c] text-white shadow-md shadow-orange-950/15"
          : "border-slate-200/80 bg-white text-slate-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-medium ${accent ? "text-orange-100" : "text-slate-500"}`}>{label}</p>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${
            accent
              ? "bg-white/15 text-white"
              : "border border-[#fed7aa]/70 bg-[#fff6ee] text-[#6d1b11]"
          }`}
        >
          <Icon aria-hidden className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p
        data-testid={valueTestId}
        className={`mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
          accent ? "text-white" : "text-forest-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className={`mt-1 text-xs ${accent ? "text-orange-100/90" : "text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

export function BentoTable({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-x-auto rounded-[24px] border border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

export const CMS_TH = "px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500";
export const CMS_TD = "px-5 py-3.5 text-sm text-slate-700";
export const CMS_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-orange-950/15 transition-all hover:from-[#3a0808] hover:to-[#9a3412] disabled:opacity-60";
export const CMS_BTN_PRIMARY_SM =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-orange-950/15 transition-all hover:from-[#3a0808] hover:to-[#9a3412] disabled:opacity-60";
export const CMS_BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-[#fed7aa] hover:bg-[#fff6ee] hover:text-[#6d1b11] disabled:opacity-60";
export const CMS_BTN_SECONDARY_SM =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3.5 py-1.5 text-xs font-semibold text-[#6d1b11] transition-colors hover:bg-[#fed7aa]/60 hover:text-[#2e0909] disabled:opacity-60";
