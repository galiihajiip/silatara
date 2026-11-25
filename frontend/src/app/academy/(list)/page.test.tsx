// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Curricula } from "@/lib/research";

const apiGetMock = vi.fn();
vi.mock("@/lib/api", () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));

import AcademyPage from "./page";

const SAMPLE_CURRICULA: Curricula = {
  disclaimer: "Pengantar umum",
  items: [
    {
      id: "crs.psdp-dasar",
      slug: "sikap-dan-gerak-dasar-pencak-silat",
      title: "Sikap & Gerak Dasar Pencak Silat",
      summary:
        "Belajar pencak silat selangkah demi selangkah, dari sikap tegak dan kuda-kuda hingga sikap pasang, arah delapan penjuru, cara melangkah, dan pola langkah.",
      level: "beginner",
      estimated_minutes: 300,
      safety_notes: "Latih perlahan.",
      tradition: "Pencak Silat Dasar Publik",
      modules: [
        { id: "m1", order: 1, title: "Pengenalan & keselamatan", summary: "", lessons: [{ slug: "pengenalan", title: "Pengenalan", description: "", duration_min: 15, order: 1 }, { slug: "keselamatan", title: "Keselamatan", description: "", duration_min: 15, order: 2 }] },
        { id: "m2", order: 2, title: "Sikap dasar berdiri", summary: "", lessons: [{ slug: "sikap-tegak", title: "Sikap tegak", description: "", duration_min: 20, order: 1 }, { slug: "sikap-istirahat", title: "Sikap istirahat", description: "", duration_min: 20, order: 2 }] },
        { id: "m3", order: 3, title: "Kuda-kuda", summary: "", lessons: [{ slug: "kuda-kuda-1", title: "Kuda-kuda 1", description: "", duration_min: 25, order: 1 }, { slug: "kuda-kuda-2", title: "Kuda-kuda 2", description: "", duration_min: 25, order: 2 }] },
        { id: "m4", order: 4, title: "Sikap duduk", summary: "", lessons: [{ slug: "sikap-duduk", title: "Sikap duduk", description: "", duration_min: 20, order: 1 }, { slug: "duduk-lanjutan", title: "Duduk lanjutan", description: "", duration_min: 20, order: 2 }] },
        { id: "m5", order: 5, title: "Sikap pasang", summary: "", lessons: [{ slug: "pasang-1", title: "Pasang 1", description: "", duration_min: 20, order: 1 }, { slug: "pasang-2", title: "Pasang 2", description: "", duration_min: 20, order: 2 }] },
        { id: "m6", order: 6, title: "Arah & cara melangkah", summary: "", lessons: [{ slug: "arah-langkah", title: "Arah langkah", description: "", duration_min: 25, order: 1 }, { slug: "cara-langkah", title: "Cara langkah", description: "", duration_min: 25, order: 2 }] },
        { id: "m7", order: 7, title: "Pola langkah", summary: "", lessons: [{ slug: "pola-langkah", title: "Pola langkah", description: "", duration_min: 25, order: 1 }] },
        { id: "m8", order: 8, title: "Pengenalan pembelaan tanpa kontak (dengan pengawasan)", summary: "", lessons: [{ slug: "pembelaan", title: "Pembelaan", description: "", duration_min: 25, order: 1 }] },
      ],
    },
    {
      id: "crs.silek-pengenalan",
      slug: "pengenalan-silek-minangkabau",
      title: "Pengenalan Silek Minangkabau (teori)",
      summary: "Kenali cara orang Minangkabau belajar silek sebagai pengetahuan dan tradisi.",
      level: "beginner",
      estimated_minutes: 40,
      safety_notes: "Kelas teori.",
      tradition: "Silek Minangkabau",
      modules: [
        { id: "s1", order: 1, title: "Silek sebagai pengetahuan", summary: "Baraja malangkah dan tiga langkah.", lessons: [{ slug: "silek-teori", title: "Silek teori", description: "", duration_min: 40, order: 1 }] },
      ],
    },
  ],
};

beforeEach(() => {
  apiGetMock.mockReset();
});

describe("AcademyPage", () => {
  it("merender banner berbingkai dengan 3 pilar, kartu Bento 2 kolom, dan strip Lanjutkan Eksplorasi", async () => {
    apiGetMock.mockResolvedValue({ ok: true, data: SAMPLE_CURRICULA });

    const { container } = render(await AcademyPage());

    expect(screen.getByText("Akademi")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Belajar pencak silat selangkah demi selangkah" })).toBeTruthy();

    const pillars = screen.getByRole("list", { name: "Metode belajar Akademi" });
    expect(within(pillars).getByText("Peraga 3D 360°")).toBeTruthy();
    expect(within(pillars).getByText("Uraian Fase")).toBeTruthy();
    expect(within(pillars).getByText("Latihan Kamera AI")).toBeTruthy();

    expect(screen.getByText("8 modul")).toBeTruthy();
    expect(screen.getByText("14 pelajaran")).toBeTruthy();
    expect(screen.getByText("5 jam")).toBeTruthy();
    expect(screen.getAllByText("Pemula")).toHaveLength(2);

    const curriculumLinks = screen.getAllByRole("link", { name: "Lihat kurikulum" });
    expect(curriculumLinks[0].getAttribute("href")).toBe("/academy/courses/sikap-dan-gerak-dasar-pencak-silat");
    expect(curriculumLinks[0].className).toContain("rounded-full");

    const startLinks = screen.getAllByRole("link", { name: "Mulai pelajaran pertama" });
    expect(startLinks[0].getAttribute("href")).toBe("/academy/courses/sikap-dan-gerak-dasar-pencak-silat/lessons/pengenalan");
    expect(startLinks[0].className).toContain("rounded-full");

    const moduleLists = container.querySelectorAll("ol");
    expect(moduleLists).toHaveLength(2);
    expect(moduleLists[0].className).toContain("sm:grid-cols-2");
    expect(moduleLists[1].className).toContain("grid-cols-1");
    expect(moduleLists[1].className).not.toContain("sm:grid-cols-2");

    expect(screen.getByText("08")).toBeTruthy();
    expect(screen.getByText("Pengenalan pembelaan tanpa kontak (dengan pengawasan)")).toBeTruthy();
    expect(screen.getByText("01–08")).toBeTruthy();

    // Lanjutkan Eksplorasi Bento strip
    const exploreSection = screen.getByRole("region", { name: "Lanjutkan Eksplorasi" });
    expect(within(exploreSection).getByRole("link", { name: /Pustaka Gerakan 3D/ }).getAttribute("href")).toBe("/library");
    expect(within(exploreSection).getByRole("link", { name: /Latihan Kamera AI/ }).getAttribute("href")).toBe("/app/practice");
    expect(within(exploreSection).getByRole("link", { name: /Peta Perguruan Nusantara/ }).getAttribute("href")).toBe("/community/peta");

    const html = container.innerHTML.toLowerCase();
    expect(html).not.toMatch(/#0b7a4b|#10945c|#315c4d|#e6f4ee|green-|emerald-|teal-|forest-/);
  });

  it("menampilkan keadaan kosong yang rapi saat daftar kursus kosong", async () => {
    apiGetMock.mockResolvedValue({ ok: false, status: 503, error: "offline" });

    render(await AcademyPage());

    expect(screen.getByText("Kurikulum belum tersedia saat ini")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Lanjutkan Eksplorasi" })).toBeTruthy();
  });
});
