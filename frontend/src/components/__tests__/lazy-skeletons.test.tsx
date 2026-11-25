// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CardGridSkeleton,
  DetailPageSkeleton,
  ListSkeleton,
  MapPageSkeleton,
  MediaStageSkeleton,
  StudioWorkspaceSkeleton,
} from "@/components/Skeleton";
import {
  LazyActivityChart,
  LazyAnalyticsPanel,
  LazyAssessmentPractice,
  LazyBenchmarkRunner,
  LazyCalibrationWorkspace,
  LazyCameraCheck,
  LazyDirectoryExplorer,
  LazyHeritageSectionSwitcher,
  LazyLibraryCatalog,
  LazyMovement3DPlayer,
  LazyPlaceMiniMap,
  LazyPracticeStudio,
  LazyProvinceExplorer,
} from "@/components/LazyClients";

describe("Skeleton components", () => {
  const skeletons = [
    ["ListSkeleton", ListSkeleton],
    ["CardGridSkeleton", CardGridSkeleton],
    ["DetailPageSkeleton", DetailPageSkeleton],
    ["MediaStageSkeleton", MediaStageSkeleton],
    ["MapPageSkeleton", MapPageSkeleton],
    ["StudioWorkspaceSkeleton", StudioWorkspaceSkeleton],
  ] as const;

  it.each(skeletons)("%s renders accessible status region without deprecated greens or em-dashes", (_name, Comp) => {
    const { container } = render(<Comp />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Memuat");
    expect(container.innerHTML).not.toMatch(/emerald-|green-|teal-|#0B7A4B|#10945C|#315C4D|#E6F4EE|—/i);
  });
});

describe("LazyClients dynamic wrappers", () => {
  it("exports all expected dynamic client components", () => {
    const wrappers = [
      LazyMovement3DPlayer,
      LazyDirectoryExplorer,
      LazyPlaceMiniMap,
      LazyPracticeStudio,
      LazyCameraCheck,
      LazyBenchmarkRunner,
      LazyAssessmentPractice,
      LazyCalibrationWorkspace,
      LazyProvinceExplorer,
      LazyHeritageSectionSwitcher,
      LazyLibraryCatalog,
      LazyActivityChart,
      LazyAnalyticsPanel,
    ];
    for (const Wrapper of wrappers) {
      expect(Wrapper).toBeDefined();
    }
  });

  it("renders fallback skeleton and resolves LazyActivityChart dynamically", async () => {
    render(
      <LazyActivityChart
        days={[
          { date: "2026-11-20", sessions: 2, active_seconds: 180 },
          { date: "2026-11-21", sessions: 1, active_seconds: 90 },
        ]}
      />,
    );
    await waitFor(
      () => {
        expect(screen.getByRole("img")).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it("resolves LazyHeritageSectionSwitcher dynamically", async () => {
    render(<LazyHeritageSectionSwitcher entities={[]} regionalJurus={[]} />);
    await waitFor(
      () => {
        expect(screen.getByRole("heading")).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });
});
