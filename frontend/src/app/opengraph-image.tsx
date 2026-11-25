import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "SILATARA: Warisan Gerak, Generasi Bergerak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const mascot = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/brand/silatara-mascot.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(120deg,#0f1512 45%,#3a1710 100%)", color: "#f6f2e9", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 70px", width: 700 }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: 8 }}>SILATARA</div>
          <div style={{ fontSize: 40, color: "#f0b64a", marginTop: 18 }}>Warisan Gerak, Generasi Bergerak.</div>
          <div style={{ fontSize: 26, color: "#c9c4b6", marginTop: 18 }}>Platform belajar dan pelestarian pencak silat</div>
        </div>
        <img src={mascot} alt="" width={600} height={600} style={{ position: "absolute", right: 20, top: 15 }} />
      </div>
    ),
    size,
  );
}
