// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeritageSectionSwitcher } from "@/components/heritage/HeritageSectionSwitcher";
import { cleanTraditionSummary } from "@/components/heritage/TraditionShowcaseCard";
import type { Entity, Inventory } from "@/lib/research";

const CATS = ["tradition", "style", "regional_term"] as const;

const ENTITIES: Entity[] = Array.from({ length: 15 }, (_, i) => ({
  id: `e${i}`,
  name: i === 0 ? "Silek Minangkabau \u2014 tradisi Sumatera Barat" : `Catatan ${i}`,
  category: CATS[i % 3],
  provinces: ["Sumatera Barat"],
  verification: "ok",
  notes: i === 1 ? "Nagari asalnya\u2014Lintau Buo, tercatat di Tanah Datar." : "Ringkasan singkat.",
  sources: [{ id: "s1", citation: "Sumber" }],
}));

const JURUS: Inventory["groups"] = Array.from({ length: 10 }, (_, i) => ({
  label: i === 0 ? "Silat Beksi \u2014 12 jurus dasar" : `Silat Contoh ${i}`,
  tradition: `trd.x${i}`,
  items: [{ name: `Jurus ${i}`, safety: "needs_reference" }],
}));

describe("HeritageSectionSwitcher", () => {
  it("menampilkan tombol Ragam Tradisi dan Indeks Nama Jurus, hanya satu bagian aktif", () => {
    render(<HeritageSectionSwitcher entities={ENTITIES} regionalJurus={JURUS} />);
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      expect.stringContaining("Ragam Tradisi"),
      expect.stringContaining("Indeks Nama Jurus"),
    ]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Ragam Tradisi" })).not.toBeNull();
    expect(screen.queryByRole("tabpanel", { name: "Indeks Nama Jurus" })).toBeNull();
    expect(screen.queryByText("Jurus 1")).toBeNull();
  });

  it("memiliki sub-filter Semua, Tradisi, Aliran, Sebutan lokal yang menyaring kartu", () => {
    render(<HeritageSectionSwitcher entities={ENTITIES} regionalJurus={JURUS} />);
    for (const name of [/^Semua/, /^Tradisi/, /^Aliran/, /^Sebutan lokal/]) {
      expect(screen.getByRole("button", { name })).not.toBeNull();
    }
    fireEvent.click(screen.getByRole("button", { name: /^Aliran/ }));
    const panel = screen.getByRole("tabpanel", { name: "Ragam Tradisi" });
    expect(within(panel).getAllByRole("article")).toHaveLength(5);
    expect(screen.getByRole("button", { name: /^Aliran/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("ringkas secara bawaan (12 kartu) dan bisa dibuka semua lalu diringkas lagi", () => {
    render(<HeritageSectionSwitcher entities={ENTITIES} regionalJurus={JURUS} />);
    const panel = screen.getByRole("tabpanel", { name: "Ragam Tradisi" });
    expect(within(panel).getAllByRole("article")).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: /Tampilkan semua \(15 catatan\)/ }));
    expect(within(panel).getAllByRole("article")).toHaveLength(15);
    fireEvent.click(screen.getByRole("button", { name: /Tampilkan lebih ringkas/ }));
    expect(within(panel).getAllByRole("article")).toHaveLength(12);
  });

  it("beralih ke Indeks Nama Jurus, ringkas 8 tradisi dengan tombol tampilkan semua", () => {
    render(<HeritageSectionSwitcher entities={ENTITIES} regionalJurus={JURUS} />);
    fireEvent.click(screen.getByRole("tab", { name: /Indeks Nama Jurus/ }));
    expect(screen.getByRole("tab", { name: /Indeks Nama Jurus/ }).getAttribute("aria-selected")).toBe("true");
    const panel = screen.getByRole("tabpanel", { name: "Indeks Nama Jurus" });
    expect(screen.queryByRole("tabpanel", { name: "Ragam Tradisi" })).toBeNull();
    expect(within(panel).getAllByRole("article")).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: /Tampilkan semua \(10 tradisi\)/ }));
    expect(within(panel).getAllByRole("article")).toHaveLength(10);
  });

  it("tidak menampilkan tanda pisah panjang pada nama, catatan, maupun label jurus", () => {
    const { container } = render(<HeritageSectionSwitcher entities={ENTITIES} regionalJurus={JURUS} />);
    expect(container.textContent).not.toContain("\u2014");
    expect(screen.getByText("Silek Minangkabau: tradisi Sumatera Barat")).not.toBeNull();
    expect(screen.getByText(/Nagari asalnya, Lintau Buo/)).not.toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: /Indeks Nama Jurus/ }));
    expect(container.textContent).not.toContain("\u2014");
    expect(screen.getByText("Silat Beksi: 12 jurus dasar")).not.toBeNull();
  });
});

describe("cleanTraditionSummary", () => {
  it("mengganti em dash dengan koma tanpa mengubah fakta", () => {
    expect(cleanTraditionSummary("Berasal dari nagari asalnya\u2014Lintau Buo di Tanah Datar.")).toBe(
      "Berasal dari nagari asalnya, Lintau Buo di Tanah Datar.",
    );
  });
});
