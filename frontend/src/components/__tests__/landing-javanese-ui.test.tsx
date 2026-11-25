// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BatikParangPattern,
  BatikTruntumPattern,
  BatikTumpalBand,
  BorobudurEmblem,
  GununganCrown,
  GununganSilhouette,
  JavaneseCornerOrnament,
  JavaneseSectionDivider,
  KerisOrnament,
  MegaMendungPlume,
  SilatStanceEmblem,
} from "@/components/JavaneseMotifs";
import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { SunsetCloudsHero } from "@/components/landing/SunsetCloudsHero";
import { ParallaxComponent } from "@/components/ui/parallax-scrolling";
import { ScrollExpandMedia } from "@/components/ui/scroll-expansion-hero";
import { PakeliranWayangStage } from "@/components/landing/LandingScrollMotion";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockKill = vi.fn();
const mockTickerAdd = vi.fn();
const mockTickerRemove = vi.fn();
const mockLagSmoothing = vi.fn();
const mockRegisterPlugin = vi.fn();
const mockTimelineTo = vi.fn();
const mockTimelineKill = vi.fn();
const mockLenisOn = vi.fn();
const mockLenisDestroy = vi.fn();
const mockLenisRaf = vi.fn();

vi.mock("gsap", () => ({
  gsap: {
    registerPlugin: mockRegisterPlugin,
    ticker: {
      add: mockTickerAdd,
      remove: mockTickerRemove,
      lagSmoothing: mockLagSmoothing,
    },
    timeline: vi.fn(() => {
      const tl = {
        to: (...args: unknown[]) => {
          mockTimelineTo(...args);
          return tl;
        },
        kill: mockTimelineKill,
      };
      return tl;
    }),
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    update: vi.fn(),
    getAll: vi.fn(() => [{ kill: mockKill }]),
  },
}));

vi.mock("lenis", () => ({
  default: class MockLenis {
    on = mockLenisOn;
    destroy = mockLenisDestroy;
    raf = mockLenisRaf;
  },
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(async (path: string) => {
    if (path === "/research/summary") {
      return { ok: true, data: { provinces: { total: 38 }, movements: { total: 12 } } };
    }
    if (path === "/research/movements") {
      return { ok: true, data: { items: [] } };
    }
    if (path === "/research/character") {
      return { ok: true, data: { clips: [{ checks_passed: true }] } };
    }
    if (path === "/research/assessment/protocols") {
      return { ok: true, data: { items: [{ movement_id: "nusantara.kuda-kuda-tengah", status: "active" }] } };
    }
    if (path === "/directory/stats") {
      return { ok: true, data: { total_places: 24 } };
    }
    return { ok: false, data: null };
  }),
}));

describe("JavaneseMotifs", () => {
  it("mengekspor seluruh komponen motif Jawa & Nusantara dengan aria-hidden dan lolos axe-core", async () => {
    const { container } = render(
      <div>
        <GununganSilhouette />
        <GununganCrown />
        <MegaMendungPlume />
        <MegaMendungPlume flip />
        <JavaneseSectionDivider variant="priangan" />
        <JavaneseSectionDivider variant="gading" />
        <JavaneseCornerOrnament corner="tl" />
        <JavaneseCornerOrnament corner="br" />
        <BatikParangPattern />
        <BatikTruntumPattern />
        <BatikTumpalBand />
        <SilatStanceEmblem />
        <KerisOrnament />
        <BorobudurEmblem />
      </div>,
    );

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(14);
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
  });
});

describe("ParallaxComponent (GSAP + ScrollTrigger + Lenis)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menginisialisasi 4 lapisan paralaks low-poly, membersihkan ticker/ScrollTrigger/Lenis saat unmount, dan lolos axe-core", async () => {
    const { container, unmount } = render(<ParallaxComponent />);

    expect(container.querySelector("[data-parallax-layers]")).toBeTruthy();
    expect(container.querySelector('[data-parallax-layer="1"]')).toBeTruthy();
    expect(container.querySelector('[data-parallax-layer="2"]')).toBeTruthy();
    expect(container.querySelector('[data-parallax-layer="3"]')).toBeTruthy();
    expect(container.querySelector('[data-parallax-layer="4"]')).toBeTruthy();
    expect(container.querySelector('img[src*="poly-merapi-sunset-wide.jpg"]')).toBeTruthy();
    expect(container.querySelector('img[src*="poly-padepokan-wide.jpg"]')).toBeTruthy();

    await waitFor(() => {
      expect(mockRegisterPlugin).toHaveBeenCalledTimes(1);
      expect(mockTickerAdd).toHaveBeenCalledTimes(1);
      expect(mockLenisOn).toHaveBeenCalledWith("scroll", expect.any(Function));
      expect(mockTimelineTo).toHaveBeenCalledTimes(4);
    });

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);

    unmount();
    expect(mockTimelineKill).toHaveBeenCalledTimes(1);
    expect(mockKill).toHaveBeenCalledTimes(1);
    expect(mockTickerRemove).toHaveBeenCalledTimes(1);
    expect(mockLenisDestroy).toHaveBeenCalledTimes(1);
  });

  it("menghormati prefers-reduced-motion tanpa menjalankan animasi paralaks", async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = render(<ParallaxComponent />);
    await new Promise((r) => setTimeout(r, 30));
    expect(mockRegisterPlugin).not.toHaveBeenCalled();
    expect(mockTickerAdd).not.toHaveBeenCalled();

    unmount();
    window.matchMedia = originalMatchMedia;
  });
});

describe("ScrollExpandMedia (Framer Motion, Surface B #3B0D0C Batik)", () => {
  it("merender mode page-scroll tanpa mengunci scroll/window.scrollTo, memakai latar Batik #3B0D0C, membelah judul dengan overflow-x-clip, dan lolos axe-core", async () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { container } = render(
      <ScrollExpandMedia
        bgImageSrc="/landing/poly/poly-merapi-sunset-wide.jpg"
        mediaSrc="/landing/poly/poly-padepokan-wide.jpg"
        title="Panggung Padepokan Nusantara"
        date="SILATARA · PELESTARIAN & LATIHAN MANDIRI"
        mediaCaption="Padepokan Pendopo · Latihan Senja di Lereng Merapi"
        scrollToExpand="Gulir ke bawah untuk membuka panggung"
      >
        <p>Konten panggung</p>
      </ScrollExpandMedia>,
    );

    expect(screen.getByText("Panggung")).toBeTruthy();
    expect(screen.getByText("Padepokan Nusantara")).toBeTruthy();
    expect(screen.getByText("Konten panggung")).toBeTruthy();
    const sectionClass = container.querySelector("section")?.className ?? "";
    expect(sectionClass).toContain("overflow-x-clip");
    expect(sectionClass).toContain("bg-[#3B0D0C]");
    expect(scrollToSpy).not.toHaveBeenCalled();

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
    scrollToSpy.mockRestore();
  });

  it("mendukung mode wheel-lock opsional dan membersihkan event listener saat unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(
      <ScrollExpandMedia
        mode="wheel-lock"
        bgImageSrc="/landing/poly/poly-merapi-sunset-wide.jpg"
        mediaSrc="/landing/poly/poly-padepokan-wide.jpg"
        title="Panggung Padepokan Nusantara"
      />,
    );

    expect(addSpy).toHaveBeenCalledWith("wheel", expect.any(Function), { passive: false });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("wheel", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe("PakeliranWayangStage (Surface B #3B0D0C Batik)", () => {
  it("merender panggung kelir #3B0D0C dengan wayang emas & Gunungan low-poly tanpa error IntersectionObserver dan lolos axe-core", async () => {
    const { container } = render(
      <PakeliranWayangStage>
        <h2>Panggung Pakeliran</h2>
      </PakeliranWayangStage>,
    );

    const stage = screen.getByRole("region", { name: "Panggung Pakeliran SILATARA" });
    expect(stage.className).toContain("bg-[#3B0D0C]");
    expect(container.querySelector('img[src="/landing/svg/wayang-rama.svg"]')).toBeTruthy();
    expect(container.querySelector('img[src="/landing/svg/wayang-shinta.svg"]')).toBeTruthy();
    expect(container.querySelector('img[src="/landing/svg/wayang-hanoman.svg"]')).toBeTruthy();
    expect(container.querySelector('img[src="/landing/svg/wayang-garuda.svg"]')).toBeTruthy();
    expect(container.querySelector('img[src*="poly-gunungan.png"]')).toBeTruthy();

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
  });
});

describe("Landing Navbar & Hero Sequential Choreography Loop", () => {
  it("merender navbar beranda berbentuk pil membulat (rounded-full) menyatu di atas Batik Ivory tanpa strip abu-abu", async () => {
    const { container } = render(<SiteHeaderClient user={null} />);
    const header = container.querySelector("header[data-landing-header]");
    expect(header).not.toBeNull();
    expect(header?.className).toContain("fixed");
    expect(header?.className).toContain("bg-transparent");
    expect(header?.className).toContain("pointer-events-none");

    const pill = header?.querySelector(".rounded-full.pointer-events-auto");
    expect(pill).not.toBeNull();
    expect(pill?.className).toContain("bg-[#FFF8EE]/92");
    expect(pill?.className).toContain("backdrop-blur-md");

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
  });

  it("menjalankan koreografi berurutan Logo SILATARA -> Warisan Gerak -> Logo dalam panggung tinggi tetap tanpa layout shift dan membersihkan timer saat unmount", () => {
    vi.useFakeTimers();
    try {
      const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
      const { container, unmount } = render(<SunsetCloudsHero practiceHref="/library/kuda-kuda-tengah/latihan" />);

      const stage = container.querySelector("[data-hero-stage]");
      expect(stage).not.toBeNull();
      expect(stage?.getAttribute("data-hero-phase")).toBe("logo");
      expect(screen.getByRole("img", { name: "SILATARA" })).toBeTruthy();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Warisan Gerak");
      expect(container.querySelectorAll("img").length).toBe(0);

      // Beat 1 -> Beat 2 after 3.2s hold
      act(() => {
        vi.advanceTimersByTime(3250);
      });
      expect(stage?.getAttribute("data-hero-phase")).toBe("headline");

      // Beat 2 -> Beat 1 after 4.2s hold
      act(() => {
        vi.advanceTimersByTime(4250);
      });
      expect(stage?.getAttribute("data-hero-phase")).toBe("logo");

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Landing Page (Home) - Strict 2-Color Batik System", () => {
  it(
    "merender logo SILATARA besar di hero, sistem 2 warna Batik (#FFF8EE & #3B0D0C), 6 aset low-poly, serta menghapus AtmosphericSkyTransition dan Tahapan Belajar",
    async () => {
      const { default: Home } = await import("@/app/page");
      const ui = await Home();
      const { container } = render(ui);

      // Hero brand logo + kinetic headline (old small pill removed)
      expect(screen.getByRole("img", { name: "SILATARA" })).toBeTruthy();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Warisan");
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Bergerak");
      expect(screen.queryByText(/Pencak Silat Nusantara · Terbuka untuk Semua/i)).toBeNull();

      // Deleted sections (Image #1 AtmosphericSkyTransition & Image #2 Tahapan Belajar)
      expect(screen.queryByText(/Tahapan Belajar/i)).toBeNull();
      expect(screen.queryByText(/Jalur Belajar yang Sederhana/i)).toBeNull();
      expect(container.innerHTML).not.toContain("animate-bird-glide");
      expect(container.innerHTML).not.toContain("animate-wind-flow");

      // Strict 2-color Batik surface markers (#FFF8EE Ivory Batik & #3B0D0C Royal Maroon Batik)
      expect(container.querySelector("[data-landing-page]")).toBeTruthy();
      expect(container.innerHTML).toContain("bg-[#FFF8EE]");
      expect(container.innerHTML).toContain("bg-[#3B0D0C]");

      // Verify ScrollExpandMedia Panggung Padepokan Nusantara + all 6 faceted low-poly assets
      expect(screen.getByRole("region", { name: "Panggung Padepokan Nusantara" })).toBeTruthy();
      expect(container.querySelector('img[src*="poly-merapi-sunset-wide.jpg"]')).toBeTruthy();
      expect(container.querySelector('img[src*="poly-padepokan-wide.jpg"]')).toBeTruthy();
      expect(container.querySelector('img[src*="poly-kuda-kuda.png"]')).toBeTruthy();
      expect(container.querySelector('img[src*="poly-tendangan.png"]')).toBeTruthy();
      expect(container.querySelector('img[src*="poly-gunungan.png"]')).toBeTruthy();
      expect(container.querySelector('img[src*="poly-wayang-kesatria.png"]')).toBeTruthy();

      // Verify zero crude OpenClipart volcano/mountain SVGs remain on the landing page
      expect(container.querySelector('img[src*="volcano-abstract-openclipart.svg"]')).toBeNull();
      expect(container.querySelector('img[src*="mountain-landscape-silhouette-openclipart.svg"]')).toBeNull();

      // Verify lazy Wayang SVGs inside Pakeliran stage (all 4 wayang figures)
      const wayangRama = container.querySelector('img[src="/landing/svg/wayang-rama.svg"]');
      const wayangShinta = container.querySelector('img[src="/landing/svg/wayang-shinta.svg"]');
      const wayangHanoman = container.querySelector('img[src="/landing/svg/wayang-hanoman.svg"]');
      const wayangGaruda = container.querySelector('img[src="/landing/svg/wayang-garuda.svg"]');
      expect(wayangRama).toBeTruthy();
      expect(wayangShinta).toBeTruthy();
      expect(wayangHanoman).toBeTruthy();
      expect(wayangGaruda).toBeTruthy();
      expect(wayangRama?.getAttribute("aria-hidden")).toBe("true");
      expect(wayangRama?.getAttribute("loading")).toBe("lazy");

      // Verify zero deprecated greens and zero em-dashes
      const html = container.innerHTML;
      expect(html).not.toMatch(/#0B7A4B|#10945C|#315C4D|#E6F4EE/i);
      expect(html).not.toMatch(/\b(emerald|green|teal)-/);
      expect(container.textContent).not.toContain("—");

      const a11y = await axe.run(container);
      expect(a11y.violations).toEqual([]);
    },
    15_000,
  );
});
