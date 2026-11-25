"use client";

import dynamic from "next/dynamic";
import {
  CardGridSkeleton,
  MapPageSkeleton,
  MediaStageSkeleton,
  StudioWorkspaceSkeleton,
} from "@/components/Skeleton";

export const LazyMovement3DPlayer = dynamic(
  () => import("@/components/knowledge/Movement3DPlayer").then((m) => m.Movement3DPlayer),
  { ssr: false, loading: () => <MediaStageSkeleton /> },
);

export const LazyDirectoryExplorer = dynamic(
  () => import("@/components/directory/DirectoryExplorer").then((m) => m.DirectoryExplorer),
  { ssr: false, loading: () => <MapPageSkeleton /> },
);

export const LazyPlaceMiniMap = dynamic(
  () => import("@/components/directory/PlaceMiniMap").then((m) => m.PlaceMiniMap),
  { ssr: false, loading: () => <MediaStageSkeleton className="h-64 w-full" /> },
);

export const LazyPracticeStudio = dynamic(
  () => import("@/components/PracticeStudio").then((m) => m.PracticeStudio),
  { ssr: false, loading: () => <StudioWorkspaceSkeleton /> },
);

export const LazyCameraCheck = dynamic(
  () => import("@/components/CameraCheck").then((m) => m.CameraCheck),
  { ssr: false, loading: () => <StudioWorkspaceSkeleton /> },
);

export const LazyBenchmarkRunner = dynamic(
  () => import("@/components/BenchmarkRunner").then((m) => m.BenchmarkRunner),
  { ssr: false, loading: () => <StudioWorkspaceSkeleton /> },
);

export const LazyAssessmentPractice = dynamic(
  () => import("@/components/assessment/AssessmentPractice").then((m) => m.AssessmentPractice),
  { ssr: false, loading: () => <StudioWorkspaceSkeleton /> },
);

export const LazyCalibrationWorkspace = dynamic(
  () => import("@/components/CalibrationWorkspace").then((m) => m.CalibrationWorkspace),
  { ssr: false, loading: () => <StudioWorkspaceSkeleton /> },
);

export const LazyProvinceExplorer = dynamic(
  () => import("@/components/heritage/ProvinceExplorer").then((m) => m.ProvinceExplorer),
  { loading: () => <CardGridSkeleton /> },
);

export const LazyHeritageSectionSwitcher = dynamic(
  () => import("@/components/heritage/HeritageSectionSwitcher").then((m) => m.HeritageSectionSwitcher),
  { loading: () => <CardGridSkeleton /> },
);

export const LazyLibraryCatalog = dynamic(
  () => import("@/components/knowledge/LibraryCatalog").then((m) => m.LibraryCatalog),
  { loading: () => <CardGridSkeleton /> },
);

export const LazyActivityChart = dynamic(
  () => import("@/components/ActivityChart").then((m) => m.ActivityChart),
  { loading: () => <MediaStageSkeleton className="h-36 w-full" /> },
);

export const LazyAnalyticsPanel = dynamic(
  () => import("@/components/pilot/AnalyticsPanel").then((m) => m.AnalyticsPanel),
  { loading: () => <StudioWorkspaceSkeleton /> },
);
