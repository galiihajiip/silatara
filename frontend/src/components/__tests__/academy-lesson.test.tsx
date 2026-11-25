// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourseDetailK, LessonDetail as KLesson } from "@/lib/research";

const apiGetMock = vi.fn();
const sGetMock = vi.fn();
const getCurrentUserMock = vi.fn();
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => notFoundMock(),
}));

vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}));

vi.mock("@/lib/server-api", () => ({
  sGet: (...args: unknown[]) => sGetMock(...args),
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

vi.mock("@/lib/client-api", () => ({
  clientRequest: vi.fn(async () => ({ ok: true, data: {} })),
}));

vi.mock("@/components/LazyClients", () => ({
  LazyMovement3DPlayer: ({ title }: { title: string }) => (
    <div data-testid="mock-3d-player">{title}</div>
  ),
}));

import PublicLessonPage from "@/app/academy/courses/[slug]/lessons/[lessonSlug]/page";
import { DicodingLessonReader } from "@/components/knowledge/DicodingLessonReader";
import { KnowledgeCourse } from "@/components/knowledge/KnowledgeCourse";

const SAMPLE_COURSE_K: CourseDetailK = {
  slug: "dasar-pencak-silat",
  title: "Dasar Pencak Silat",
  summary: "Kursus pengantar sikap berdiri, kuda-kuda, dan pola langkah dasar.",
  level: "beginner",
  estimated_minutes: 45,
  lesson_count: 2,
  module_count: 1,
  safety_notes: "Berlatih di permukaan datar tanpa alas licin.",
  goals: ["Mengenal sikap tegak", "Memahami kuda-kuda tengah"],
  tradition: { slug: "ipsi-umum", name: "Pencak Silat Umum" },
  modules: [
    {
      order: 1,
      title: "Fondasi Sikap & Kuda-Kuda",
      summary: "Memahami keseimbangan tubuh bagian bawah.",
      lessons: [
        {
          slug: "sikap-tegak",
          title: "Sikap Tegak",
          description: "Posisi siap awal sebelum bergerak.",
          duration_min: 15,
          order: 1,
        },
        {
          slug: "kuda-kuda-tengah",
          title: "Kuda-Kuda Tengah",
          description: "Posisi kuda-kuda simetris.",
          duration_min: 20,
          order: 2,
        },
      ],
    },
  ],
  movements: [
    {
      slug: "kuda-kuda-tengah",
      name: "Kuda-Kuda Tengah",
      safety_class: "solo_beginner",
      animation: {
        status: "needs_reference",
        animation_id: "anim-1",
        url: null,
        thumbnail_url: null,
        needs: null,
      },
    },
  ],
  references: [],
};

const SAMPLE_LESSON_K: KLesson = {
  disclaimer: "Draf riset",
  course: { slug: "dasar-pencak-silat", title: "Dasar Pencak Silat" },
  module: "Fondasi Sikap & Kuda-Kuda",
  slug: "kuda-kuda-tengah",
  title: "Kuda-Kuda Tengah",
  description: "Posisi kuda-kuda simetris dengan beban terbagi rata di kedua kaki.",
  objectives: ["Menjaga punggung tetap tegak", "Membagi berat badan secara seimbang"],
  prior_competence: "Sudah memahami Sikap Tegak.",
  duration_min: 20,
  equipment: "Tanpa alat",
  space: "Ruang 2x2 meter",
  safety_briefing: "Hentikan latihan bila lutut terasa nyeri.",
  theory: "Kuda-kuda tengah menempatkan kedua kaki sejajar lebih lebar dari bahu.\n\nLutut ditekuk perlahan agar pusat gravitasi turun.",
  cultural_explanation: "Dalam tradisi pencak silat, kuda-kuda melambangkan keteguhan sikap.",
  practice_steps: ["Buka kaki selebar 1,5 bahu", "Tekuk kedua lutut perlahan", "Tahan selama 10 detik"],
  summary: "Kuda-kuda tengah adalah dasar stabilitas gerak.",
  reflection: ["Apakah berat badan sudah terasa seimbang di kedua kaki?"],
  quiz: [
    {
      q: "Bagaimana pembagian berat badan pada kuda-kuda tengah?",
      options: ["Seluruhnya di kaki kiri", "Seimbang di kedua kaki", "Seluruhnya di tumit", "Di ujung jari saja"],
      answer_index: 1,
      source_id: "src-1",
    },
  ],
  references: [
    {
      source_id: "src-1",
      locator: "Bab 2, hlm. 14",
      citation: "Pedoman Teknik Dasar Pencak Silat",
      url: "https://example.org/pedoman",
    },
  ],
  movements: [
    {
      slug: "kuda-kuda-tengah",
      name: "Kuda-Kuda Tengah",
      safety_class: "solo_beginner",
      phases: [
        {
          id: "ph-1",
          order: 1,
          name: "Persiapan",
          start_position: "Berdiri tegak",
          change: "Geser kaki ke samping",
          body_parts: ["kaki"],
          direction: "samping",
          end_position: "Kaki terbuka sejajar",
          mistakes: [],
          safety: null,
          tempo: null,
          basis: "source",
        },
      ],
      common_mistakes: ["Lutut mengarah ke dalam"],
      common_mistakes_gap: null,
      animation: {
        status: "needs_reference",
        animation_id: "anim-1",
        url: null,
        thumbnail_url: null,
        needs: null,
      },
    },
  ],
  prev: { slug: "sikap-tegak", title: "Sikap Tegak" },
  next: null,
};

function assertNoGreenOrEmDash(container: HTMLElement) {
  const html = container.innerHTML;
  expect(html).not.toMatch(/\u2014/);
  expect(html).not.toMatch(/#0B7A4B|#10945C|#315C4D|#E6F4EE/i);
  expect(html).not.toMatch(/\b(?:emerald|green|teal)-\d{2,3}\b/);
}

describe("Academy Course & Dicoding Lesson Reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue(null);
    sGetMock.mockResolvedValue({ ok: false, status: 404, error: "not found" });
  });

  it("renders PublicLessonPage with syllabus sidebar, tabs, prev/next nav, and zero green/em-dash", async () => {
    apiGetMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/research/curricula/")) return { ok: true, data: SAMPLE_LESSON_K };
      if (path.startsWith("/research/courses/")) return { ok: true, data: SAMPLE_COURSE_K };
      if (path === "/research/character") return { ok: false, status: 404, error: "none" };
      if (path === "/research/assessment/protocols") {
        return { ok: true, data: { items: [{ movement_id: "mv.ipsi.kuda-kuda-tengah", status: "active" }] } };
      }
      return { ok: false, status: 404, error: "not found" };
    });

    const el = await PublicLessonPage({
      params: Promise.resolve({ slug: "dasar-pencak-silat", lessonSlug: "kuda-kuda-tengah" }),
    });
    const { container } = render(el);

    expect(screen.getByRole("heading", { level: 1, name: "Kuda-Kuda Tengah" })).toBeTruthy();
    expect(screen.getByText(/±20 menit/i)).toBeTruthy();

    // Syllabus sidebar highlights current lesson
    const activeLinks = screen.getAllByRole("link", { name: /Kuda-Kuda Tengah/i });
    const currentLink = activeLinks.find((node) => node.getAttribute("aria-current") === "page");
    expect(currentLink).toBeDefined();

    // Prev / Next stepper navigation
    const nav = screen.getByRole("navigation", { name: "Navigasi pelajaran" });
    expect(within(nav).getByRole("link", { name: /Sikap Tegak/i }).getAttribute("href")).toBe(
      "/academy/courses/dasar-pencak-silat/lessons/sikap-tegak",
    );
    expect(within(nav).getByRole("link", { name: /Kembali ke kurikulum/i }).getAttribute("href")).toBe(
      "/academy/courses/dasar-pencak-silat",
    );

    assertNoGreenOrEmDash(container);
  });

  it("switches learning segment tabs and handles interactive quiz selection", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DicodingLessonReader
        courseSlug="dasar-pencak-silat"
        lessonSlug="kuda-kuda-tengah"
        lesson={SAMPLE_LESSON_K}
        courseModules={SAMPLE_COURSE_K.modules}
        movements={SAMPLE_LESSON_K.movements.map((m) => ({
          ...m,
          clip: null,
          practicable: true,
        }))}
      />,
    );

    // Default tab is Materi & Konteks
    expect(screen.getByRole("heading", { name: "Materi Inti" })).toBeTruthy();

    // Switch to Peraga & Gerakan tab
    await user.click(screen.getByRole("tab", { name: /Peraga & Gerakan/i }));
    expect(screen.getByRole("link", { name: /Coba Latihan Sekarang/i })).toBeTruthy();
    expect(screen.getByText(/Lutut mengarah ke dalam/i)).toBeTruthy();

    // Switch to Latihan & Kuis tab
    await user.click(screen.getByRole("tab", { name: /Latihan & Kuis/i }));
    expect(screen.getByRole("heading", { name: "Latihan Mandiri" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Uji Pemahaman" })).toBeTruthy();

    // Pick wrong answer first
    await user.click(screen.getByRole("button", { name: /Seluruhnya di kaki kiri/i }));
    expect(screen.getByText(/Belum tepat, coba pilih jawaban lain/i)).toBeTruthy();

    // Pick correct answer
    await user.click(screen.getByRole("button", { name: /Seimbang di kedua kaki/i }));
    expect(screen.getByText(/Benar! Jawaban tepat\./i)).toBeTruthy();

    // Switch to Rangkuman tab
    await user.click(screen.getByRole("tab", { name: /Rangkuman/i }));
    expect(screen.getByText("Kuda-kuda tengah adalah dasar stabilitas gerak.")).toBeTruthy();

    assertNoGreenOrEmDash(container);
  });

  it("renders KnowledgeCourse with Bento syllabus cards and zero green/em-dash", async () => {
    const el = await KnowledgeCourse({ c: SAMPLE_COURSE_K });
    const { container } = render(el);

    expect(screen.getByRole("heading", { level: 1, name: "Dasar Pencak Silat" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Yang akan Anda pelajari" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Silabus & Modul" })).toBeTruthy();
    expect(screen.getByText("Fondasi Sikap & Kuda-Kuda")).toBeTruthy();

    assertNoGreenOrEmDash(container);
  });
});
