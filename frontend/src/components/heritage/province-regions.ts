export type IslandRegionKey =
  | "sumatera"
  | "jawa"
  | "bali-nusa-tenggara"
  | "kalimantan"
  | "sulawesi"
  | "maluku-papua"
  | "lainnya";

export type IslandRegion = {
  key: IslandRegionKey;
  label: string;
};

export const ISLAND_REGIONS: readonly IslandRegion[] = [
  { key: "sumatera", label: "Sumatera" },
  { key: "jawa", label: "Jawa" },
  { key: "bali-nusa-tenggara", label: "Bali & Nusa Tenggara" },
  { key: "kalimantan", label: "Kalimantan" },
  { key: "sulawesi", label: "Sulawesi" },
  { key: "maluku-papua", label: "Maluku & Papua" },
] as const;

export const FALLBACK_REGION: IslandRegion = {
  key: "lainnya",
  label: "Wilayah Lainnya",
};

const REGION_PROVINCE_ENTRIES: Record<Exclude<IslandRegionKey, "lainnya">, readonly string[]> = {
  sumatera: [
    "Aceh",
    "Sumatera Utara",
    "Sumatera Barat",
    "Riau",
    "Kepulauan Riau",
    "Jambi",
    "Sumatera Selatan",
    "Kepulauan Bangka Belitung",
    "Bengkulu",
    "Lampung",
    // alias / slug umum
    "Nanggroe Aceh Darussalam",
    "Bangka Belitung",
  ],
  jawa: [
    "DKI Jakarta",
    "Daerah Khusus Jakarta",
    "Jakarta",
    "Jawa Barat",
    "Banten",
    "Jawa Tengah",
    "DI Yogyakarta",
    "Daerah Istimewa Yogyakarta",
    "Yogyakarta",
    "Jawa Timur",
  ],
  "bali-nusa-tenggara": [
    "Bali",
    "Nusa Tenggara Barat",
    "Nusa Tenggara Timur",
  ],
  kalimantan: [
    "Kalimantan Barat",
    "Kalimantan Tengah",
    "Kalimantan Selatan",
    "Kalimantan Timur",
    "Kalimantan Utara",
  ],
  sulawesi: [
    "Sulawesi Utara",
    "Gorontalo",
    "Sulawesi Tengah",
    "Sulawesi Barat",
    "Sulawesi Selatan",
    "Sulawesi Tenggara",
  ],
  "maluku-papua": [
    "Maluku",
    "Maluku Utara",
    "Papua",
    "Papua Barat",
    "Papua Selatan",
    "Papua Tengah",
    "Papua Pegunungan",
    "Papua Barat Daya",
  ],
};

export function normalizeProvinceKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

const PROVINCE_TO_REGION = new Map<string, Exclude<IslandRegionKey, "lainnya">>();
for (const [regionKey, names] of Object.entries(REGION_PROVINCE_ENTRIES) as [
  Exclude<IslandRegionKey, "lainnya">,
  readonly string[],
][]) {
  for (const name of names) {
    PROVINCE_TO_REGION.set(normalizeProvinceKey(name), regionKey);
  }
}

/** Petakan nama atau slug provinsi Indonesia ke kelompok pulau/wilayah, dengan fallback aman. */
export function getProvinceRegion(provinceNameOrSlug: string): IslandRegionKey {
  return PROVINCE_TO_REGION.get(normalizeProvinceKey(provinceNameOrSlug)) ?? "lainnya";
}

export function getRegionLabel(key: IslandRegionKey): string {
  return ISLAND_REGIONS.find((r) => r.key === key)?.label ?? FALLBACK_REGION.label;
}

export function isProvinceDocumented(province: { status: string }): boolean {
  return province.status !== "no_documentation_found";
}
