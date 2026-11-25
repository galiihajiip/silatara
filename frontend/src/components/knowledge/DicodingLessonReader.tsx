"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Dumbbell,
  ExternalLink,
  HelpCircle,
  Layers,
  ListChecks,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { CMS_BTN_PRIMARY } from "@/components/cms/Bento";
import { MovementVisual, SafetyPill } from "@/components/knowledge/Bits";
import { MovementStage } from "@/components/knowledge/MovementStage";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import type { ClipMeta } from "@/lib/character";
import { paragraphs } from "@/lib/format";
import type { CourseDetailK, LessonDetail as KLesson } from "@/lib/research";

export type ResolvedLessonMovement = KLesson["movements"][number] & {
  clip: ClipMeta | null;
  practicable: boolean;
};

type TabId = "materi" | "gerakan" | "latihan" | "rangkuman";

function estimateReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

function isNonEmptyChange(val: string | null | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && trimmed !== String.fromCharCode(8212) && trimmed !== "-";
}

function SyllabusOutline({
  courseSlug,
  currentLessonSlug,
  modules,
}: {
  courseSlug: string;
  currentLessonSlug: string;
  modules: CourseDetailK["modules"];
}) {
  const initialOpen = modules.reduce<Record<number, boolean>>((acc, mod) => {
    const hasCurrent = mod.lessons.some((item) => item.slug === currentLessonSlug);
    acc[mod.order] = hasCurrent || modules.length <= 2;
    return acc;
  }, {});
  const [openMap, setOpenMap] = useState<Record<number, boolean>>(initialOpen);

  return (
    <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#fff6ee] text-[#9a3412]">
            <Layers aria-hidden className="h-4 w-4" />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
            Daftar Modul & Pelajaran
          </h2>
        </div>
        <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2 py-0.5 font-mono text-[11px] font-bold text-[#6d1b11]">
          {modules.length} modul
        </span>
      </div>

      <div className="max-h-[26rem] space-y-2.5 overflow-y-auto pr-1">
        {modules.map((mod) => {
          const isOpen = !!openMap[mod.order];
          const containsActive = mod.lessons.some((item) => item.slug === currentLessonSlug);
          return (
            <div
              key={mod.order}
              className={`rounded-2xl border transition-colors ${
                containsActive ? "border-[#fed7aa] bg-[#fffaf5]" : "border-[#ece2d8] bg-[#faf7f4]"
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenMap((prev) => ({ ...prev, [mod.order]: !prev[mod.order] }))}
                className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
              >
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6d1b11] to-[#c2410c] font-mono text-[11px] font-bold text-white">
                    {String(mod.order).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-snug text-[#2e0909]">{mod.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {mod.lessons.length} pelajaran
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp aria-hidden className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                ) : (
                  <ChevronDown aria-hidden className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <ol className="space-y-1 border-t border-[#ece2d8]/80 px-2 py-2">
                  {mod.lessons.map((item) => {
                    const active = item.slug === currentLessonSlug;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={`/academy/courses/${courseSlug}/lessons/${item.slug}`}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-start justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                            active
                              ? "border border-[#fed7aa] bg-white font-semibold text-[#4a0d0d] shadow-2xs"
                              : "text-slate-700 hover:bg-white hover:text-[#2e0909]"
                          }`}
                        >
                          <span className="flex min-w-0 items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                active
                                  ? "bg-[#c2410c] text-white"
                                  : "bg-[#ece2d8] text-slate-600"
                              }`}
                            >
                              {item.order}
                            </span>
                            <span className="leading-snug">{item.title}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-[#faf7f4] px-2 py-0.5 font-mono text-[10px] text-slate-600">
                            {item.duration_min} mnt
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DicodingLessonReader({
  courseSlug,
  lessonSlug,
  lesson,
  courseModules,
  movements,
  progressSlot,
}: {
  courseSlug: string;
  lessonSlug: string;
  lesson: KLesson;
  courseModules: CourseDetailK["modules"];
  movements: ResolvedLessonMovement[];
  progressSlot?: React.ReactNode;
}) {
  const hasMovements = movements.length > 0;
  const hasPracticeOrQuiz = lesson.practice_steps.length > 0 || lesson.quiz.length > 0;
  const hasSummaryOrReflection = Boolean(lesson.summary) || lesson.reflection.length > 0;

  const tabs: { id: TabId; label: string; badge?: string }[] = [
    { id: "materi", label: "Materi & Konteks" },
    ...(hasMovements
      ? [{ id: "gerakan" as const, label: "Peraga & Gerakan", badge: String(movements.length) }]
      : []),
    ...(hasPracticeOrQuiz
      ? [
          {
            id: "latihan" as const,
            label: "Latihan & Kuis",
            badge: lesson.quiz.length > 0 ? `${lesson.quiz.length} kuis` : undefined,
          },
        ]
      : []),
    ...(hasSummaryOrReflection ? [{ id: "rangkuman" as const, label: "Rangkuman" }] : []),
  ];

  const [activeTab, setActiveTab] = useState<TabId>("materi");
  const [cultureOpen, setCultureOpen] = useState(true);
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);
  const [refsOpen, setRefsOpen] = useState(false);

  // Interactive practice step checklist
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  // Interactive quiz state: question index -> selected option index
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const base = `/academy/courses/${courseSlug}/lessons`;
  const theoryParagraphs = paragraphs(lesson.theory);
  const culturalParagraphs = paragraphs(lesson.cultural_explanation);
  const readingMins = estimateReadingMinutes(`${lesson.theory} ${lesson.cultural_explanation}`);

  return (
    <article className="space-y-6">
      {/* Top Compact Header Card */}
      <header className="relative overflow-hidden rounded-[28px] border border-[#7c1d1d]/30 bg-gradient-to-br from-[#2e0909] via-[#4a120b] to-[#6d1b11] p-6 text-white shadow-md sm:p-7">
        <SilatPatternTumpal className="text-[#fde68a]" opacity={0.07} />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#ea580c]/30 via-[#fbbf24]/15 to-transparent blur-3xl"
        />

        <div className="relative z-10 space-y-3">
          <nav aria-label="Jejak halaman" className="flex flex-wrap items-center gap-1.5 text-xs text-[#ffedd5]/85">
            <Link className="underline-offset-2 hover:text-white hover:underline" href="/academy">
              Akademi
            </Link>
            <span aria-hidden>/</span>
            <Link
              className="underline-offset-2 hover:text-white hover:underline"
              href={`/academy/courses/${courseSlug}`}
            >
              {lesson.course.title}
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-[#fde68a]">{lesson.module}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fde68a]/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#fde68a]">
              <BookOpen aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>{lesson.module}</span>
            </span>
          </div>

          <h1 className="font-serif text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">
            {lesson.description}
          </p>

          <ul aria-label="Info pelajaran" className="flex flex-wrap gap-2 pt-1">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
              <Clock aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>±{lesson.duration_min} menit</span>
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
              <Package aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>Peralatan: {lesson.equipment}</span>
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>Ruang: {lesson.space}</span>
            </li>
          </ul>
        </div>
      </header>

      {/* Mobile Syllabus Toggle */}
      {courseModules.length > 0 && (
        <div className="lg:hidden">
          <button
            type="button"
            aria-expanded={mobileSyllabusOpen}
            onClick={() => setMobileSyllabusOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3 text-sm font-semibold text-[#2e0909] shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Layers aria-hidden className="h-4 w-4 text-[#9a3412]" />
              <span>Daftar Materi ({courseModules.length} modul)</span>
            </span>
            {mobileSyllabusOpen ? (
              <ChevronUp aria-hidden className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown aria-hidden className="h-4 w-4 text-slate-500" />
            )}
          </button>
          {mobileSyllabusOpen && (
            <div className="mt-3">
              <SyllabusOutline
                courseSlug={courseSlug}
                currentLessonSlug={lessonSlug}
                modules={courseModules}
              />
            </div>
          )}
        </div>
      )}

      {/* 2-Column Learning Workspace */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start">
        {/* Main Learning Area */}
        <div className="min-w-0 space-y-6">
          {/* Learning Segment Tabs */}
          <div className="rounded-[22px] border border-[#e7d7c8] bg-[#faf7f4] p-1.5">
            <div role="tablist" aria-label="Bagian pelajaran" className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                      selected
                        ? "bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] text-white shadow-xs"
                        : "text-slate-700 hover:bg-white hover:text-[#2e0909]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          selected
                            ? "bg-white/20 text-white"
                            : "border border-[#fed7aa] bg-[#fff6ee] text-[#9a3412]"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: Materi & Konteks */}
          {activeTab === "materi" && (
            <div
              role="tabpanel"
              id="panel-materi"
              aria-labelledby="tab-materi"
              className="space-y-5"
            >
              {/* Target & Prasyarat 2-col Bento strip */}
              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#fff6ee] text-[#c2410c]">
                      <CheckCircle2 aria-hidden className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#2e0909]">
                      Target Belajar
                    </h2>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {lesson.objectives.map((obj) => (
                      <li key={obj} className="flex items-start gap-2.5">
                        <CheckCircle2
                          aria-hidden
                          className="mt-0.5 h-4 w-4 shrink-0 text-[#c2410c]"
                        />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-[24px] border border-[#fed7aa] bg-[#fff6ee] p-5 shadow-2xs">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-xl bg-white text-[#9a3412] shadow-2xs">
                      <ShieldCheck aria-hidden className="h-4 w-4" />
                    </span>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#4a0d0d]">
                      Prasyarat & Keselamatan
                    </h2>
                  </div>
                  <p className="text-sm leading-relaxed text-[#2e0909]">
                    <strong className="font-semibold">Prasyarat:</strong> {lesson.prior_competence}
                  </p>
                  <p className="mt-3 rounded-xl border border-[#fed7aa]/80 bg-white/80 px-3.5 py-2.5 text-sm leading-relaxed text-[#6d1b11]">
                    {lesson.safety_briefing}
                  </p>
                </section>
              </div>

              {/* Materi Inti */}
              <section
                aria-labelledby="teori-heading"
                className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#ece2d8] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                      <BookOpen aria-hidden className="h-4 w-4" />
                    </span>
                    <h2 id="teori-heading" className="font-serif text-xl font-bold text-[#2e0909]">
                      Materi Inti
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#9a3412]">
                    <Clock aria-hidden className="h-3.5 w-3.5" />
                    <span>±{readingMins} mnt baca</span>
                  </span>
                </div>

                <div className="space-y-4">
                  {theoryParagraphs.map((para, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#ece2d8]/70 bg-[#FFFDF9] px-4 py-3.5 text-base leading-relaxed text-slate-800"
                    >
                      {para}
                    </div>
                  ))}
                </div>
              </section>

              {/* Expandable Konteks Budaya */}
              {culturalParagraphs.length > 0 && (
                <section
                  aria-labelledby="budaya-heading"
                  className="rounded-[24px] border border-[#e7d7c8] bg-white shadow-2xs"
                >
                  <button
                    type="button"
                    aria-expanded={cultureOpen}
                    onClick={() => setCultureOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff6ee] text-[#9a3412]">
                        <Compass aria-hidden className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 id="budaya-heading" className="font-serif text-lg font-bold text-[#2e0909]">
                          Konteks Budaya
                        </h2>
                        <p className="text-xs text-slate-500">
                          Nilai tradisi dan latar historis gerakan
                        </p>
                      </div>
                    </div>
                    {cultureOpen ? (
                      <ChevronUp aria-hidden className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronDown aria-hidden className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {cultureOpen && (
                    <div className="space-y-3 border-t border-[#ece2d8] px-5 py-4 text-sm leading-relaxed text-slate-700 sm:px-6 sm:text-base">
                      {culturalParagraphs.map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Quick CTA to next tab */}
              {hasMovements ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("gerakan")}
                    className={CMS_BTN_PRIMARY}
                  >
                    <span>Lanjut ke Peraga & Gerakan</span>
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              ) : hasPracticeOrQuiz ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("latihan")}
                    className={CMS_BTN_PRIMARY}
                  >
                    <span>Lanjut ke Latihan & Kuis</span>
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: Peraga & Gerakan */}
          {activeTab === "gerakan" && hasMovements && (
            <div
              role="tabpanel"
              id="panel-gerakan"
              aria-labelledby="tab-gerakan"
              className="space-y-5"
            >
              {movements.map((m) => {
                const mistakes = m.common_mistakes.map((x) =>
                  typeof x === "string" ? x : x.text,
                );
                return (
                  <section
                    key={m.slug}
                    className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
                  >
                    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
                      <div>
                        <MovementStage
                          clip={m.clip}
                          title={m.name}
                          twoD={<MovementVisual a={m.animation} title={m.name} />}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="font-serif text-xl font-bold text-[#2e0909]">
                            <Link className="hover:underline" href={`/library/${m.slug}`}>
                              {m.name}
                            </Link>
                          </h2>
                          <SafetyPill cls={m.safety_class} />
                        </div>

                        <ol className="mt-4 space-y-2.5">
                          {m.phases.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-start gap-3 rounded-2xl border border-[#ece2d8] bg-[#faf7f4] px-3.5 py-2.5 text-sm"
                            >
                              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d1b11] to-[#c2410c] font-mono text-[11px] font-bold text-white">
                                {p.order}
                              </span>
                              <span className="leading-relaxed text-slate-800">
                                <strong className="font-semibold text-[#2e0909]">{p.name}.</strong>{" "}
                                {isNonEmptyChange(p.change) ? p.change : p.start_position}{" "}
                                <span className="text-slate-600">→ {p.end_position}</span>
                              </span>
                            </li>
                          ))}
                        </ol>

                        {mistakes.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-[#fed7aa] bg-[#fff6ee] px-4 py-3 text-sm text-[#6d1b11]">
                            <span className="font-bold">Perhatikan: </span>
                            <span>{mistakes.join("; ")}</span>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {m.practicable && (
                            <Link
                              href={`/library/${m.slug}/latihan?pelajaran=${encodeURIComponent(
                                `${courseSlug}/${lessonSlug}`,
                              )}`}
                              className={CMS_BTN_PRIMARY}
                            >
                              <Camera aria-hidden className="h-4 w-4" />
                              <span>Coba Latihan Sekarang</span>
                            </Link>
                          )}
                          <Link
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e7d7c8] bg-white px-4 py-2 text-sm font-medium text-[#4a0d0d] transition-colors hover:border-[#fed7aa] hover:bg-[#fff6ee]"
                            href={`/library/${m.slug}`}
                          >
                            <span>Uraian lengkap & posisi tubuh</span>
                            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}

              {hasPracticeOrQuiz && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("latihan")}
                    className={CMS_BTN_PRIMARY}
                  >
                    <span>Lanjut ke Latihan & Kuis</span>
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Latihan & Kuis */}
          {activeTab === "latihan" && hasPracticeOrQuiz && (
            <div
              role="tabpanel"
              id="panel-latihan"
              aria-labelledby="tab-latihan"
              className="space-y-6"
            >
              {lesson.practice_steps.length > 0 && (
                <section
                  aria-labelledby="latihan-heading"
                  className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff6ee] text-[#c2410c]">
                        <Dumbbell aria-hidden className="h-4 w-4" />
                      </span>
                      <div>
                        <h2 id="latihan-heading" className="font-serif text-xl font-bold text-[#2e0909]">
                          Latihan Mandiri
                        </h2>
                        <p className="text-xs text-slate-500">
                          Klik langkah untuk menandai bagian yang sudah dicoba
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-1 font-mono text-xs font-semibold text-[#9a3412]">
                      {Object.values(checkedSteps).filter(Boolean).length}/{lesson.practice_steps.length}
                    </span>
                  </div>

                  <ol className="space-y-2.5">
                    {lesson.practice_steps.map((step, idx) => {
                      const done = !!checkedSteps[idx];
                      return (
                        <li key={step}>
                          <button
                            type="button"
                            aria-pressed={done}
                            onClick={() =>
                              setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                              done
                                ? "border-[#fed7aa] bg-[#fff6ee] text-[#4a0d0d]"
                                : "border-[#ece2d8] bg-[#faf7f4] text-slate-800 hover:border-[#fed7aa] hover:bg-white"
                            }`}
                          >
                            <span
                              className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                done
                                  ? "bg-[#c2410c] text-white"
                                  : "bg-white text-[#6d1b11] ring-1 ring-[#e7d7c8]"
                              }`}
                            >
                              {done ? <Check aria-hidden className="h-3.5 w-3.5" /> : idx + 1}
                            </span>
                            <span className={done ? "line-through opacity-80" : ""}>{step}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {lesson.quiz.length > 0 && (
                <section
                  aria-labelledby="kuis-heading"
                  className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                      <HelpCircle aria-hidden className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 id="kuis-heading" className="font-serif text-xl font-bold text-[#2e0909]">
                        Uji Pemahaman
                      </h2>
                      <p className="text-xs text-slate-500">
                        Pilih jawaban yang paling tepat untuk memeriksa pemahaman Anda
                      </p>
                    </div>
                  </div>

                  <ol className="space-y-4">
                    {lesson.quiz.map((q, qIdx) => {
                      const picked = selectedAnswers[qIdx];
                      const isCorrect = picked === q.answer_index;
                      const hasPicked = picked !== undefined;
                      const revealed = !!revealedAnswers[qIdx];

                      return (
                        <li
                          key={q.q}
                          className="rounded-2xl border border-[#ece2d8] bg-[#FFFDF9] p-4 sm:p-5"
                        >
                          <p className="font-semibold text-[#2e0909]">
                            {qIdx + 1}. {q.q}
                          </p>

                          <div className="mt-3 grid gap-2">
                            {q.options.map((opt, oIdx) => {
                              const letter = "ABCD"[oIdx] ?? String(oIdx + 1);
                              const isSelected = picked === oIdx;
                              const isRightOption = oIdx === q.answer_index;

                              let btnStyle =
                                "border-[#e7d7c8] bg-white text-slate-800 hover:border-[#ea580c]/60 hover:bg-[#fffaf5]";
                              if (isSelected && isCorrect) {
                                btnStyle =
                                  "border-[#c2410c] bg-[#fff6ee] font-semibold text-[#4a0d0d] ring-1 ring-[#c2410c]/40";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "border-rose-300 bg-rose-50 text-rose-900";
                              } else if (revealed && isRightOption) {
                                btnStyle =
                                  "border-[#c2410c] bg-[#fff6ee] font-semibold text-[#4a0d0d]";
                              }

                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() =>
                                    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                                  }
                                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${btnStyle}`}
                                >
                                  <span className="flex items-center gap-2.5">
                                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current/20 font-mono text-xs font-bold">
                                      {letter}
                                    </span>
                                    <span>{opt}</span>
                                  </span>
                                  {isSelected && isCorrect && (
                                    <CheckCircle2
                                      aria-hidden
                                      className="h-4 w-4 shrink-0 text-[#c2410c]"
                                    />
                                  )}
                                  {isSelected && !isCorrect && (
                                    <XCircle
                                      aria-hidden
                                      className="h-4 w-4 shrink-0 text-rose-600"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div>
                              {hasPicked && isCorrect && (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#9a3412]">
                                  <CheckCircle2 aria-hidden className="h-4 w-4" />
                                  Benar! Jawaban tepat.
                                </span>
                              )}
                              {hasPicked && !isCorrect && (
                                <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                                  <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                                  Belum tepat, coba pilih jawaban lain.
                                </span>
                              )}
                            </div>

                            {!isCorrect && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedAnswers((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }))
                                }
                                className="font-semibold text-[#6d1b11] underline underline-offset-2 hover:text-[#c2410c]"
                              >
                                {revealed ? "Sembunyikan jawaban" : "Lihat penjelasan jawaban"}
                              </button>
                            )}
                          </div>

                          {revealed && !isCorrect && (
                            <p className="mt-2 rounded-xl border border-[#fed7aa] bg-[#fff6ee] px-3 py-2 text-xs text-[#4a0d0d]">
                              Jawaban yang benar:{" "}
                              <strong>
                                {"ABCD"[q.answer_index]}. {q.options[q.answer_index]}
                              </strong>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              {hasSummaryOrReflection && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("rangkuman")}
                    className={CMS_BTN_PRIMARY}
                  >
                    <span>Lanjut ke Rangkuman</span>
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Rangkuman */}
          {activeTab === "rangkuman" && hasSummaryOrReflection && (
            <div
              role="tabpanel"
              id="panel-rangkuman"
              aria-labelledby="tab-rangkuman"
              className="space-y-5"
            >
              {lesson.summary && (
                <section
                  aria-labelledby="rangkuman-heading"
                  className="rounded-[24px] border border-[#fed7aa] bg-gradient-to-br from-[#fff6ee] to-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                      <Sparkles aria-hidden className="h-4 w-4" />
                    </span>
                    <h2 id="rangkuman-heading" className="font-serif text-xl font-bold text-[#2e0909]">
                      Rangkuman Pelajaran
                    </h2>
                  </div>
                  <p className="text-base leading-relaxed text-[#2e0909]">{lesson.summary}</p>
                </section>
              )}

              {lesson.reflection.length > 0 && (
                <section
                  aria-labelledby="refleksi-heading"
                  className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff6ee] text-[#9a3412]">
                      <ListChecks aria-hidden className="h-4 w-4" />
                    </span>
                    <h2 id="refleksi-heading" className="font-serif text-xl font-bold text-[#2e0909]">
                      Pertanyaan Refleksi
                    </h2>
                  </div>
                  <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {lesson.reflection.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 rounded-2xl border border-[#ece2d8] bg-[#faf7f4] px-4 py-3"
                      >
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c2410c]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* Dicoding-style Bottom Stepper Bar */}
          <nav
            aria-label="Navigasi pelajaran"
            className="grid gap-3 border-t border-[#e7d7c8] pt-5 sm:grid-cols-2"
          >
            {lesson.prev ? (
              <Link
                href={`${base}/${lesson.prev.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3.5 transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#faf7f4] text-[#6d1b11] transition-colors group-hover:bg-[#fff6ee]">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Sebelumnya
                  </span>
                  <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                    {lesson.prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <Link
                href={`/academy/courses/${courseSlug}`}
                className="group flex items-center gap-3 rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3.5 transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#faf7f4] text-[#6d1b11] transition-colors group-hover:bg-[#fff6ee]">
                  <ArrowLeft aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Kurikulum
                  </span>
                  <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                    Kembali ke daftar modul
                  </span>
                </span>
              </Link>
            )}

            {lesson.next ? (
              <Link
                href={`${base}/${lesson.next.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff6ee] to-white px-4 py-3.5 text-right transition-all hover:border-[#ea580c] hover:shadow-xs"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
                    Selanjutnya
                  </span>
                  <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                    {lesson.next.title}
                  </span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <Link
                href={`/academy/courses/${courseSlug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff6ee] to-white px-4 py-3.5 text-right transition-all hover:border-[#ea580c] hover:shadow-xs"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
                    Selesai
                  </span>
                  <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                    Kembali ke kurikulum
                  </span>
                </span>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                  <CheckCircle2 aria-hidden className="h-4 w-4" />
                </span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[5.25rem]">
          {progressSlot && (
            <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-4 shadow-xs">
              {progressSlot}
            </div>
          )}

          {courseModules.length > 0 && (
            <div className="hidden lg:block">
              <SyllabusOutline
                courseSlug={courseSlug}
                currentLessonSlug={lessonSlug}
                modules={courseModules}
              />
            </div>
          )}

          {lesson.references.length > 0 && (
            <div className="rounded-[24px] border border-[#e7d7c8] bg-white shadow-xs">
              <button
                type="button"
                aria-expanded={refsOpen}
                onClick={() => setRefsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left"
              >
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                  Referensi & Sumber ({lesson.references.length})
                </span>
                {refsOpen ? (
                  <ChevronUp aria-hidden className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown aria-hidden className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {refsOpen && (
                <ul className="space-y-2.5 border-t border-[#ece2d8] px-4 py-3 text-xs text-slate-600">
                  {lesson.references.map((ref, idx) => (
                    <li key={`${ref.source_id}-${idx}`} className="space-y-0.5">
                      <p className="font-medium text-[#2e0909]">{ref.citation}</p>
                      {ref.locator && <p className="text-[11px] text-slate-500">{ref.locator}</p>}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 text-[#9a3412] underline"
                        >
                          <span>Buka tautan</span>
                          <ExternalLink aria-hidden className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
