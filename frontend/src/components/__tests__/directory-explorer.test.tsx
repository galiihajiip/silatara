// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DirectoryExplorer } from "@/components/directory/DirectoryExplorer";
import type { Facets, PlaceSummary } from "@/lib/directory";

const mockMap = {
  fitBounds: vi.fn().mockReturnThis(),
  setView: vi.fn().mockReturnThis(),
  getZoom: vi.fn().mockReturnValue(6),
  getBounds: vi.fn().mockReturnValue({
    getWest: () => 95,
    getSouth: () => -10,
    getEast: () => 140,
    getNorth: () => 6,
  }),
  on: vi.fn(),
  remove: vi.fn(),
};

const mockLayerGroup = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn().mockReturnThis(),
  remove: vi.fn(),
};

const mockMarker = {
  addTo: vi.fn().mockReturnThis(),
  bindPopup: vi.fn().mockReturnThis(),
  bindTooltip: vi.fn().mockReturnThis(),
  openPopup: vi.fn(),
  on: vi.fn(),
};

const mockLeaflet = {
  map: vi.fn(() => mockMap),
  tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
  layerGroup: vi.fn(() => mockLayerGroup),
  marker: vi.fn(() => mockMarker),
  divIcon: vi.fn(() => ({})),
  circle: vi.fn(() => ({ bindPopup: vi.fn().mockReturnThis(), addTo: vi.fn() })),
  circleMarker: vi.fn(() => ({ bindTooltip: vi.fn().mockReturnThis(), addTo: vi.fn() })),
};

vi.mock("leaflet", () => ({
  default: mockLeaflet,
  ...mockLeaflet,
}));

const mockApiGet = vi.fn();
vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}));

const mockFacets: Facets = {
  provinces: [
    { code: "35", name: "Jawa Timur", count: 42, bbox: [110.8, -8.8, 114.6, -6.7] },
    { code: "32", name: "Jawa Barat", count: 28, bbox: [106.3, -7.8, 108.8, -5.9] },
  ],
  regencies: [
    { code: "35.19", name: "Kab. Madiun", province_code: "35", count: 25, bbox: null },
    { code: "35.77", name: "Kota Madiun", province_code: "35", count: 17, bbox: null },
  ],
  categories: [
    { key: "perguruan_center", label: "Pusat Perguruan", count: 15 },
    { key: "padepokan", label: "Padepokan", count: 12 },
  ],
  organizations: [
    { key: "psht", name: "Persaudaraan Setia Hati Terate", short_name: "PSHT", count: 30 },
  ],
  activities: [
    { key: "training", label: "Tempat latihan" },
    { key: "office", label: "Kantor organisasi" },
  ],
  precisions: [
    { key: "exact", label: "Titik tempat" },
    { key: "regency", label: "Tingkat kabupaten/kota" },
  ],
};

const mockPlaces: PlaceSummary[] = [
  {
    slug: "padepokan-agung-psht-madiun",
    name: "Padepokan Agung PSHT Pusat Madiun",
    category: "padepokan",
    category_label: "Padepokan",
    organization: { key: "psht", name: "Persaudaraan Setia Hati Terate", short_name: "PSHT" },
    province_code: "35",
    province: "Jawa Timur",
    regency_code: "35.77",
    regency: "Kota Madiun",
    district: "Taman",
    address: "Jl. Merak No. 10, Kota Madiun",
    locality_text: null,
    lat: -7.63,
    lng: 111.53,
    precision: "exact",
    precision_label: "Titik tempat",
    is_training_location: true,
    is_organization_office: true,
    website: "https://shterate.or.id",
    has_contact: true,
    has_schedule: true,
    operational_status: "active_confirmed",
    source_types: ["Situs resmi", "OpenStreetMap"],
    source_count: 2,
    attribution: "© kontributor OpenStreetMap (ODbL 1.0)",
  },
  {
    slug: "ranting-madiun-selatan",
    name: "Ranting Madiun Selatan",
    category: "perguruan_branch",
    category_label: "Cabang Perguruan",
    organization: { key: "psht", name: "Persaudaraan Setia Hati Terate", short_name: "PSHT" },
    province_code: "35",
    province: "Jawa Timur",
    regency_code: "35.19",
    regency: "Kab. Madiun",
    district: "Geger",
    address: null,
    locality_text: "Kecamatan Geger",
    lat: -7.70,
    lng: 111.55,
    precision: "regency",
    precision_label: "Tingkat kabupaten/kota",
    is_training_location: true,
    is_organization_office: false,
    website: null,
    has_contact: false,
    has_schedule: false,
    operational_status: "active_unverified",
    source_types: ["Daftar peta"],
    source_count: 1,
    attribution: null,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockApiGet.mockImplementation((path: string) => {
    if (path.startsWith("/directory/places")) {
      return Promise.resolve({
        ok: true,
        data: { mode: "points", total: 2, clusters: [], items: mockPlaces },
        status: 200,
      });
    }
    if (path.startsWith("/directory/list")) {
      return Promise.resolve({
        ok: true,
        data: { total: 2, items: mockPlaces },
        status: 200,
      });
    }
    if (path.startsWith("/directory/facets")) {
      return Promise.resolve({
        ok: true,
        data: mockFacets,
        status: 200,
      });
    }
    if (path.startsWith("/directory/heritage-areas")) {
      return Promise.resolve({
        ok: true,
        data: { items: [] },
        status: 200,
      });
    }
    return Promise.resolve({ ok: false, error: "Not found", status: 404 });
  });
});

describe("DirectoryExplorer", () => {
  it("merender peta lebar penuh di bagian atas dengan tinggi yang lega dan bingkai Bento rounded-[24px]", async () => {
    render(<DirectoryExplorer facets={mockFacets} initialParams="" />);

    const mapRegion = screen.getByRole("region", { name: "Peta lokasi pencak silat di Indonesia" });
    expect(mapRegion).toBeTruthy();

    // Pastikan kelas peta lebar penuh dan tinggi lega
    expect(mapRegion.className).toContain("w-full");
    expect(mapRegion.className).toContain("h-[360px]");
    expect(mapRegion.className).toContain("sm:h-[420px]");
    expect(mapRegion.className).toContain("lg:h-[480px]");

    // Pastikan bingkai Bento memiliki rounded-[24px] dan border
    const bentoFrame = mapRegion.parentElement;
    expect(bentoFrame?.className).toContain("rounded-[24px]");
    expect(bentoFrame?.className).toContain("border");
    expect(bentoFrame?.className).toContain("bg-parchment-100");
  });

  it("merender kontrol pencarian & filter kompak (cari nama, provinsi, status verifikasi)", async () => {
    render(<DirectoryExplorer facets={mockFacets} initialParams="" />);

    expect(screen.getByLabelText("Cari nama atau wilayah")).toBeTruthy();
    expect(screen.getByLabelText("Provinsi")).toBeTruthy();
    expect(screen.getByLabelText("Kabupaten / Kota")).toBeTruthy();
    expect(screen.getByLabelText("Status verifikasi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cari" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Saringan lanjutan/i })).toBeTruthy();
  });

  it("merender daftar kartu tempat di bawah peta dalam grid responsif dengan status awal ringkas", async () => {
    const { container } = render(<DirectoryExplorer facets={mockFacets} initialParams="" />);

    await waitFor(() => {
      expect(screen.getByText("Padepokan Agung PSHT Pusat Madiun")).toBeTruthy();
      expect(screen.getByText("Ranting Madiun Selatan")).toBeTruthy();
    });

    // Pastikan kontainer grid responsif md:grid-cols-2 lg:grid-cols-3
    const grid = container.querySelector("ul.grid");
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("md:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-3");

    // Pastikan status badge verifikasi tertera di masing-masing kartu ringkas
    expect(screen.getByText("Terverifikasi")).toBeTruthy();
    expect(screen.getAllByText("Belum terverifikasi").length).toBeGreaterThanOrEqual(1);

    // Dalam kondisi ringkas, alamat lengkap belum dimuat di DOM
    expect(screen.queryByText(/Jl\. Merak No\. 10/)).toBeNull();

    // Kedua kartu memiliki tombol 'Lihat lengkap' dengan aria-expanded='false'
    const toggleButtons = screen.getAllByRole("button", { name: /Lihat lengkap/i });
    expect(toggleButtons.length).toBe(2);
    expect(toggleButtons[0].getAttribute("aria-expanded")).toBe("false");
    expect(toggleButtons[1].getAttribute("aria-expanded")).toBe("false");
  });

  it("melakukan ekspansi HANYA pada kartu yang ditekan dan mereduksi kembali saat diklik lagi", async () => {
    render(<DirectoryExplorer facets={mockFacets} initialParams="" />);

    await waitFor(() => {
      expect(screen.getByText("Padepokan Agung PSHT Pusat Madiun")).toBeTruthy();
    });

    const toggleButtons = screen.getAllByRole("button", { name: /Lihat lengkap/i });
    const card1Toggle = toggleButtons[0];
    const card2Toggle = toggleButtons[1];

    // Klik expand pada kartu pertama
    await userEvent.click(card1Toggle);

    // Kartu 1 sekarang expanded
    expect(card1Toggle.getAttribute("aria-expanded")).toBe("true");
    expect(card1Toggle.textContent).toContain("Ringkas");
    expect(screen.getByText(/Jl\. Merak No\. 10, Kota Madiun/)).toBeTruthy();
    expect(screen.getByText("shterate.or.id")).toBeTruthy();
    expect(screen.getByText(/Presisi:/)).toBeTruthy();

    // Kartu 2 TETAP ringkas (tidak terpengaruh)
    expect(card2Toggle.getAttribute("aria-expanded")).toBe("false");
    expect(card2Toggle.textContent).toContain("Lihat lengkap");
    expect(screen.queryByText(/Kecamatan Geger/)).toBeNull();

    // Klik lagi kartu 1 untuk collapse kembali
    await userEvent.click(card1Toggle);
    expect(card1Toggle.getAttribute("aria-expanded")).toBe("false");
    expect(card1Toggle.textContent).toContain("Lihat lengkap");
    expect(screen.queryByText(/Jl\. Merak No\. 10, Kota Madiun/)).toBeNull();
  });

  it("tidak menggunakan hex hijau terlarang pada elemen UI", async () => {
    const { container } = render(<DirectoryExplorer facets={mockFacets} initialParams="" />);

    await waitFor(() => {
      expect(screen.getByText("Padepokan Agung PSHT Pusat Madiun")).toBeTruthy();
    });

    const html = container.innerHTML;
    expect(html).not.toMatch(/#0b7a4b|#10945c|#315c4d|#e6f4ee|#0f766e/);
  });
});
