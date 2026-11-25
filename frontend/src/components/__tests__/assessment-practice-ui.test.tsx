// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Protocol } from "@/features/assessment/types";

const apiGetMock = vi.fn();
const getCurrentUserMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/lib/api", () => ({
  apiGet: (...args: unknown[]) => apiGetMock(...args),
}));

vi.mock("@/lib/server-api", () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
}));

vi.mock("@/components/LazyClients", () => ({
  LazyAssessmentPractice: ({ movementTitle }: { movementTitle: string }) => (
    <div data-testid="lazy-assess-mock">{movementTitle}</div>
  ),
  LazyMovement3DPlayer: ({ title }: { title: string }) => (
    <div data-testid="lazy-3d-mock">{title}</div>
  ),
}));

import PracticePage from "@/app/library/[id]/latihan/page";
import { AssessmentPractice } from "@/components/assessment/AssessmentPractice";
import { PracticeReferencePanel } from "@/components/assessment/PracticeReferencePanel";

const SAMPLE_PROTOCOL: Protocol = {
  schema: "silatara.assessment-protocol/v1",
  protocol_id: "proto-kuda-tengah",
  movement_id: "kuda-kuda-tengah",
  protocol_version: "1.0.0",
  status: "active",
  calibration: "default",
  title: "Protokol Kuda-Kuda Tengah",
  summary: "Latihan posisi kuda-kuda tengah tampak depan.",
  reference_id: "ref-1",
  reference_animation_id: "anim-1",
  required_view: "front",
  required_landmarks: [11, 12, 23, 24, 25, 26, 27, 28],
  min_visibility: 0.5,
  body_positioning: ["Berdiri 2-3 meter dari kamera agar seluruh tubuh terlihat."],
  phases: [
    { keyframe: "awal", label: "Sikap awal", required: true },
    { keyframe: "tahan", label: "Tahan kuda-kuda", required: true },
  ],
  phase_completion_weight: 20,
  criteria: [
    {
      id: "c1",
      label: "Sudut tekukan lutut",
      feature: "knee_angle",
      phase_keyframe: "tahan",
      aggregate: "median",
      target: 110,
      tolerance: 15,
      falloff: 30,
      weight: 40,
      min_confidence: 0.6,
      unit: "deg",
      rationale: "Menjaga keseimbangan rendah",
      basis: "source",
      source_ids: ["src-1"],
      feedback: { below: "Tekuk sedikit lagi", above: "Jangan terlalu rendah", ok: "Sudah pas" },
    },
  ],
  alignment_features: ["knee_angle"],
  confidence_requirements: { min_valid_frame_ratio: 0.5, min_frames: 10, max_unmeasured_weight_ratio: 0.4 },
  scoring_formula: "weighted",
  interpretation_notes: [],
  source_ids: ["src-1"],
  disclaimer: "Panduan latihan mandiri, bukan penilaian resmi.",
};

describe("AssessmentPractice & PracticePage UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("enables the start button only after consent and transitions step on click", async () => {
    apiGetMock.mockResolvedValue({ ok: false, status: 500, error: "Referensi gagal dimuat" });
    const user = userEvent.setup();

    render(<AssessmentPractice protocol={SAMPLE_PROTOCOL} movementTitle="Kuda-Kuda Tengah" loggedIn={false} />);

    const section = screen.getByTestId("assess");
    expect(section.getAttribute("data-step")).toBe("intro");

    const startBtn = screen.getByRole("button", { name: /Coba Latihan Sekarang/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);

    const consentCheckbox = screen.getByRole("checkbox", { name: /setuju kamera dinyalakan/i });
    await user.click(consentCheckbox);
    expect(startBtn.disabled).toBe(false);

    await user.click(startBtn);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/Referensi gerak tidak dapat dimuat/i);
    expect(screen.getByTestId("assess").getAttribute("data-step")).toBe("error");
  });

  it("renders PracticePage 5-step strip with step 3 active and single unified right card", async () => {
    apiGetMock
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: "kuda-kuda-tengah",
          names: { primary: "Kuda-Kuda Tengah" },
          animation: { status: "needs_reference", animation_id: "anim-1", url: null, thumbnail_url: null, needs: null },
        },
      })
      .mockResolvedValueOnce({ ok: true, data: SAMPLE_PROTOCOL })
      .mockResolvedValueOnce({ ok: true, data: null });
    getCurrentUserMock.mockResolvedValue(null);

    const ui = await PracticePage({
      params: Promise.resolve({ id: "kuda-kuda-tengah" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByRole("heading", { level: 1, name: /Coba Kuda-Kuda Tengah/i })).toBeTruthy();
    expect(screen.queryByText(SAMPLE_PROTOCOL.summary)).toBeNull();
    const stepsList = screen.getByRole("list", { name: /Langkah latihan/i });
    const activeStep = stepsList.querySelector('[aria-current="step"]');
    expect(activeStep?.textContent).toMatch(/3\.\s*Coba latihan/);

    const aside = document.querySelector("aside");
    expect(aside?.children.length).toBe(1);
    expect(screen.getByRole("tablist", { name: /Panel referensi/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Peraga 3D/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /Kriteria \(2\)/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Keselamatan/i })).toBeTruthy();
  });

  it("switches PracticeReferencePanel tabs cleanly between Peraga 3D, Kriteria, and Keselamatan", async () => {
    const user = userEvent.setup();
    render(
      <PracticeReferencePanel
        criteria={SAMPLE_PROTOCOL.criteria}
        phaseCompletionWeight={SAMPLE_PROTOCOL.phase_completion_weight}
        disclaimer={SAMPLE_PROTOCOL.disclaimer}
      >
        <div data-testid="player-slot">3D Player Content</div>
      </PracticeReferencePanel>,
    );

    expect(screen.getByTestId("player-slot")).toBeTruthy();
    expect(screen.queryByText("Sudut tekukan lutut")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Kriteria \(2\)/i }));
    expect(screen.getByRole("tab", { name: /Kriteria \(2\)/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Sudut tekukan lutut")).toBeTruthy();
    expect(screen.getByText("bobot 40")).toBeTruthy();
    expect(screen.queryByTestId("player-slot")).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Keselamatan/i }));
    expect(screen.getByRole("tab", { name: /Keselamatan/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText(/Panduan Keselamatan/i)).toBeTruthy();
    expect(screen.queryByText("Sudut tekukan lutut")).toBeNull();
  });

  it("contains zero deprecated greens and zero em-dashes in redesigned UI files", () => {
    const files = [
      path.resolve(process.cwd(), "src/app/library/[id]/latihan/page.tsx"),
      path.resolve(process.cwd(), "src/components/assessment/AssessmentPractice.tsx"),
      path.resolve(process.cwd(), "src/components/assessment/PracticeReferencePanel.tsx"),
    ];
    for (const file of files) {
      const src = fs.readFileSync(file, "utf8");
      expect(src).not.toMatch(/#0B7A4B|#10945C|#315C4D|#E6F4EE/i);
      expect(src).not.toMatch(/\b(?:emerald|green|teal|forest|sage)-\d+/);
      expect(src).not.toContain("—");
    }
  });
});
