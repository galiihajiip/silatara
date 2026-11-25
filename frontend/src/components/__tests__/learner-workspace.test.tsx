// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonDetail, MyProgress, Page, PracticeSession, PracticeSummary, Provenance } from "@/lib/types";

const requireUserMock = vi.fn();
const sGetMock = vi.fn();
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => notFoundMock(),
}));

vi.mock("@/lib/server-api", () => ({
  requireUser: (...args: unknown[]) => requireUserMock(...args),
  sGet: (...args: unknown[]) => sGetMock(...args),
}));

vi.mock("@/lib/client-api", () => ({
  clientRequest: vi.fn(async () => ({ ok: true, data: {} })),
}));

import Dashboard from "@/app/app/(user)/page";
import LessonPage from "@/app/app/(user)/courses/[slug]/lessons/[lessonSlug]/page";
import ProgressPage from "@/app/app/(user)/progress/page";
import PracticeHistory from "@/app/app/practice/(history)/page";
import HistoryPage from "@/app/app/latihan/riwayat/page";

const LEARNER_USER = {
  id: "u-learner",
  email: "pelajar@silatara.test",
  display_name: "Siti Pendekar",
  role: "learner" as const,
};

const SAMPLE_PROVENANCE: Provenance = {
  status: "published",
  is_demo: false,
  partner_verified: true,
  verification_label: "Sumber terverifikasi",
  source_citation: "Pedoman IPSI Dasar",
  source_url: "https://example.org/ipsi",
  approved_by_name: "Pelatih Agung",
  approved_at: "2026-01-10T00:00:00Z",
  content_basis: "source_backed",
  attribution: "Redaksi SILATARA",
};

const SAMPLE_SESSION: PracticeSession = {
  id: "sess-1",
  status: "completed",
  started_at: "2026-05-01T08:00:00Z",
  ended_at: "2026-05-01T08:04:00Z",
  active_duration_ms: 240000,
  paused_duration_ms: 0,
  model_version: "pose-v1",
  client_version: "1.0.0",
  quality_summary: null,
  error_code: null,
  lesson: {
    id: "les-1",
    slug: "kuda-kuda-tengah",
    title: "Kuda-kuda Tengah",
    course_slug: "dasar-pencak-silat",
    course_title: "Sikap & Gerak Dasar",
    is_demo: false,
    verification_label: "Sumber terverifikasi",
  },
};

const SAMPLE_PRACTICE_SUMMARY: PracticeSummary = {
  total_sessions: 3,
  completed_sessions: 3,
  total_active_seconds: 540,
  sessions_last_7_days: 2,
  active_seconds_last_7_days: 360,
  days: [
    { date: "2026-04-30", sessions: 1, active_seconds: 120 },
    { date: "2026-05-01", sessions: 2, active_seconds: 240 },
  ],
  last_session: SAMPLE_SESSION,
};

const SAMPLE_PROGRESS: MyProgress = {
  totals: { completed: 3, total: 6, percent: 50 },
  courses_completed: 1,
  enrollments: [
    {
      course: {
        id: "crs-1",
        slug: "dasar-pencak-silat",
        title: "Sikap & Gerak Dasar",
        summary: "Pengantar sikap dan kuda-kuda.",
        level: "beginner",
        estimated_minutes: 90,
        tradition_slug: "psdp",
        tradition_name: "Pencak Silat Dasar",
        partner_slug: null,
        partner_name: null,
        lesson_count: 4,
        provenance: SAMPLE_PROVENANCE,
      },
      enrollment: {
        status: "active",
        enrolled_at: "2026-04-01T00:00:00Z",
        completed_at: null,
        progress: { completed: 1, total: 4, percent: 25 },
        last_lesson_slug: "sikap-tegak",
        next_lesson_slug: "kuda-kuda-tengah",
      },
    },
    {
      course: {
        id: "crs-2",
        slug: "pengenalan-silek",
        title: "Pengenalan Silek Minangkabau",
        summary: "Teori dasar tradisi silek.",
        level: "beginner",
        estimated_minutes: 40,
        tradition_slug: "silek",
        tradition_name: "Silek Minangkabau",
        partner_slug: null,
        partner_name: null,
        lesson_count: 2,
        provenance: SAMPLE_PROVENANCE,
      },
      enrollment: {
        status: "completed",
        enrolled_at: "2026-03-10T00:00:00Z",
        completed_at: "2026-03-20T00:00:00Z",
        progress: { completed: 2, total: 2, percent: 100 },
        last_lesson_slug: "penutup",
        next_lesson_slug: null,
      },
    },
  ],
};

const SAMPLE_LESSON: LessonDetail = {
  id: "les-1",
  slug: "kuda-kuda-tengah",
  title: "Kuda-kuda Tengah",
  objective: "Mampu menjaga keseimbangan panggul dan posisi lutut pada kuda-kuda tengah.",
  body: "Buka kedua kaki selebar bahu lebih sedikit.\n\nTekuk kedua lutut perlahan sambil menjaga punggung tetap tegak.",
  safety_notes: "Lakukan pemanasan lutut dan pergelangan kaki sebelum berlatih. Hentikan jika terasa nyeri.",
  estimated_minutes: 20,
  module_title: "Modul 2: Kuda-kuda",
  course: SAMPLE_PROGRESS.enrollments[0].course,
  movement: {
    id: "mv-1",
    slug: "kuda-kuda-tengah",
    name_id: "Kuda-kuda Tengah",
    name_local: "Kudo-kudo Tangah",
    practice_mode: "solo_beginner",
    assessment_enabled: true,
    tradition_slug: "psdp",
    partner_slug: "padepokan-nusantara",
    partner_name: "Padepokan Nusantara",
    safety_category: "solo_beginner",
    version_no: 2,
    provenance: SAMPLE_PROVENANCE,
    description: "Posisi kaki sejajar dengan tumpuan seimbang di kedua tungkai.",
    safety_notes: "Pastikan lutut sejajar arah ujung kaki.",
    document: null,
  },
  materials: [
    {
      id: "mat-1",
      kind: "link",
      title: "Ringkasan postur kuda-kuda",
      content: "Catatan posisi bahu, pinggul, dan telapak kaki.",
      url: "https://example.org/kuda-kuda",
      attribution_text: "Redaksi SILATARA",
    },
  ],
  prev_lesson: { id: "les-0", slug: "sikap-tegak", title: "Sikap Tegak", order_index: 1, estimated_minutes: 15, completed: true },
  next_lesson: { id: "les-2", slug: "kuda-kuda-depan", title: "Kuda-kuda Depan", order_index: 3, estimated_minutes: 20, completed: false },
  provenance: SAMPLE_PROVENANCE,
  enrolled: true,
  lesson_status: "in_progress",
  practice: {
    available: true,
    reason: null,
    is_demo: false,
    label: "Latihan mandiri pemula dengan panduan kamera.",
  },
};

beforeEach(() => {
  requireUserMock.mockReset();
  sGetMock.mockReset();
  notFoundMock.mockReset();
  requireUserMock.mockResolvedValue(LEARNER_USER);
});

describe("Learner Dashboard (/app)", () => {
  it("renders Lanjutkan Belajar spotlight card, 4 KPIs, and dash-practice when enrolled", async () => {
    sGetMock.mockImplementation(async (path: string) => {
      if (path === "/me/progress") return { ok: true, data: SAMPLE_PROGRESS };
      if (path.startsWith("/me/practice-summary")) return { ok: true, data: SAMPLE_PRACTICE_SUMMARY };
      return { ok: false, status: 404, error: "not found" };
    });

    const { container } = render(await Dashboard({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "Halo, Siti Pendekar" })).toBeTruthy();

    const spotlight = screen.getByRole("region", { name: "Sikap & Gerak Dasar" });
    expect(within(spotlight).getByText("Lanjutkan Belajar", { selector: "span" })).toBeTruthy();
    expect(within(spotlight).getByText("Kuda Kuda Tengah")).toBeTruthy();
    const resumeCta = within(spotlight).getByRole("link", { name: /Lanjutkan Belajar/ });
    expect(resumeCta.getAttribute("href")).toBe("/app/courses/dasar-pencak-silat/lessons/kuda-kuda-tengah");
    expect(resumeCta.className).toContain("rounded-full");
    expect(resumeCta.className).not.toContain("bg-forest-700");

    expect(screen.getByTestId("dash-practice")).toBeTruthy();
    expect(container.innerHTML).not.toContain("\u2014");
    expect(container.innerHTML.toLowerCase()).not.toMatch(/emerald-|green-|teal-|#0b7a4b|#10945c|#315c4d|#e6f4ee/);
  });

  it("renders 3-step Quick-Start Bento panel with links to academy, library, and camera-check when not enrolled", async () => {
    sGetMock.mockImplementation(async (path: string) => {
      if (path === "/me/progress") {
        return { ok: true, data: { enrollments: [], totals: { completed: 0, total: 0, percent: 0 }, courses_completed: 0 } };
      }
      if (path.startsWith("/me/practice-summary")) {
        return {
          ok: true,
          data: { ...SAMPLE_PRACTICE_SUMMARY, total_sessions: 0, sessions_last_7_days: 0, last_session: null },
        };
      }
      return { ok: false, status: 404, error: "not found" };
    });

    render(await Dashboard({ searchParams: Promise.resolve({}) }));

    const quickStart = screen.getByRole("region", { name: "Mulai belajar pencak silat dalam 3 langkah" });
    const links = within(quickStart).getAllByRole("link");
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/academy", "/library", "/app/practice/camera-check"]);
    expect(screen.getByTestId("dash-practice")).toBeTruthy();
  });
});

describe("Lesson Reader (/app/courses/[slug]/lessons/[lessonSlug])", () => {
  it("renders structured Dicoding-style reader with header, target, safety, movement pills, right rail, and stepper", async () => {
    sGetMock.mockResolvedValue({ ok: true, data: SAMPLE_LESSON });

    const { container } = render(
      await LessonPage({ params: Promise.resolve({ slug: "dasar-pencak-silat", lessonSlug: "kuda-kuda-tengah" }) })
    );

    const breadcrumb = screen.getByRole("navigation", { name: "Jejak halaman" });
    expect(within(breadcrumb).getByRole("link", { name: "Akademi" }).getAttribute("href")).toBe("/academy");
    expect(within(breadcrumb).getByRole("link", { name: "Sikap & Gerak Dasar" })).toBeTruthy();
    expect(within(breadcrumb).getByText("Modul 2: Kuda-kuda")).toBeTruthy();

    expect(screen.getByRole("heading", { level: 1, name: "Kuda-kuda Tengah" })).toBeTruthy();
    expect(screen.getByText("20 menit")).toBeTruthy();
    expect(screen.getByText("Sedang dipelajari")).toBeTruthy();

    // Target Belajar callout & safety notice
    expect(screen.getByRole("heading", { name: "Target Belajar" })).toBeTruthy();
    expect(screen.getByText(SAMPLE_LESSON.objective!)).toBeTruthy();
    expect(screen.getByLabelText("Catatan keselamatan")).toBeTruthy();

    // Movement metadata pills
    expect(screen.getByRole("link", { name: "Perguruan: Padepokan Nusantara" })).toBeTruthy();
    expect(screen.getByText("Versi 2")).toBeTruthy();

    // Practice card test IDs
    expect(screen.getByTestId("practice-entry")).toBeTruthy();
    const startPractice = screen.getByTestId("start-practice");
    expect(startPractice.getAttribute("href")).toBe("/app/courses/dasar-pencak-silat/lessons/kuda-kuda-tengah/practice");
    expect(startPractice.className).toContain("rounded-full");

    // Sticky right rail with LessonActions + collapsible provenance
    const rail = screen.getByLabelText("Aksi dan sumber pelajaran");
    expect(within(rail).getByRole("button", { name: "Tandai selesai" })).toBeTruthy();
    expect(within(rail).getByText(/Sumber & Atribusi/)).toBeTruthy();

    // Prev / Next lesson stepper
    const stepper = screen.getByRole("navigation", { name: "Navigasi pelajaran" });
    expect(within(stepper).getByRole("link", { name: /Sikap Tegak/ }).getAttribute("href")).toBe(
      "/app/courses/dasar-pencak-silat/lessons/sikap-tegak"
    );
    expect(within(stepper).getByRole("link", { name: /Kuda-kuda Depan/ }).getAttribute("href")).toBe(
      "/app/courses/dasar-pencak-silat/lessons/kuda-kuda-depan"
    );

    expect(container.innerHTML).not.toContain("\u2014");
    expect(container.innerHTML.toLowerCase()).not.toMatch(/emerald-|green-|teal-|#0b7a4b|#10945c|#315c4d|#e6f4ee/);
  });
});

describe("Progress Page (/app/progress)", () => {
  it("renders status pills, percentage badges, Lanjutkan pill CTA, and progress-practice", async () => {
    const pageData: Page<PracticeSession> = { items: [SAMPLE_SESSION], page: 1, page_size: 3, total: 1, total_pages: 1 };
    sGetMock.mockImplementation(async (path: string) => {
      if (path === "/me/progress") return { ok: true, data: SAMPLE_PROGRESS };
      if (path.startsWith("/me/practice-sessions")) return { ok: true, data: pageData };
      return { ok: false, status: 404, error: "not found" };
    });

    const { container } = render(await ProgressPage());

    expect(screen.getByText("Aktif")).toBeTruthy();
    expect(screen.getAllByText("Selesai").length).toBeGreaterThan(0);
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();

    const continueLink = screen.getByRole("link", { name: /Lanjutkan/ });
    expect(continueLink.getAttribute("href")).toBe("/app/courses/dasar-pencak-silat/lessons/kuda-kuda-tengah");
    expect(continueLink.className).toContain("rounded-full");

    expect(screen.getByTestId("progress-practice")).toBeTruthy();
    expect(container.innerHTML).not.toContain("\u2014");
    expect(container.innerHTML.toLowerCase()).not.toMatch(/emerald-|green-|teal-/);
  });
});

describe("Practice History & Riwayat Skor", () => {
  it("preserves sum-total and session-list on /app/practice", async () => {
    const pageData: Page<PracticeSession> = { items: [SAMPLE_SESSION], page: 1, page_size: 8, total: 1, total_pages: 1 };
    sGetMock.mockImplementation(async (path: string) => {
      if (path.startsWith("/me/practice-summary")) return { ok: true, data: SAMPLE_PRACTICE_SUMMARY };
      if (path.startsWith("/me/practice-sessions")) return { ok: true, data: pageData };
      return { ok: false, status: 404, error: "not found" };
    });

    render(await PracticeHistory({ searchParams: Promise.resolve({}) }));

    expect(screen.getByTestId("sum-total").textContent).toBe("3");
    expect(screen.getByTestId("session-list")).toBeTruthy();
  });

  it("renders warm maroon/amber styling and collapsible feedback on /app/latihan/riwayat", async () => {
    sGetMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "att-1",
            created_at: "2026-05-01T08:00:00Z",
            movement_id: "mv.psdp.kuda-kuda-tengah",
            status: "scored",
            total_score: 84,
            input_quality: 0.92,
            protocol_version: "v1.2",
            feedback: ["Jaga punggung tetap tegak", "Lebarkan tumpuan sedikit lagi"],
            criteria: null,
          },
        ],
        by_movement: [
          { movement_id: "mv.psdp.kuda-kuda-tengah", attempts: 2, best_score: 84, average_score: 80 },
        ],
      },
    });

    const { container } = render(await HistoryPage());

    expect(screen.getByText("Skor 84")).toBeTruthy();
    expect(screen.getByText("Catatan umpan balik (2)")).toBeTruthy();
    const retryLink = screen.getByRole("link", { name: /Latih lagi/ });
    expect(retryLink.className).toContain("bg-[#fff6ee]");
    expect(container.innerHTML.toLowerCase()).not.toMatch(/emerald-|green-|teal-|#0b7a4b|#10945c|#315c4d|#e6f4ee/);
  });
});
