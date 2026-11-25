// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DirectoryStats, Facets } from "@/lib/directory";

const apiGetMock = vi.fn();
vi.mock("@/lib/api", () => ({ apiGet: (...args: unknown[]) => apiGetMock(...args) }));
vi.mock("@/components/directory/DirectoryExplorer", () => ({ DirectoryExplorer: () => <div data-testid="explorer" /> }));

import { RegionBreakdownTabs } from "@/components/directory/RegionBreakdownTabs";
import DirectoryMapPage from "@/app/community/peta/page";

const pad = (n: number) => String(n).padStart(2, "0");

function makeStats(): DirectoryStats {
  return {
    total_places: 200, training_locations: 150, provinces_with_places: 12, provinces_total: 14,
    regencies_with_places: 60, regencies_total: 500,
    by_province: [
      ...Array.from({ length: 12 }, (_, i) => ({ code: pad(i + 11), name: `Provinsi ${String.fromCharCode(65 + i)}`, count: 30 - i })),
      { code: "91", name: "Papua Kosong", count: 0 },
      { code: "92", name: "Papua Sepi", count: 0 },
    ],
    regencies_multi: Array.from({ length: 20 }, (_, i) => ({ code: `${pad(11 + (i % 12))}${pad(i + 1)}`, name: `Kabupaten Wilayah${String.fromCharCode(65 + i)}`, count: 20 - i })),
    by_category: [{ key: "padepokan", label: "Padepokan", count: 40 }, { key: "ipsi", label: "Organisasi IPSI", count: 9 }],
    by_precision: [],
    by_organization: [{ key: "ipsi", name: "Ikatan Pencak Silat Indonesia", short_name: "IPSI", count: 30 }],
    featured: Array.from({ length: 4 }, (_, i) => ({
      slug: `tempat-${i}`, name: `Tempat Unggulan ${i}`, category: "padepokan", category_label: "Padepokan",
      organization: null, province_code: "11", province: "Aceh", regency_code: "1101", regency: "Kabupaten Simeulue",
      district: null, address: null, locality_text: null, lat: 0, lng: 0, precision: "exact", precision_label: "Titik tepat",
      is_training_location: true, is_organization_office: false, website: null, has_contact: false, has_schedule: false,
      operational_status: "active", source_types: ["osm"], source_count: 2, attribution: null, completeness: 0.9,
    })) as DirectoryStats["featured"],
    heritage_areas: 0,
    note: "Angka adalah lokasi yang terdata di SILATARA dari sumber yang dapat ditelusuri, bukan jumlah seluruh perguruan atau ukuran popularitas.",
    attribution: ["OpenStreetMap"],
  };
}

afterEach(cleanup);

describe("RegionBreakdownTabs", () => {
  it("renders 3 tabs with Per Wilayah active by default", () => {
    render(<RegionBreakdownTabs stats={makeStats()} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Per Wilayah", "Jenis & Induk", "Lokasi Terlengkap"]);
    expect(screen.getByRole("tab", { name: "Per Wilayah" })).toHaveProperty("ariaSelected", "true");
    expect(screen.getByText("Lokasi terdata per provinsi")).toBeTruthy();
    expect(screen.getByText("Kabupaten/kota dengan beberapa lokasi")).toBeTruthy();
    expect(screen.queryByText("Menurut jenis tempat")).toBeNull();
  });

  it("caps provinces at Top 8 and toggles expand/collapse", async () => {
    const user = userEvent.setup();
    render(<RegionBreakdownTabs stats={makeStats()} />);
    const card = () => screen.getByText("Lokasi terdata per provinsi").closest("section") as HTMLElement;
    expect(within(card()).getAllByRole("listitem")).toHaveLength(8);
    expect(within(card()).getByText(/Belum ada lokasi terdata di 2 provinsi\./)).toBeTruthy();
    await user.click(within(card()).getByRole("button", { name: "Lihat semua provinsi" }));
    expect(within(card()).getAllByRole("listitem")).toHaveLength(12);
    expect(within(card()).getByText(/Papua Kosong, Papua Sepi/)).toBeTruthy();
    await user.click(within(card()).getByRole("button", { name: "Ringkas" }));
    expect(within(card()).getAllByRole("listitem")).toHaveLength(8);
  });

  it("caps kabupaten/kota at Top 12, keeps map links, expands with quick filter", async () => {
    const user = userEvent.setup();
    render(<RegionBreakdownTabs stats={makeStats()} />);
    const card = () => screen.getByText("Kabupaten/kota dengan beberapa lokasi").closest("section") as HTMLElement;
    expect(within(card()).getAllByRole("listitem")).toHaveLength(12);
    expect(within(card()).queryByRole("searchbox")).toBeNull();
    const first = within(card()).getAllByRole("link")[0];
    expect(first.getAttribute("href")).toMatch(/^\/community\/peta\?provinsi=\d{2}&kabkota=\d{4}$/);
    await user.click(within(card()).getByRole("button", { name: "Lihat semua" }));
    expect(within(card()).getAllByRole("listitem")).toHaveLength(20);
    await user.type(within(card()).getByRole("searchbox", { name: "Cari kabupaten/kota" }), "wilayaht");
    expect(within(card()).getAllByRole("listitem")).toHaveLength(1);
    await user.click(within(card()).getByRole("button", { name: "Ringkas" }));
    expect(within(card()).getAllByRole("listitem")).toHaveLength(12);
    expect(within(card()).queryByRole("searchbox")).toBeNull();
  });

  it("shows Jenis & Induk as two cards with filter links", async () => {
    const user = userEvent.setup();
    render(<RegionBreakdownTabs stats={makeStats()} />);
    await user.click(screen.getByRole("tab", { name: "Jenis & Induk" }));
    expect(screen.getByText("Menurut jenis tempat")).toBeTruthy();
    expect(screen.getByText("Menurut perguruan/organisasi induk")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Padepokan" }).getAttribute("href")).toBe("/community/peta?jenis=padepokan");
    expect(screen.getByRole("link", { name: "IPSI · 30" }).getAttribute("href")).toBe("/community/peta?organisasi=ipsi");
    expect(screen.queryByText("Lokasi terdata per provinsi")).toBeNull();
  });

  it("shows Lokasi Terlengkap as a responsive grid linking to detail pages", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegionBreakdownTabs stats={makeStats()} />);
    await user.click(screen.getByRole("tab", { name: "Lokasi Terlengkap" }));
    const grid = container.querySelector("ul.grid") as HTMLElement;
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("md:grid-cols-2");
    expect(grid.className).toContain("lg:grid-cols-3");
    expect(screen.getByRole("link", { name: "Tempat Unggulan 2" }).getAttribute("href")).toBe("/community/tempat/tempat-2");
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("uses maroon active tab and no deprecated greens or em dashes", () => {
    const { container } = render(<RegionBreakdownTabs stats={makeStats()} />);
    const html = container.innerHTML;
    expect(html).toContain("from-[#4A0E0E]");
    expect(html).toContain("to-[#9B2C10]");
    expect(html).not.toMatch(/#0b7a4b|#10945c|#315c4d|#e6f4ee|green-|emerald-|teal-/i);
    expect(container.textContent).not.toContain("\u2014");
  });
});

describe("/community/peta page copy", () => {
  it("drops the verbose disclaimer subtitles", async () => {
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/directory/stats") return { ok: true, data: makeStats() };
      return { ok: true, data: { provinces: [], regencies: [], categories: [], organizations: [], activities: [], precisions: [] } satisfies Facets };
    });
    const ui = await DirectoryMapPage({ searchParams: Promise.resolve({}) });
    const { container } = render(ui);
    const text = container.textContent ?? "";
    expect(screen.getByRole("heading", { level: 1, name: "Temukan tempat belajar pencak silat" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Jelajahi menurut wilayah" })).toBeTruthy();
    expect(text).not.toMatch(/bukan di titik tebakan/);
    expect(text).not.toMatch(/bukan jumlah seluruh perguruan/);
    expect(text).not.toMatch(/bukan menurut mutu perguruan/);
    expect(text).not.toContain("\u2014");
  });
});
