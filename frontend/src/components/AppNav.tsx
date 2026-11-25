"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Award,
  BookOpen,
  Camera,
  Compass,
  FolderKanban,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  exact?: boolean;
  match?: (p: string) => boolean;
}

const ITEMS: Record<string, NavItem> = {
  dashboard: { href: "/app", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  academy: { href: "/academy", label: "Jalur Belajar", shortLabel: "Belajar", icon: BookOpen },
  progress: { href: "/app/progress", label: "Progres", icon: TrendingUp },
  pilot: {
    href: "/app/pilot",
    label: "Program Pilot",
    shortLabel: "Pilot",
    icon: Compass,
    match: (p) => p === "/app/pilot" || p.startsWith("/app/pilot/cohorts") || p.startsWith("/app/pilot/surveys"),
  },
  pilotManage: {
    href: "/app/pilot/manage",
    label: "Kelola Pilot",
    shortLabel: "Pilot",
    icon: Users,
    match: (p) => p.startsWith("/app/pilot/manage"),
  },
  practice: {
    href: "/app/practice",
    label: "Latihan",
    icon: Activity,
    match: (p) => p === "/app/practice" || p.startsWith("/app/practice/sessions") || /\/practice$/.test(p),
  },
  scores: { href: "/app/latihan/riwayat", label: "Riwayat Skor", shortLabel: "Skor", icon: Award },
  camera: {
    href: "/app/practice/camera-check",
    label: "Uji Kamera",
    shortLabel: "Kamera",
    icon: Camera,
    match: (p) => p.startsWith("/app/practice/camera-check") || p.startsWith("/app/practice/benchmark"),
  },
  studio: { href: "/app/studio", label: "Studio Instruktur", shortLabel: "Studio", icon: PenTool },
  manage: { href: "/app/manage", label: "Kelola Konten", shortLabel: "Konten", icon: FolderKanban },
  admin: { href: "/app/admin", label: "Admin", icon: ShieldCheck },
};

const EASE = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

function navGroupsForRole(role: Role): { primary: NavItem[]; secondary: NavItem[] } {
  switch (role) {
    case "admin":
      return {
        primary: [ITEMS.dashboard, ITEMS.admin, ITEMS.manage, ITEMS.studio, ITEMS.pilotManage],
        secondary: [ITEMS.academy, ITEMS.progress, ITEMS.pilot, ITEMS.practice, ITEMS.scores, ITEMS.camera],
      };
    case "curator":
      return {
        primary: [ITEMS.dashboard, ITEMS.manage, ITEMS.studio, ITEMS.pilotManage],
        secondary: [ITEMS.academy, ITEMS.progress, ITEMS.pilot, ITEMS.practice, ITEMS.scores, ITEMS.camera],
      };
    case "instructor":
      return {
        primary: [ITEMS.dashboard, ITEMS.studio, ITEMS.pilotManage, ITEMS.manage],
        secondary: [ITEMS.academy, ITEMS.progress, ITEMS.pilot, ITEMS.practice, ITEMS.scores, ITEMS.camera],
      };
    case "learner":
    default:
      return {
        primary: [ITEMS.dashboard, ITEMS.academy, ITEMS.progress, ITEMS.pilot],
        secondary: [ITEMS.practice, ITEMS.scores, ITEMS.camera],
      };
  }
}

function isItemActive(item: NavItem, path: string): boolean {
  if (item.match) return item.match(path);
  if (item.exact) return path === item.href;
  return path.startsWith(item.href);
}

export function RoleIconRail({ role }: { role: Role }) {
  const path = usePathname() ?? "/app";
  const [expanded, setExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { primary, secondary } = navGroupsForRole(role);
  const allItems = [...primary, ...secondary];
  const mobileBarItems = primary.slice(0, 4);
  const mobileMoreItems = allItems.filter((item) => !mobileBarItems.some((m) => m.href === item.href));

  const renderDesktopItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isItemActive(item, path);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={`group relative flex h-11 w-full items-center rounded-2xl transition-[background-color,color,box-shadow] ${EASE} ${
          active
            ? "bg-gradient-to-br from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white shadow-md shadow-orange-950/20"
            : "text-slate-600 hover:bg-[#fff6ee] hover:text-[#6d1b11]"
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center">
          <Icon
            aria-hidden
            className={`h-[19px] w-[19px] transition-transform duration-200 motion-reduce:transition-none ${
              active ? "scale-105" : "group-hover:scale-105"
            }`}
            strokeWidth={active ? 2.15 : 1.9}
          />
        </span>
        <span
          aria-hidden={!expanded}
          className={`overflow-hidden whitespace-nowrap text-[13px] font-medium transition-[max-width,opacity,transform,padding] ${EASE} ${
            expanded ? "max-w-[152px] translate-x-0 pr-3 opacity-100" : "max-w-0 -translate-x-2 pr-0 opacity-0"
          }`}
        >
          {item.label}
        </span>
        {!expanded && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-full z-40 ml-3 translate-x-1 whitespace-nowrap rounded-xl bg-forest-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
          >
            {item.label}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop floating rounded left icon rail */}
      <aside
        aria-label="Navigasi ruang kerja"
        data-expanded={expanded ? "true" : "false"}
        className={`sticky top-[5.5rem] hidden shrink-0 self-start transition-[width] ${EASE} md:block ${
          expanded ? "w-[228px]" : "w-[68px]"
        }`}
      >
        <div className="flex flex-col rounded-[24px] border border-[#7C1D1D]/15 bg-[#FFF8EE]/92 px-3 py-3 shadow-[0_10px_30px_rgba(59,13,12,0.08)] ring-1 ring-[#D97706]/15 backdrop-blur-md">
          <nav aria-label="Aplikasi" className="flex w-full flex-col gap-1">
            {primary.map(renderDesktopItem)}
            <div role="separator" className="my-2 h-px w-full bg-[#3B0D0C]/10 transition-all duration-300 motion-reduce:transition-none" />
            {secondary.map(renderDesktopItem)}
          </nav>

          <div role="separator" className="my-2.5 h-px w-full bg-[#3B0D0C]/10 transition-all duration-300 motion-reduce:transition-none" />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Ciutkan sidebar" : "Lebarkan sidebar"}
            aria-expanded={expanded}
            className={`group relative flex h-11 w-full items-center rounded-2xl text-slate-500 transition-colors ${EASE} hover:bg-[#fff6ee] hover:text-[#6d1b11]`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center">
              {expanded ? (
                <PanelLeftClose aria-hidden className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none" />
              ) : (
                <PanelLeftOpen aria-hidden className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none" />
              )}
            </span>
            <span
              aria-hidden={!expanded}
              className={`overflow-hidden whitespace-nowrap text-xs font-medium transition-[max-width,opacity,transform,padding] ${EASE} ${
                expanded ? "max-w-[140px] translate-x-0 pr-3 opacity-100" : "max-w-0 -translate-x-2 pr-0 opacity-0"
              }`}
            >
              Ciutkan
            </span>
            {!expanded && (
              <span
                role="tooltip"
                className="pointer-events-none absolute left-full z-40 ml-3 translate-x-1 whitespace-nowrap rounded-xl bg-forest-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                Lebarkan label
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile floating bottom dock (< md) */}
      <div className="fixed inset-x-0 bottom-3 z-40 px-4 md:hidden">
        {mobileMoreItems.length > 0 && (
          <div
            aria-hidden={!drawerOpen}
            className={`mx-auto grid max-w-md transition-[grid-template-rows,opacity,transform,margin] ${EASE} ${
              drawerOpen
                ? "mb-2 grid-rows-[1fr] translate-y-0 opacity-100 pointer-events-auto"
                : "mb-0 grid-rows-[0fr] translate-y-2 opacity-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <div className="rounded-[24px] border border-[#7C1D1D]/15 bg-[#FFF8EE]/95 p-3 shadow-2xl ring-1 ring-[#D97706]/15 backdrop-blur-md">
                <div className="grid grid-cols-2 gap-1.5">
                  {mobileMoreItems.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item, path);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        tabIndex={drawerOpen ? 0 : -1}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none ${
                          active
                            ? "bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white"
                            : "bg-[#F4F5F7] text-slate-700 hover:bg-parchment-100 hover:text-forest-900"
                        }`}
                      >
                        <Icon aria-hidden className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav
          aria-label="Navigasi aplikasi seluler"
          className="mx-auto flex max-w-md items-center justify-around gap-1 rounded-full border border-[#7C1D1D]/15 bg-[#FFF8EE]/92 px-2 py-1.5 shadow-[0_10px_30px_rgba(59,13,12,0.14)] ring-1 ring-[#D97706]/20 backdrop-blur-md"
        >
          {mobileBarItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setDrawerOpen(false)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
                  active
                    ? "bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white"
                    : "text-slate-500 hover:text-forest-800"
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                <span className="truncate">{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
          {mobileMoreItems.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              aria-expanded={drawerOpen}
              aria-label="Menu lainnya"
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors duration-200 motion-reduce:transition-none ${
                drawerOpen ? "bg-parchment-100 text-forest-900" : "text-slate-500 hover:text-forest-800"
              }`}
            >
              {drawerOpen ? <X aria-hidden className="h-4 w-4" /> : <MoreHorizontal aria-hidden className="h-4 w-4" />}
              <span>Lainnya</span>
            </button>
          )}
        </nav>
      </div>
    </>
  );
}

export { RoleIconRail as AppNav };
