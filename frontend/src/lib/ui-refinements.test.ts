import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanDashes } from "@/lib/text";

const SRC = resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "features" || e.name === "node_modules" || e.name === "__tests__") continue;
      walk(full, out);
    } else if (/\.(tsx?|css|md)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(full);
  }
  return out;
}

const css = readFileSync(join(SRC, "app/globals.css"), "utf8");

describe("batik Kawung transparan", () => {
  const token = css.match(/--batik-kawung:\s*(url\("data:image\/svg\+xml,[^"]*"\))/)?.[1] ?? "";

  it("memakai satu token SVG dengan stroke dan fill opacity sangat halus (0.025)", () => {
    expect(token).not.toBe("");
    const opacities = [...token.matchAll(/(?:stroke|fill)-opacity='([0-9.]+)'/g)].map((m) => Number(m[1]));
    expect(opacities.length).toBeGreaterThanOrEqual(2);
    for (const o of opacities) {
      expect(o).toBeGreaterThanOrEqual(0.02);
      expect(o).toBeLessThanOrEqual(0.04);
    }
    expect(css).not.toMatch(/(?:stroke|fill)-opacity='0\.05'/);
  });

  it("kanvas memakai token, navbar dan footer tetap bebas batik", () => {
    expect(css).toMatch(/\.bg-batik-kawung(?:::before)?\s*\{[^}]*var\(--batik-kawung\)/);
    expect(css).toMatch(/\[data-cms-shell\]\s*\{[^}]*var\(--batik-kawung\)/);
    expect(css).toMatch(/header\[data-site-header\],\s*\[data-site-header\],\s*footer\[data-site-footer\],\s*\[data-site-footer\]\s*\{\s*background-image:\s*none\s*!important/);
  });
});

describe("permukaan kartu dan banner tidak transparan", () => {
  const academy = readFileSync(join(SRC, "app/academy/(list)/page.tsx"), "utf8");
  const heritage = readFileSync(join(SRC, "app/heritage/(list)/page.tsx"), "utf8");

  it("banner Akademi memiliki dasar solid di bawah gradien hangat", () => {
    expect(academy).toMatch(/<header[^>]*bg-gradient-to-br from-\[#2e0909\] via-\[#4a120b\] to-\[#6d1b11\]/);
    expect(academy).not.toContain("to-[#ffedd5]/65");
  });

  it("kartu bento dan kartu Akademi memakai permukaan solid", () => {
    expect(academy).toContain("bg-white bg-gradient-to-b from-[#fffaf5] to-white");
    expect(academy).toContain("bg-[#FFFDF9]");
    expect(academy).not.toMatch(/from-\[#fffaf5\]\/\d+/);
    expect(heritage).not.toMatch(/bg-\[#faf7f4\]\/\d+/);
  });
});

describe("tanpa em dash di UI frontend", () => {
  it("tidak ada karakter U+2014 di frontend/src (kecuali features)", () => {
    const offenders = walk(SRC)
      .filter((f) => !/ui-refinements\.test\.ts$/.test(f))
      .filter((f) => readFileSync(f, "utf8").includes("\u2014"))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it("tidak memakai hex hijau usang", () => {
    const bad = ["#0B7A4B", "#10945C", "#315C4D", "#E6F4EE"];
    const offenders = walk(SRC)
      .filter((f) => !/ui-refinements\.test\.ts$/.test(f))
      .filter((f) => {
        const s = readFileSync(f, "utf8").toLowerCase();
        return bad.some((b) => s.includes(b.toLowerCase()));
      })
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });

  it("cleanDashes memberi tanda baca Indonesia yang wajar", () => {
    expect(cleanDashes("pola langkah\u2014dilengkapi peraga 3D")).toBe("pola langkah, dilengkapi peraga 3D");
    expect(cleanDashes("Silat Cingkrik \u2014 jurus dasar", ": ")).toBe("Silat Cingkrik: jurus dasar");
    expect(cleanDashes("Tanpa dash")).toBe("Tanpa dash");
    expect(cleanDashes(null)).toBe("");
  });
});
