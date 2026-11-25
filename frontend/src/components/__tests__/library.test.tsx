// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanMovementText } from "@/components/knowledge/Bits";
import { LibraryCatalog } from "@/components/knowledge/LibraryCatalog";
import { MovementArticle } from "@/components/knowledge/MovementArticle";
import { MovementDocumentView } from "@/components/MovementDocumentView";
import type { ClipMeta } from "@/lib/character";
import type { MovementDetail, MovementItem, TraditionItem } from "@/lib/research";
import type { PublicDocument } from "@/lib/types";

const sampleMovements: MovementItem[] = [
  {
    slug: "sikap-istirahat",
    id: "mv.ipsi.sikap-istirahat",
    name: "Sikap Istirahat",
    aliases: ["Sikap Santai"],
    category: "sikap_dasar",
    category_label: "Sikap Dasar",
    level: "beginner",
    safety_class: "solo_beginner",
    solo_form_status: "documented_solo",
    content_status: "published",
    phases: 2,
    sources: ["src-1"],
    animation: {
      status: "generated",
      animation_id: "anim-1",
      url: null,
      thumbnail_url: null,
      needs: null,
    },
    tradition_slug: "pencak-silat-umum",
    tradition_name: "Pencak Silat Umum",
    summary: "Sikap berdiri santai sebelum berlatih.",
  },
  {
    slug: "kuda-kuda-tengah",
    id: "mv.ipsi.kuda-kuda-tengah",
    name: "Kuda-Kuda Tengah",
    aliases: ["Kuda-Kuda Sejajar"],
    category: "kuda_kuda",
    category_label: "Kuda-Kuda",
    level: "beginner",
    safety_class: "solo_beginner",
    solo_form_status: "documented_solo",
    content_status: "published",
    phases: 3,
    sources: ["src-1"],
    animation: {
      status: "generated",
      animation_id: "anim-2",
      url: null,
      thumbnail_url: null,
      needs: null,
    },
    tradition_slug: "pencak-silat-umum",
    tradition_name: "Pencak Silat Umum",
    summary: "Posisi kuda-kuda dengan berat badan di tengah.",
  },
  {
    slug: "langkah-segitiga",
    id: "mv.minang.langkah-segitiga",
    name: "Langkah Segitiga",
    aliases: ["Pola Tiga"],
    category: "pola_langkah",
    category_label: "Pola Langkah",
    level: "intermediate",
    safety_class: "solo_intermediate",
    solo_form_status: "documented_solo",
    content_status: "published",
    phases: 4,
    sources: ["src-2"],
    animation: {
      status: "needs_reference",
      animation_id: "anim-3",
      url: null,
      thumbnail_url: null,
      needs: null,
    },
    tradition_slug: "silek-minang",
    tradition_name: "Silek Minangkabau",
    summary: "Pola langkah membentuk segitiga.",
  },
];

const sampleExtendedMovements: MovementItem[] = [
  ...sampleMovements,
  {
    slug: "sikap-tegak-1",
    id: "mv.ipsi.sikap-tegak-1",
    name: "Sikap Tegak 1",
    aliases: ["Sikap Berdiri"],
    category: "sikap_dasar",
    category_label: "Sikap Dasar",
    level: "beginner",
    safety_class: "solo_beginner",
    solo_form_status: "documented_solo",
    content_status: "published",
    phases: 1,
    sources: ["src-1"],
    animation: {
      status: "generated",
      animation_id: "anim-4",
      url: null,
      thumbnail_url: null,
      needs: null,
    },
    tradition_slug: "pencak-silat-umum",
    tradition_name: "Pencak Silat Umum",
    summary: "Sikap berdiri tegak.",
  },
  {
    slug: "kuda-kuda-depan",
    id: "mv.ipsi.kuda-kuda-depan",
    name: "Kuda-Kuda Depan",
    aliases: [],
    category: "kuda_kuda",
    category_label: "Kuda-Kuda",
    level: "beginner",
    safety_class: "solo_beginner",
    solo_form_status: "documented_solo",
    content_status: "published",
    phases: 2,
    sources: ["src-1"],
    animation: {
      status: "generated",
      animation_id: "anim-5",
      url: null,
      thumbnail_url: null,
      needs: null,
    },
    tradition_slug: "pencak-silat-umum",
    tradition_name: "Pencak Silat Umum",
    summary: "Posisi kuda-kuda depan.",
  },
];

const sampleCategories: Record<string, string> = {
  sikap_dasar: "Sikap Dasar",
  kuda_kuda: "Kuda-Kuda",
  pola_langkah: "Pola Langkah",
};

const sampleTraditions: TraditionItem[] = [
  {
    slug: "pencak-silat-umum",
    name: "Pencak Silat Umum",
    local_name: null,
    region: "Nasional",
    public_summary: "",
    provinces: [],
    movement_count: 2,
    animated_count: 2,
    course_count: 1,
    related_entity_count: 0,
  },
  {
    slug: "silek-minang",
    name: "Silek Minangkabau",
    local_name: "Silek",
    region: "Sumatera Barat",
    public_summary: "",
    provinces: [],
    movement_count: 1,
    animated_count: 0,
    course_count: 0,
    related_entity_count: 0,
  },
];

const sampleClip: ClipMeta = {
  movement_id: "mv.ipsi.sikap-istirahat",
  clip: "sikap_istirahat",
  animation_id: "anim-1",
  source_animation_id: "anim-1",
  title: "Sikap Istirahat",
  duration_s: 4,
  loop_interval_s: 4,
  view_recommendation: "depan",
  source_view: "front",
  phases: [
    { phase_id: "p1", keyframe: "k1", label: "Sikap tegak", caption: "Berdiri lurus", start: 0, end: 2 },
    { phase_id: "p2", keyframe: "k2", label: "Membuka kaki", caption: "Tangan disilangkan", start: 2, end: 4 },
  ],
  source_ids: ["src-1"],
  validation_status: "passed",
  interpretation: "editorial",
  checks_passed: true,
};

const sampleDetail: MovementDetail = {
  disclaimer: "",
  id: "mv.ipsi.sikap-istirahat",
  slug: "sikap-istirahat",
  names: { primary: "Sikap Istirahat", local: null, aliases: ["Sikap Santai"] },
  category: "sikap_dasar",
  category_label: "Sikap Dasar",
  level: "beginner",
  safety_class: "solo_beginner",
  solo_form_status: "documented_solo",
  content_status: "published",
  tradition_slug: "pencak-silat-umum",
  evidence_tier: "source_backed",
  instructor_validation: "pending",
  permission_status: "open",
  tradition: "Pencak Silat Umum",
  cultural: {
    context: {
      text: "Nugroho (2005) menempatkannya sebagai bagian sikap dasar sebelum jatuhan.",
      basis: "source",
      sources: ["src-1"],
    },
    purpose: {
      text: "Membentuk kesiapan jasmani dan rohani. Sikap tegak 4 dan 5 menurut Herdiana dipakai sebagai sikap awal rangkaian teknik dan sikap awal bertanding.",
      basis: "source",
      sources: ["src-1"],
    },
    meaning: { text: "Melatih disiplin sikap.", basis: "source", sources: ["src-1"] },
    terminology: [{ term: "Sikap", explanation: "Posisi dasar tubuh" }],
    variants: [],
    differs_from: [],
  },
  prerequisites: {
    abilities: "Mampu berdiri seimbang",
    physical_prep: "Pemanasan ringan (lihat common.safety.warmup).",
    space: "Ruang 2×2 meter",
    surface: "Lantai rata tidak licin",
    equipment: "Pakaian longgar",
    limits: "Hentikan latihan bila merasa pusing.",
  },
  anatomy: [
    { key: "kaki", label: "Kaki", text: "Dibuka selebar bahu (Herdiana).", basis: "source", sources: ["src-1"] },
    {
      key: "berat",
      label: "Berat badan",
      text: "Tidak dirinci sumber; seumumnya merata pada kedua kaki; tanyakan detailnya kepada pelatih.",
      basis: "needs_validation",
      sources: [],
    },
  ],
  phases: [
    {
      id: "p1",
      order: 1,
      name: "Sikap tegak",
      start_position: "Berdiri tegak",
      change: "Rilekskan bahu",
      body_parts: ["Bahu", "Kaki"],
      direction: "Menghadap depan",
      end_position: "Tubuh tegak seimbang",
      mistakes: [],
      safety: "Jangan mengunci lutut terlalu keras.",
      tempo: null,
      basis: "source",
    },
    {
      id: "p2",
      order: 2,
      name: "Membuka kaki & menyilangkan tangan",
      start_position: "Sikap tegak",
      change: "Buka kaki selebar bahu dan silangkan tangan di depan pinggang",
      body_parts: ["Kaki", "Tangan"],
      direction: "Ke samping",
      end_position: "Berdiri santai seimbang",
      mistakes: [],
      safety: null,
      tempo: null,
      basis: "source",
    },
  ],
  practice: {
    start: "Mulai dari berdiri tegak",
    sequence: "Lakukan fase 1 ke fase 2 dengan napas teratur",
    tempo: { text: "Perlahan", basis: "source" },
    repetitions: { text: "3–5 kali", basis: "source" },
    easier: "—",
    progression: "Lanjut ke kuda-kuda tengah (kuda-kuda dimulai dari sikap tegak 2 menurut Nugroho).",
    cooldown: "Lemas dan tarik napas",
    stop_when: ["Terasa nyeri di lutut atau pinggang."],
    stop_basis: "editorial",
  },
  common_mistakes: ["Bahu terangkat tegang"],
  common_mistakes_gap: null,
  references: [
    { source_id: "src-1", locator: "hlm. 12", citation: "Buku Panduan Pencak Silat Dasar", url: "https://example.org" },
  ],
  gaps: ["Lebar bukaan kaki tidak disebut."],
  animation: {
    status: "generated",
    animation_id: "anim-1",
    url: null,
    thumbnail_url: null,
    needs: null,
    notes_markdown: null,
  },
  used_in: [
    {
      course_slug: "dasar-pencak-silat",
      course_title: "Dasar Pencak Silat",
      lesson_slug: "sikap-awal",
      lesson_title: "Mengenal Sikap Awal",
    },
  ],
};

describe("cleanMovementText", () => {
  it("menghapus kalimat basa-basi latihan sendiri, rujukan internal, dan sitasi penulis", () => {
    expect(cleanMovementText("Dapat dilatih sendiri.")).toBe("");
    expect(cleanMovementText("Pemanasan ringan (lihat common.safety.warmup).")).toBe(
      "Pemanasan ringan.",
    );
    expect(
      cleanMovementText(
        "Lanjut ke kuda-kuda (kuda-kuda dimulai dari sikap tegak 2 menurut Nugroho).",
      ),
    ).toBe("Lanjut ke kuda-kuda.");
  });
});

describe("LibraryCatalog", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/library");
  });

  it("menampilkan tab pil kategori dan menyaring gerakan secara instan", async () => {
    render(
      <LibraryCatalog
        items={sampleMovements}
        categories={sampleCategories}
        traditions={sampleTraditions}
        animated3DIds={["mv.ipsi.sikap-istirahat", "mv.ipsi.kuda-kuda-tengah"]}
        initial={{}}
      />,
    );

    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 3 dari 3 gerakan");

    const catGroup = screen.getByRole("group", { name: "Saring berdasarkan kategori gerakan" });
    await userEvent.click(within(catGroup).getByRole("button", { name: /Kuda-Kuda/ }));

    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 1 dari 3 gerakan");
    expect(screen.getByRole("link", { name: "Kuda-Kuda Tengah" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sikap Istirahat" })).toBeNull();
    expect(window.location.search).toContain("kategori=kuda_kuda");

    await userEvent.click(screen.getByRole("button", { name: "Hapus saringan" }));
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 3 dari 3 gerakan");
  });

  it("mendukung pencarian nama/alias, pemilih tradisi & tingkat, serta tombol Beranimasi 3D", async () => {
    render(
      <LibraryCatalog
        items={sampleMovements}
        categories={sampleCategories}
        traditions={sampleTraditions}
        animated3DIds={["mv.ipsi.sikap-istirahat"]}
        initial={{}}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Beranimasi 3D/ }));
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 1 dari 3 gerakan");
    expect(screen.getByRole("link", { name: "Sikap Istirahat" })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /Beranimasi 3D/ }));
    await userEvent.selectOptions(screen.getByLabelText("Tradisi"), "silek-minang");
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 1 dari 3 gerakan");
    expect(screen.getByRole("link", { name: "Langkah Segitiga" })).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText("Tingkat"), "advanced");
    expect(screen.getByText(/Tidak ada gerakan yang cocok dengan saringan ini/)).toBeTruthy();
  });

  it("menampilkan tepat 1 kartu sorotan per kategori di ringkasan default dan membuka semua gerakan saat kategori dipilih", async () => {
    render(
      <LibraryCatalog
        items={sampleExtendedMovements}
        categories={sampleCategories}
        traditions={sampleTraditions}
        animated3DIds={["mv.ipsi.sikap-istirahat", "mv.ipsi.kuda-kuda-tengah"]}
        initial={{}}
      />,
    );

    // Di ringkasan default, tampil 1 per kategori (3 sorotan dari 5 gerakan)
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 3 dari 5 gerakan");
    expect(screen.getByText("(1 per kategori)")).toBeTruthy();

    // Kartu perwakilan tampil
    expect(screen.getByRole("link", { name: "Sikap Istirahat" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Kuda-Kuda Tengah" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Langkah Segitiga" })).toBeTruthy();

    // Gerakan kedua dalam kategori yang sama tidak tampil di default overview
    expect(screen.queryByRole("link", { name: "Sikap Tegak 1" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Kuda-Kuda Depan" })).toBeNull();

    // Terdapat tombol tindakan per kategori
    const seeAllKuda = screen.getByRole("button", { name: "Lihat semua 2 gerakan Kuda-Kuda" });
    expect(seeAllKuda).toBeTruthy();

    // Klik tombol "Lihat semua 2 gerakan Kuda-Kuda" untuk kategori Kuda-Kuda
    await userEvent.click(seeAllKuda);

    // Sekarang menampilkan semua 2 gerakan kuda-kuda
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 2 dari 5 gerakan");
    expect(screen.getByRole("link", { name: "Kuda-Kuda Tengah" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Kuda-Kuda Depan" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sikap Istirahat" })).toBeNull();

    // Klik tombol reset "Semua kategori (1 per kategori)"
    const resetPill = screen.getByRole("button", { name: /Semua kategori \(1 per kategori\)/ });
    await userEvent.click(resetPill);

    // Kembali ke ringkasan default 1 per kategori
    expect(screen.getByText(/Menampilkan/).textContent).toContain("Menampilkan 3 dari 5 gerakan");
    expect(screen.queryByRole("link", { name: "Kuda-Kuda Depan" })).toBeNull();
  });
});

describe("MovementArticle", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  it("menempatkan peraga 3D/2D di atas instruksi fase dan menghapus basa-basi akademis/solo", async () => {
    const { container } = render(<MovementArticle m={sampleDetail} clip={sampleClip} practice />);

    const viewer = await screen.findByTestId("movement-3d");
    const stepsHeading = screen.getByRole("heading", { name: "Langkah demi langkah" });

    expect(
      viewer.compareDocumentPosition(stepsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(screen.getByRole("tab", { name: "Peraga 3D" })).toBeTruthy();
    const tab2D = screen.getByRole("tab", { name: "Ilustrasi 2D" });
    expect(tab2D).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sikap tegak" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Membuka kaki & menyilangkan tangan" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Rujukan sumber" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Coba Latihan Sekarang/ }).length).toBeGreaterThan(0);

    // Stripped boilerplate & academic citation prose
    expect(screen.queryByText(/Dapat dilatih sendiri/i)).toBeNull();
    expect(screen.queryByText(/menurut Herdiana/i)).toBeNull();
    expect(screen.queryByText(/Membentuk kesiapan jasmani/i)).toBeNull();
    expect(screen.queryByRole("heading", { name: /Konteks budaya/i })).toBeNull();
    expect(screen.queryByText(/common\.safety\.warmup/i)).toBeNull();
    expect(screen.queryByText(/Belum dirinci sumber/i)).toBeNull();

    // Cleaned practical anatomy stays; needs_validation filler is omitted
    expect(screen.getByText("Dibuka selebar bahu.")).toBeTruthy();
    expect(screen.queryByText(/tanyakan detailnya kepada pelatih/i)).toBeNull();

    const html = container.innerHTML.toLowerCase();
    expect(html).not.toMatch(/#0b7a4b|#10945c|#315c4d|#e6f4ee/);

    await userEvent.click(tab2D);
    expect(tab2D.getAttribute("aria-selected")).toBe("true");
  });

  it("menampilkan peringatan ringkas hanya ketika gerakan membutuhkan pendampingan pelatih", () => {
    render(
      <MovementArticle
        m={{
          ...sampleDetail,
          safety_class: "supervised_only",
          solo_form_status: "inferred_not_documented",
          practice: { ...sampleDetail.practice, sequence: "Tidak disusun untuk latihan mandiri." },
        }}
      />,
    );

    expect(screen.getByText("Dengan pengawasan")).toBeTruthy();
    expect(screen.getByText("Latih bersama pelatih.")).toBeTruthy();
    expect(screen.queryByText(/Tidak disusun untuk latihan mandiri/i)).toBeNull();
  });
});

describe("MovementDocumentView (layout centered)", () => {
  it("menempatkan media referensi di atas Langkah demi langkah tanpa basa-basi solo/administratif", () => {
    const doc: PublicDocument = {
      id: "d1",
      version_no: 1,
      name_id: "Gerakan Mitra",
      name_local: null,
      level: "beginner",
      safety_category: "solo_beginner",
      prerequisites: null,
      learning_context: "Paragraf teoretis panjang yang tidak perlu tampil.",
      description: "Uraian gerakan mitra.",
      terminology_notes: "Catatan istilah panjang.",
      common_mistakes: [],
      safety_guidance: null,
      relevant_body_parts: [],
      relevant_landmarks: [],
      phases: [
        {
          id: "ph1",
          order_index: 0,
          name: "Sikap awal",
          instruction: "Berdiri seimbang menghadap depan.",
          body_focus: [],
          safety_note: null,
          start_ms: null,
          end_ms: null,
        },
      ],
      media: [
        {
          id: "m1",
          kind: "video",
          title: "Video Peraga Mitra",
          url: "/api/v1/media/m1/file",
          rights_holder: "Perguruan Uji",
          source_description: "Dokumentasi resmi",
          usage_scope: "Publik",
          is_demo: false,
        },
      ],
      rights_holder: "Perguruan Uji",
      license_type: "instructor_owned",
      usage_scope: "Publik",
      changelog: null,
      published_at: null,
      authors: ["Guru"],
    };

    render(<MovementDocumentView doc={doc} layout="centered" />);
    const mediaLabel = screen.getByText("Video Peraga Mitra");
    const stepsHeading = screen.getByRole("heading", { name: "Langkah demi langkah" });
    expect(
      mediaLabel.compareDocumentPosition(stepsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByText(/Dapat dilatih sendiri/i)).toBeNull();
    expect(screen.queryByText(/klasifikasi administratif/i)).toBeNull();
    expect(screen.queryByText(/Paragraf teoretis panjang/i)).toBeNull();
    expect(screen.queryByText(/Catatan istilah panjang/i)).toBeNull();
  });
});
