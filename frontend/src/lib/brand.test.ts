import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..");
const PUB = join(__dirname, "../../public/brand");
const files = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)])).filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f));

describe("identitas brand (maskot)", () => {
  it("aset turunan dari maskot ada dan favicon.ico berisi PNG 16/32/48", () => {
    for (const f of ["silatara-mascot.png", "silatara-mark.png", "silatara-ornament.png", "silatara-logo-full.png"]) expect(existsSync(join(PUB, f)), f).toBe(true);
    for (const f of ["icon.png", "apple-icon.png", "favicon.ico"]) expect(existsSync(join(SRC, "app", f)), f).toBe(true);
    const ico = readFileSync(join(SRC, "app/favicon.ico"));
    expect(ico.readUInt16LE(2)).toBe(1); // type icon
    expect(ico.readUInt16LE(4)).toBe(3); // 3 gambar
    expect(ico.subarray(54, 62).toString("hex")).toBe("89504e470d0a1a0a"); // PNG tertanam
    expect(readFileSync(join(PUB, "silatara-mascot.png")).subarray(1, 4).toString()).toBe("PNG");
  });
  it("tidak ada logo SVG/inline lama: simbol brand hanya dari komponen Brand", () => {
    for (const f of files(SRC)) {
      const src = readFileSync(f, "utf8");
      const name = f.replace(SRC, "").replaceAll("\\", "/");
      if (/silatara-mark\.png/.test(src)) expect(name, "silatara-mark hanya di Brand.tsx").toMatch(/components\/Brand\.tsx$/);
      expect(/<svg[^>]*aria-label="[^"]*(logo|SILATARA)/i.test(src) && !/landing\/SkeletonDemo/.test(name), `${name}: logo SVG terpisah`).toBe(false);
    }
  });
  it("hero memakai SunsetCloudsHero SVG/CSS murni dan logo resmi di Brand tanpa lingkaran", () => {
    const pageSrc = readFileSync(join(SRC, "app/page.tsx"), "utf8");
    expect(pageSrc).toContain("<SunsetCloudsHero");
    const heroSrc = readFileSync(join(SRC, "components/landing/SunsetCloudsHero.tsx"), "utf8");
    expect(heroSrc).toContain("<linearGradient");
    expect(heroSrc).toContain('stopOpacity="0"');
    expect(heroSrc).not.toMatch(/<(?:Image|img)\b/);
    const brandSrc = readFileSync(join(SRC, "components/Brand.tsx"), "utf8");
    expect(brandSrc).toContain("/brand/silatara-logo-full.png");
    const logoImg = brandSrc.slice(brandSrc.indexOf('src="/brand/silatara-logo-full.png"'), brandSrc.indexOf("/>", brandSrc.indexOf('src="/brand/silatara-logo-full.png"')));
    expect(logoImg).not.toMatch(/rounded-full|border-radius/);
  });
  it("halaman publik tidak menampilkan rujukan/halaman kutipan maupun testimoni karangan", () => {
    for (const f of ["app/page.tsx", "app/layout.tsx", "components/SiteHeader.tsx"]) {
      const src = readFileSync(join(SRC, f), "utf8");
      expect(src, f).not.toMatch(/Rujukan|hlm\.|Testimoni|Apa Kata Jawara|Sertifikat Kompetensi|Daftar Sebagai Mitra/);
    }
  });
  it("metadata: manifest, OG, theme-color, bahasa id", () => {
    const layout = readFileSync(join(SRC, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/openGraph/);
    expect(layout).toMatch(/themeColor: "#4a0d0d"/);
    expect(layout).toMatch(/Plus_Jakarta_Sans/);  // font di-host sendiri, bukan tautan Google Fonts saat runtime
    expect(layout).not.toMatch(/fonts\.googleapis\.com/);
    expect(layout).toMatch(/lang="id"/);
    expect(readFileSync(join(SRC, "app/manifest.ts"), "utf8")).toMatch(/name: "SILATARA"/);
  });
});
