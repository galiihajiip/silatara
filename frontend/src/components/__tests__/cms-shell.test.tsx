// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import AppLayout from "@/app/app/layout";
import { RoleIconRail } from "@/components/AppNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

let mockServerPath = "/app";
const mockServerUser = { id: "u1", email: "kurator@silatara.test", display_name: "Budi Kurator", role: "curator" as const };

vi.mock("@/lib/server-api", () => ({
  currentPath: vi.fn(async () => mockServerPath),
  requireUser: vi.fn(async () => mockServerUser),
  getCurrentUser: vi.fn(async () => mockServerUser),
}));

describe("SiteFooter suppression in CMS (/app/**) and practice routes", () => {
  it("renders cohesive Deep Royal Maroon (#3B0D0C) footer on public pages with high-contrast logo backdrop and essential links", async () => {
    for (const p of ["/", "/heritage", "/library", "/academy", "/community/peta", "/library/kuda-kuda-tengah"]) {
      currentPathname = p;
      const { container, unmount } = render(<SiteFooter />);
      const footer = container.querySelector("footer");
      expect(footer, p).not.toBeNull();
      expect(footer?.hasAttribute("data-site-footer")).toBe(true);
      expect(footer?.className).toContain("bg-[#3B0D0C]");
      expect(footer?.className).toContain("border-amber-200/15");
      expect(footer?.className).not.toContain("bg-white");
      expect(footer?.className).not.toContain("bg-batik-kawung");

      // High-contrast Warm Ivory pill backdrop around BrandLogo
      const brandLink = within(footer as HTMLElement).getByRole("link", { name: "SILATARA: beranda" });
      expect(brandLink.className).toContain("bg-[#FFF8EE]");

      // Essential navigation links
      for (const href of ["/library", "/heritage", "/academy", "/community/peta", "/masuk", "/daftar", "/status"]) {
        expect(footer?.querySelector(`a[href="${href}"]`), `${p} -> ${href}`).not.toBeNull();
      }

      // Invariants: no deprecated greens, no em-dashes
      expect(footer?.innerHTML).not.toMatch(/#0B7A4B|#10945C|#315C4D|#E6F4EE/i);
      expect(footer?.innerHTML).not.toMatch(/\b(emerald|green|teal)-/);
      expect(footer?.textContent).not.toContain("\u2014");

      const a11y = await axe.run(container);
      expect(a11y.violations).toEqual([]);
      unmount();
    }
  });

  it("omits footer completely on /app routes, standalone auth routes, and interactive /latihan or /practice pages", () => {
    for (const p of [
      "/app",
      "/app/studio",
      "/app/practice",
      "/app/practice/camera-check",
      "/app/latihan/riwayat",
      "/app/courses/dasar/lessons/sikap/practice",
      "/library/kuda-kuda-tengah/latihan",
      "/masuk",
      "/daftar",
      "/lupa-sandi",
      "/atur-ulang-sandi",
    ]) {
      currentPathname = p;
      const { container, unmount } = render(<SiteFooter />);
      expect(container.querySelector("footer"), p).toBeNull();
      unmount();
    }
  });

  it("omits global navbar on standalone auth routes (/masuk, /daftar, /lupa-sandi, /atur-ulang-sandi)", () => {
    for (const p of ["/masuk", "/daftar", "/lupa-sandi", "/atur-ulang-sandi"]) {
      currentPathname = p;
      const { container, unmount } = render(<SiteHeaderClient user={null} />);
      expect(container.querySelector("header"), p).toBeNull();
      unmount();
    }
  });
});

describe("SiteHeaderClient floating pill navbar in /app", () => {
  const user = { id: "u1", email: "kurator@silatara.test", display_name: "Budi Kurator", role: "curator" as const };

  it("preserves all public navigation links, Dasbor, role badge, and Keluar inside /app", () => {
    currentPathname = "/app/manage";
    render(<SiteHeaderClient user={user} />);
    const nav = screen.getByRole("navigation", { name: "Utama" });
    expect(nav.textContent).toContain("Beranda");
    expect(nav.textContent).toContain("Jelajahi Warisan");
    expect(nav.textContent).toContain("Pustaka Gerakan");
    expect(nav.textContent).toContain("Akademi");
    expect(nav.textContent).toContain("Peta Perguruan");
    expect(nav.textContent).toContain("Dasbor");
    expect(screen.getAllByText("Kurator").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Keluar" }).length).toBeGreaterThan(0);
  });

  it("applies unified Warm Ivory floating pill silhouette and clear hover transitions on all navbar items", () => {
    currentPathname = "/app";
    const { container } = render(<SiteHeaderClient user={user} />);

    // Unified Warm Ivory floating pill silhouette matching Landing & Login navbar
    const pill = container.querySelector(".rounded-full.border.pointer-events-auto");
    expect(pill).not.toBeNull();
    expect(pill?.className).toContain("bg-[#FFF8EE]/92");
    expect(pill?.className).toContain("border-[#7C1D1D]/15");
    expect(pill?.className).toContain("ring-[#D97706]/20");
    expect(pill?.className).toContain("h-14");
    expect(pill?.className).toContain("sm:h-[60px]");
    expect(pill?.className).toContain("backdrop-blur-md");
    expect(pill?.className).toContain("pointer-events-auto");

    // Outer header wrapper is transparent and does not intercept clicks outside the pill
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.className).toContain("bg-transparent");
    expect(header?.className).toContain("pointer-events-none");
    expect(header?.className).not.toContain("bg-[#F4F5F7]");
    expect(header?.className).not.toContain("bg-[#f8fafc]");
    expect(header?.className).not.toContain("backdrop-blur-md");

    const nav = screen.getByRole("navigation", { name: "Utama" });

    // Inactive link hover background transition
    const homeLink = within(nav).getByRole("link", { name: "Beranda" });
    expect(homeLink.className).toContain("hover:bg-[#fff6ee]");
    expect(homeLink.className).toContain("hover:text-[#6d1b11]");
    expect(homeLink.className).toContain("transition-all");
    expect(homeLink.className).toContain("duration-200");

    // Active Dasbor link highlight
    const dasborLink = within(nav).getByRole("link", { name: "Dasbor" });
    expect(dasborLink.getAttribute("aria-current")).toBe("page");
    expect(dasborLink.className).toContain("bg-gradient-to-r");

    // Keluar button hover background transition
    const logoutBtn = screen.getAllByRole("button", { name: "Keluar" })[0];
    expect(logoutBtn.className).toContain("hover:bg-[#fff6ee]");
    expect(logoutBtn.className).toContain("hover:text-[#6d1b11]");
    expect(logoutBtn.className).toContain("transition-all");
  });
});

describe("SiteHeaderClient public floating pill navbar (!isCms)", () => {
  it("renders unified Warm Ivory floating pill navbar silhouette on public pages with active route highlight", () => {
    currentPathname = "/heritage";
    const { container } = render(<SiteHeaderClient user={null} />);

    // Unified Warm Ivory floating pill silhouette
    const pill = container.querySelector(".rounded-full.border.pointer-events-auto");
    expect(pill).not.toBeNull();
    expect(pill?.className).toContain("bg-[#FFF8EE]/92");
    expect(pill?.className).toContain("border-[#7C1D1D]/15");
    expect(pill?.className).toContain("backdrop-blur-md");
    expect(pill?.className).toContain("pointer-events-auto");

    // Outer header wrapper is transparent and pointer-events-none
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
    expect(header?.className).toContain("bg-transparent");
    expect(header?.className).toContain("pointer-events-none");
    expect(header?.className).not.toContain("bg-[#f8fafc]");
    expect(header?.className).not.toContain("backdrop-blur-md");

    const nav = screen.getByRole("navigation", { name: "Utama" });

    // Active link highlight (Jelajahi Warisan)
    const heritageLink = within(nav).getByRole("link", { name: "Jelajahi Warisan" });
    expect(heritageLink.getAttribute("aria-current")).toBe("page");
    expect(heritageLink.className).toContain("bg-gradient-to-r");

    // Inactive link hover transition
    const berandaLink = within(nav).getByRole("link", { name: "Beranda" });
    expect(berandaLink.getAttribute("aria-current")).toBeNull();
    expect(berandaLink.className).toContain("hover:bg-[#fff6ee]");
    expect(berandaLink.className).toContain("hover:text-[#6d1b11]");
    expect(berandaLink.className).toContain("transition-all");

    // Public logged-out action pills with hover transitions
    const loginLink = screen.getAllByRole("link", { name: "Masuk" })[0];
    expect(loginLink.className).toContain("hover:bg-[#fff6ee]");
    expect(loginLink.className).toContain("hover:text-[#6d1b11]");

    const ctaLink = screen.getAllByRole("link", { name: "Mulai Belajar" })[0];
    expect(ctaLink.className).toContain("transition-all");
  });

  it("renders profile button with user name and toggles dropdown modal containing Dasbor and Keluar", () => {
    currentPathname = "/library";
    const user = { id: "u2", email: "pendekar@silatara.test", display_name: "Pendekar Riau", role: "learner" as const };
    render(<SiteHeaderClient user={user} />);

    // Profile button renders user name
    const profileBtn = screen.getByRole("button", { name: "Menu profil Pendekar Riau" });
    expect(profileBtn).toBeTruthy();
    expect(within(profileBtn).getByText("Pendekar Riau")).toBeTruthy();

    // Dropdown modal is initially closed
    expect(screen.queryByRole("menu", { name: "Menu pengguna" })).toBeNull();

    // Click profile button to open dropdown modal
    fireEvent.click(profileBtn);
    const menu = screen.getByRole("menu", { name: "Menu pengguna" });
    expect(menu).toBeTruthy();

    // Contains Dasbor link and Keluar logout button
    expect(within(menu).getByRole("menuitem", { name: "Dasbor" })).toBeTruthy();
    expect(within(menu).getByRole("button", { name: "Keluar" })).toBeTruthy();
  });

  it("unifies outer header wrapper padding, alignment, and Warm Ivory pill container styling across Landing, Public, and CMS", () => {
    currentPathname = "/";
    const { container: landingContainer } = render(<SiteHeaderClient user={null} />);
    const landingWrapper = landingContainer.querySelector("header")?.firstElementChild;
    const landingPill = landingWrapper?.firstElementChild;

    currentPathname = "/heritage";
    const { container: pubContainer } = render(<SiteHeaderClient user={null} isCms={false} />);
    const pubHeader = pubContainer.querySelector("header");
    const pubWrapper = pubHeader?.firstElementChild;
    const pubPill = pubWrapper?.firstElementChild;

    currentPathname = "/app";
    const user = { id: "u1", email: "kurator@silatara.test", display_name: "Budi Kurator", role: "curator" as const };
    const { container: cmsContainer } = render(<SiteHeaderClient user={user} isCms={true} />);
    const cmsHeader = cmsContainer.querySelector("header");
    const cmsWrapper = cmsHeader?.firstElementChild;
    const cmsPill = cmsWrapper?.firstElementChild;

    // Public and CMS share identical sticky transparent outer header & aligned max-w-[1440px] wrapper
    expect(pubHeader?.className).toBe(cmsHeader?.className);
    expect(pubHeader?.className).toContain("bg-transparent");
    expect(pubHeader?.className).toContain("pointer-events-none");
    expect(pubWrapper?.className).toBe(cmsWrapper?.className);
    expect(pubWrapper?.className).toContain("max-w-[1440px]");
    expect(pubWrapper?.className).toContain("px-4 pb-2.5 pt-3.5 sm:px-6 lg:px-8");
    expect(landingWrapper?.className).toContain("px-4 pb-2.5 pt-3.5 sm:px-6 lg:px-8");

    // Landing, Public, and CMS all share the exact same Warm Ivory rounded pill bar model
    expect(pubPill?.className).toBe(cmsPill?.className);
    expect(landingPill?.className).toBe(cmsPill?.className);
    expect(cmsPill?.className).toContain("bg-[#FFF8EE]/92");
    expect(cmsPill?.className).toContain("border-[#7C1D1D]/15");
    expect(cmsPill?.className).toContain("pointer-events-auto");
  });
});

describe("Batik Kawung subtle background across application shells and exclusion from navbar & footer", () => {
  it("applies uniform subtle batik Kawung class and aligned padding on standard dashboard", async () => {
    mockServerPath = "/app/manage";
    const layout = await AppLayout({ children: <div data-testid="child">Konten CMS</div> });
    const { container } = render(layout);
    const shell = container.querySelector("[data-cms-shell]");
    expect(shell).not.toBeNull();
    expect(shell?.className).toContain("bg-batik-kawung");
    expect(shell?.className).toContain("bg-[#F4F5F7]");
    const inner = shell?.firstElementChild;
    expect(inner?.className).toContain("max-w-[1440px]");
    expect(inner?.className).toContain("px-4");
    expect(inner?.className).toContain("sm:px-6");
    expect(inner?.className).toContain("lg:px-8");
  });

  it("applies uniform subtle batik Kawung class on focus practice layout", async () => {
    mockServerPath = "/lessons/gerak-1/practice";
    const layout = await AppLayout({ children: <div data-testid="child">Studio Latihan</div> });
    const { container } = render(layout);
    const shell = container.querySelector("[data-cms-shell]");
    expect(shell).not.toBeNull();
    expect(shell?.hasAttribute("data-focus-layout")).toBe(true);
    expect(shell?.className).toContain("bg-batik-kawung");
    expect(shell?.className).toContain("bg-[#F4F5F7]");
  });

  it("excludes batik pattern from SiteHeaderClient navbar wrapper and Warm Ivory pill surface", () => {
    const { container } = render(<SiteHeaderClient user={null} />);
    const header = container.querySelector("header");
    expect(header?.hasAttribute("data-site-header")).toBe(true);
    expect(header?.className).not.toContain("bg-batik-kawung");
    const pill = container.querySelector(".rounded-full.border");
    expect(pill?.className).not.toContain("bg-batik-kawung");
    expect(pill?.className).toContain("bg-[#FFF8EE]/92");
  });

  it("excludes batik pattern from SiteFooter and gives footer cohesive #3B0D0C surface", () => {
    currentPathname = "/";
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");
    expect(footer?.hasAttribute("data-site-footer")).toBe(true);
    expect(footer?.className).not.toContain("bg-batik-kawung");
    expect(footer?.className).not.toContain("bg-white");
    expect(footer?.className).toContain("bg-[#3B0D0C]");
  });
});

describe("RoleIconRail 4-role adaptive navigation", () => {
  it("learner sees only learning & practice items (no Studio, Manage, Admin)", () => {
    currentPathname = "/app";
    render(<RoleIconRail role="learner" />);
    const nav = screen.getByRole("navigation", { name: "Aplikasi" });
    expect(nav.querySelectorAll("a")).toHaveLength(7);
    expect(screen.queryByRole("link", { name: "Studio Instruktur" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Kelola Konten" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
  });

  it("instructor prioritizes Studio before Manage and hides Admin", () => {
    currentPathname = "/app/studio";
    render(<RoleIconRail role="instructor" />);
    const nav = screen.getByRole("navigation", { name: "Aplikasi" });
    const labels = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("aria-label"));
    expect(labels.indexOf("Studio Instruktur")).toBeLessThan(labels.indexOf("Kelola Konten"));
    expect(labels).not.toContain("Admin");
  });

  it("curator prioritizes Kelola Konten before Studio and hides Admin", () => {
    currentPathname = "/app/manage";
    render(<RoleIconRail role="curator" />);
    const nav = screen.getByRole("navigation", { name: "Aplikasi" });
    const labels = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("aria-label"));
    expect(labels.indexOf("Kelola Konten")).toBeLessThan(labels.indexOf("Studio Instruktur"));
    expect(labels).not.toContain("Admin");
  });

  it("admin sees Admin at top alongside all workspace items", () => {
    currentPathname = "/app/admin";
    render(<RoleIconRail role="admin" />);
    const nav = screen.getByRole("navigation", { name: "Aplikasi" });
    const labels = [...nav.querySelectorAll("a")].map((a) => a.getAttribute("aria-label"));
    expect(labels).toContain("Admin");
    expect(labels).toHaveLength(11);
    expect(labels.indexOf("Admin")).toBe(1);
  });

  it("smoothly expands/collapses desktop rail while keeping label spans mounted", async () => {
    currentPathname = "/app";
    render(<RoleIconRail role="learner" />);
    const aside = screen.getByLabelText("Navigasi ruang kerja");
    expect(aside.getAttribute("data-expanded")).toBe("false");
    expect(aside.className).toContain("w-[68px]");
    expect(aside.className).toContain("motion-reduce:transition-none");

    const toggle = screen.getByRole("button", { name: "Lebarkan sidebar" });
    await userEvent.click(toggle);
    expect(aside.getAttribute("data-expanded")).toBe("true");
    expect(aside.className).toContain("w-[228px]");
    expect(screen.getByRole("button", { name: "Ciutkan sidebar" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles mobile drawer smoothly with accessible expanded state", async () => {
    currentPathname = "/app";
    render(<RoleIconRail role="learner" />);
    const moreBtn = screen.getByRole("button", { name: "Menu lainnya" });
    expect(moreBtn.getAttribute("aria-expanded")).toBe("false");
    await userEvent.click(moreBtn);
    expect(moreBtn.getAttribute("aria-expanded")).toBe("true");
  });
});
