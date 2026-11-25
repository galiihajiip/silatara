// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { ProvinceExplorer } from "@/components/heritage/ProvinceExplorer";
import {
  cleanTraditionSummary,
  TraditionShowcaseCard,
} from "@/components/heritage/TraditionShowcaseCard";
import {
  getProvinceRegion,
  getRegionLabel,
  ISLAND_REGIONS,
  type IslandRegionKey,
} from "@/components/heritage/province-regions";
import type { Coverage, Entity, TraditionItem } from "@/lib/research";

const ALL_38_PROVINCES: { name: string; expected: IslandRegionKey }[] = [
  { name: "Aceh", expected: "sumatera" },
  { name: "Sumatera Utara", expected: "sumatera" },
  { name: "Sumatera Barat", expected: "sumatera" },
  { name: "Riau", expected: "sumatera" },
  { name: "Kepulauan Riau", expected: "sumatera" },
  { name: "Jambi", expected: "sumatera" },
  { name: "Sumatera Selatan", expected: "sumatera" },
  { name: "Kepulauan Bangka Belitung", expected: "sumatera" },
  { name: "Bengkulu", expected: "sumatera" },
  { name: "Lampung", expected: "sumatera" },
  { name: "DKI Jakarta", expected: "jawa" },
  { name: "Jawa Barat", expected: "jawa" },
  { name: "Banten", expected: "jawa" },
  { name: "Jawa Tengah", expected: "jawa" },
  { name: "DI Yogyakarta", expected: "jawa" },
  { name: "Jawa Timur", expected: "jawa" },
  { name: "Bali", expected: "bali-nusa-tenggara" },
  { name: "Nusa Tenggara Barat", expected: "bali-nusa-tenggara" },
  { name: "Nusa Tenggara Timur", expected: "bali-nusa-tenggara" },
  { name: "Kalimantan Barat", expected: "kalimantan" },
  { name: "Kalimantan Tengah", expected: "kalimantan" },
  { name: "Kalimantan Selatan", expected: "kalimantan" },
  { name: "Kalimantan Timur", expected: "kalimantan" },
  { name: "Kalimantan Utara", expected: "kalimantan" },
  { name: "Sulawesi Utara", expected: "sulawesi" },
  { name: "Gorontalo", expected: "sulawesi" },
  { name: "Sulawesi Tengah", expected: "sulawesi" },
  { name: "Sulawesi Barat", expected: "sulawesi" },
  { name: "Sulawesi Selatan", expected: "sulawesi" },
  { name: "Sulawesi Tenggara", expected: "sulawesi" },
  { name: "Maluku", expected: "maluku-papua" },
  { name: "Maluku Utara", expected: "maluku-papua" },
  { name: "Papua", expected: "maluku-papua" },
  { name: "Papua Barat", expected: "maluku-papua" },
  { name: "Papua Selatan", expected: "maluku-papua" },
  { name: "Papua Tengah", expected: "maluku-papua" },
  { name: "Papua Pegunungan", expected: "maluku-papua" },
  { name: "Papua Barat Daya", expected: "maluku-papua" },
];

const SAMPLE_PROVINCES: Coverage["provinces"] = [
  {
    name: "Sumatera Barat",
    status: "sources_adequate",
    gap: "Konsep langkah terdokumentasi sebagai konsep.",
    entities: [
      { id: "ent.silek", name: "Silek Minangkabau", category: "tradition" },
      { id: "ent.sasaran", name: "Sasaran Silek", category: "training_place" },
    ],
  },
  {
    name: "Jawa Barat",
    status: "sources_adequate",
    gap: "Kajian Cimande perlu dilanjutkan.",
    entities: [{ id: "ent.maenpo", name: "Maenpo Cikalong", category: "style" }],
  },
  {
    name: "Bali",
    status: "sources_limited",
    gap: "Hanya cuplikan.",
    entities: [{ id: "ent.tengklung", name: "Tengklung", category: "tradition" }],
  },
  {
    name: "Gorontalo",
    status: "sources_limited",
    gap: "Perlu rujukan primer tambahan.",
    entities: [{ id: "ent.langga", name: "Langga", category: "regional_term" }],
  },
  {
    name: "Papua",
    status: "no_documentation_found",
    gap: "Belum ditemukan dokumentasi tradisi.",
    entities: [],
  },
];

const SAMPLE_ENTITIES: Entity[] = [
  {
    id: "ent.silek",
    name: "Silek Minangkabau",
    category: "tradition",
    provinces: ["Sumatera Barat"],
    localities: ["Tanah Datar"],
    verification: "source_backed",
    notes: "Tradisi silat Minangkabau yang diajarkan di surau dan sasaran.",
    sources: [{ id: "src.1", citation: "Ediwar 2023" }],
  },
  {
    id: "ent.sasaran",
    name: "Sasaran Silek",
    category: "training_place",
    provinces: ["Sumatera Barat"],
    verification: "source_backed",
    sources: [{ id: "src.1", citation: "Ediwar 2023" }],
  },
  {
    id: "ent.maenpo",
    name: "Maenpo Cikalong",
    category: "style",
    provinces: ["Jawa Barat"],
    localities: ["Cianjur"],
    verification: "source_backed",
    sources: [{ id: "src.2", citation: "UNESCO 2019" }],
  },
  {
    id: "ent.langga",
    name: "Langga",
    category: "regional_term",
    provinces: ["Gorontalo"],
    verification: "source_backed",
    notes: "Seni bela diri tradisional khas Gorontalo.",
    sources: [{ id: "src.3", citation: "Kemendikbud 2018" }],
  },
];

describe("province-regions mapping", () => {
  it("memetakan seluruh 38 provinsi Indonesia ke 6 gugus pulau dengan tepat", () => {
    expect(ALL_38_PROVINCES).toHaveLength(38);
    expect(ISLAND_REGIONS).toHaveLength(6);
    for (const p of ALL_38_PROVINCES) {
      expect(getProvinceRegion(p.name), p.name).toBe(p.expected);
    }
  });

  it("mendukung slug dan fallback aman untuk provinsi tak dikenal", () => {
    expect(getProvinceRegion("dki-jakarta")).toBe("jawa");
    expect(getProvinceRegion("kepulauan-bangka-belitung")).toBe("sumatera");
    expect(getProvinceRegion("Provinsi Baru Masa Depan")).toBe("lainnya");
    expect(getRegionLabel("lainnya")).toBe("Wilayah Lainnya");
  });
});

describe("ProvinceExplorer", () => {
  it("secara default menampilkan provinsi tercatat dan bisa beralih ke Semua", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    expect(
      screen.getByRole("button", { name: "Tercatat (4)" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("button", { name: /^Sumatera Barat/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Papua/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Semua (5)" }));
    expect(screen.getByRole("button", { name: /^Papua/ })).toBeTruthy();
    expect(screen.getByText("Menampilkan 5 dari 5 provinsi")).toBeTruthy();
  });

  it("menyaring provinsi berdasarkan gugus pulau dan kotak pencarian", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);
    const regionGroup = screen.getByRole("group", {
      name: "Saring berdasarkan pulau atau gugus wilayah",
    });

    await user.click(within(regionGroup).getByRole("button", { name: /^Jawa/ }));
    expect(screen.getByRole("button", { name: /^Jawa Barat/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Sumatera Barat/ })).toBeNull();

    await user.click(within(regionGroup).getByRole("button", { name: /^Semua/ }));
    await user.type(screen.getByLabelText("Cari provinsi atau tradisi"), "tengklung");
    expect(screen.getByRole("button", { name: /^Bali 1 catatan$/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Jawa Barat/ })).toBeNull();

    await user.clear(screen.getByLabelText("Cari provinsi atau tradisi"));
    await user.type(screen.getByLabelText("Cari provinsi atau tradisi"), "zzzzzz");
    expect(screen.getByText(/Tidak ada provinsi yang cocok/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Tampilkan semua provinsi" }));
    expect(screen.getByRole("button", { name: /^Papua/ })).toBeTruthy();
  });

  it("merender grid ringkas terpadu tanpa mengulang 6 heading gugus pulau bertumpuk vertikal", () => {
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    // Tidak boleh ada heading h3 gugus pulau di dalam area daftar (Sumatera, Jawa, dsb) yang menumpuk vertikal
    expect(screen.queryByRole("heading", { level: 3, name: "Sumatera" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 3, name: "Jawa" })).toBeNull();
    expect(screen.queryByRole("heading", { level: 3, name: "Kalimantan" })).toBeNull();
  });

  it("membatasi grid ringkas pada 12 kartu dan menyediakan tombol perluas saat jumlah provinsi banyak", async () => {
    const user = userEvent.setup();
    // Buat data 15 provinsi tercatat
    const manyProvinces: Coverage["provinces"] = Array.from({ length: 15 }, (_, i) => ({
      name: `Provinsi Uji ${i + 1}`,
      status: "sources_adequate" as const,
      gap: "",
      entities: [{ id: `ent.${i}`, name: `Tradisi ${i + 1}`, category: "tradition" }],
    }));

    render(<ProvinceExplorer provinces={manyProvinces} entities={[]} />);

    // Harus menampilkan tombol Tampilkan semua 15 provinsi
    const expandBtn = screen.getByRole("button", { name: /Tampilkan semua 15 provinsi/i });
    expect(expandBtn).toBeTruthy();

    // Kartu ke-13 tidak boleh tampak sebelum diperluas
    expect(screen.queryByRole("button", { name: /^Provinsi Uji 13/ })).toBeNull();

    // Klik tombol perluas
    await user.click(expandBtn);
    expect(screen.getByRole("button", { name: /^Provinsi Uji 13/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Tampilkan lebih sedikit/i })).toBeTruthy();

    // Klik tombol ciutkan
    await user.click(screen.getByRole("button", { name: /Tampilkan lebih sedikit/i }));
    expect(screen.queryByRole("button", { name: /^Provinsi Uji 13/ })).toBeNull();
  });

  it("membuka Accessible Modal Dialog saat kartu provinsi diklik dan dapat ditutup via tombol Tutup", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    // Tidak ada modal terbuka sebelum diklik
    expect(screen.queryByRole("dialog")).toBeNull();

    // Klik kartu Sumatera Barat
    await user.click(screen.getByRole("button", { name: /Sumatera Barat/ }));

    // Modal dialog harus muncul dengan role="dialog" dan aria-modal="true"
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    // Di dalam modal: eyebrow status & wilayah, judul provinsi
    expect(within(dialog).getByText(/Sumatera · Terdokumentasi baik/i)).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Sumatera Barat" })).toBeTruthy();

    // Tradisi, nama entitas, dan tradisi tag
    expect(within(dialog).getByText("Silek Minangkabau")).toBeTruthy();
    expect(within(dialog).getByText(/Tradisi · Tanah Datar/)).toBeTruthy();

    // Catatan riset (Yang sedang kami dalami)
    expect(within(dialog).getByText(/Konsep langkah terdokumentasi/)).toBeTruthy();

    // Tautan lembaga ke peta
    expect(
      within(dialog)
        .getByRole("link", { name: /Perguruan & lembaga di Sumatera Barat/ })
        .getAttribute("href"),
    ).toBe("/community/peta");

    // Tutup modal via tombol Tutup
    const closeButtons = within(dialog).getAllByRole("button", { name: /Tutup/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    await user.click(closeButtons[0]);

    // Modal tertutup
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("dapat menutup Modal Dialog via tombol keyboard Escape", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    await user.click(screen.getByRole("button", { name: /Sumatera Barat/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Tekan tombol Escape
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("dapat menutup Modal Dialog via klik pada area backdrop", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    await user.click(screen.getByRole("button", { name: /Sumatera Barat/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Klik backdrop
    const backdrop = screen.getByTestId("province-modal-backdrop");
    await user.click(backdrop);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("menampilkan Sebutan lokal secara jelas di dalam modal dialog provinsi", async () => {
    const user = userEvent.setup();
    render(<ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />);

    // Klik Gorontalo yang memiliki entitas regional_term Langga
    await user.click(screen.getByRole("button", { name: /Gorontalo/ }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Gorontalo" })).toBeTruthy();
    expect(within(dialog).getAllByText(/Sebutan lokal/i).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Langga").length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/Seni bela diri tradisional khas Gorontalo/)).toBeTruthy();
  });

  it("otomatis membuka Modal filter Semua bila initialSelected adalah provinsi yang masih ditelusuri", () => {
    render(
      <ProvinceExplorer
        provinces={SAMPLE_PROVINCES}
        entities={SAMPLE_ENTITIES}
        initialSelected="Papua"
      />,
    );
    expect(screen.getByRole("button", { name: "Semua (5)" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "Papua" })).toBeTruthy();
    expect(
      within(dialog).getByText(/Kami masih menelusuri tradisi pencak silat di provinsi ini/),
    ).toBeTruthy();
  });

  it("menampilkan grup fallback Wilayah Lainnya bila ada provinsi yang belum dipetakan", () => {
    const withUnknown: Coverage["provinces"] = [
      ...SAMPLE_PROVINCES,
      { name: "Provinsi Baru", status: "sources_limited", gap: "", entities: [] },
    ];
    render(<ProvinceExplorer provinces={withUnknown} entities={SAMPLE_ENTITIES} />);
    expect(screen.getByRole("button", { name: /Wilayah Lainnya/ })).toBeTruthy();
  });

  it("lolos pemeriksaan aksesibilitas axe-core saat modal tertutup dan saat terbuka", async () => {
    const { container, rerender } = render(
      <ProvinceExplorer provinces={SAMPLE_PROVINCES} entities={SAMPLE_ENTITIES} />,
    );
    // Aksesibilitas saat modal tertutup
    const resultsClosed = await axe.run(container);
    expect(resultsClosed.violations).toEqual([]);

    // Aksesibilitas saat modal terbuka
    rerender(
      <ProvinceExplorer
        provinces={SAMPLE_PROVINCES}
        entities={SAMPLE_ENTITIES}
        initialSelected="Sumatera Barat"
      />,
    );
    const resultsOpen = await axe.run(container);
    expect(resultsOpen.violations).toEqual([]);
  });
});

describe("TraditionShowcaseCard", () => {
  it("menampilkan pita aksen wilayah, judul, ringkasan 2 baris bersih tanpa sitasi penulis, pil statistik, dan tautan telusuri", () => {
    const tradition: TraditionItem = {
      slug: "pencak-silat-dasar-pendidikan",
      name: "Teknik Dasar Pencak Silat",
      local_name: "Silek",
      region: "Nasional",
      public_summary:
        "Sikap dan gerak dasar pencak silat sebagaimana diajarkan dalam pendidikan jasmani (Ediwar dkk. 2023).",
      provinces: [],
      movement_count: 43,
      animated_count: 35,
      course_count: 1,
      related_entity_count: 4,
    };

    expect(cleanTraditionSummary(tradition.public_summary)).toBe(
      "Sikap dan gerak dasar pencak silat sebagaimana diajarkan dalam pendidikan jasmani.",
    );

    const { container } = render(<TraditionShowcaseCard tradition={tradition} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/heritage/pencak-silat-dasar-pendidikan");
    expect(screen.getByText("Nasional")).toBeTruthy();
    expect(screen.getByText("Silek")).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Teknik Dasar Pencak Silat" }),
    ).toBeTruthy();
    expect(screen.queryByText(/Ediwar/i)).toBeNull();
    expect(screen.getByText("43 gerakan")).toBeTruthy();
    expect(screen.getByText("1 kursus")).toBeTruthy();
    expect(screen.getByText("4 catatan")).toBeTruthy();
    expect(screen.getByText("Telusuri tradisi")).toBeTruthy();

    const html = container.innerHTML.toLowerCase();
    expect(html).not.toMatch(/#0b7a4b|#10945c|#315c4d|#e6f4ee/);
  });
});
