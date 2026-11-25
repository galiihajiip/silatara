import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { CMS_BTN_PRIMARY } from "@/components/cms/Bento";
import {
  DicodingLessonReader,
  type ResolvedLessonMovement,
} from "@/components/knowledge/DicodingLessonReader";
import { LessonActions } from "@/components/LessonActions";
import { SilatPatternTumpal } from "@/components/SilatMotifs";
import { ErrorState } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { clipForSlug, type CharacterManifest } from "@/lib/character";
import { formatMinutes, paragraphs } from "@/lib/format";
import type { CourseDetailK, LessonDetail as KLesson } from "@/lib/research";
import { getCurrentUser, sGet } from "@/lib/server-api";
import type { CourseDetail, LessonDetail } from "@/lib/types";

type P = { params: Promise<{ slug: string; lessonSlug: string }> };
const kPath = (s: string, l: string) => `/research/curricula/${encodeURIComponent(s)}/${encodeURIComponent(l)}`;
const dbPath = (s: string, l: string) => `/courses/${encodeURIComponent(s)}/lessons/${encodeURIComponent(l)}`;

export async function generateMetadata({ params }: P) {
  const { slug, lessonSlug } = await params;
  const canonical = `/academy/courses/${slug}/lessons/${lessonSlug}`;
  const k = await apiGet<KLesson>(kPath(slug, lessonSlug));
  if (k.ok) {
    return {
      title: `${k.data.title} | ${k.data.course.title}`,
      description: k.data.description.slice(0, 160),
      alternates: { canonical },
    };
  }
  const d = await apiGet<LessonDetail>(dbPath(slug, lessonSlug));
  return { title: d.ok ? `${d.data.title} | ${d.data.course.title}` : "Pelajaran", alternates: { canonical } };
}

/** Pelajaran publik: terbuka tanpa login. Bila pengguna masuk & mengikuti kursus, progres dapat disimpan. */
export default async function PublicLessonPage({ params }: P) {
  const { slug, lessonSlug } = await params;
  const [k, db, courseK, user, ch, pr] = await Promise.all([
    apiGet<KLesson>(kPath(slug, lessonSlug)),
    sGet<LessonDetail>(dbPath(slug, lessonSlug)),
    apiGet<CourseDetailK>(`/research/courses/${encodeURIComponent(slug)}`),
    getCurrentUser(),
    apiGet<CharacterManifest>("/research/character"),
    apiGet<{ items: { movement_id: string; status: string }[] }>("/research/assessment/protocols"),
  ]);

  const manifest = ch.ok ? ch.data : null;
  const practicable = (mslug: string) =>
    pr.ok && pr.data.items.some((x) => x.status === "active" && x.movement_id.endsWith(`.${mslug}`));

  if (!k.ok && !db.ok) {
    return k.status === 404 && db.status === 404 ? (
      notFound()
    ) : (
      <ErrorState
        message={db.ok ? k.error : db.error}
        retryHref={`/academy/courses/${slug}/lessons/${lessonSlug}`}
      />
    );
  }

  const base = `/academy/courses/${slug}/lessons`;
  const progressSlot =
    db.ok && user ? (
      <LessonActions
        lessonId={db.data.id}
        courseSlug={slug}
        enrolled={db.data.enrolled}
        completed={db.data.lesson_status === "completed"}
      />
    ) : null;

  if (!k.ok && db.ok) {
    // Pelajaran dari kurikulum mitra (Studio)
    const l = db.data;
    const courseDb = await sGet<CourseDetail>(`/courses/${encodeURIComponent(slug)}`);
    const studioModules = courseDb.ok ? courseDb.data.modules : [];
    const duration = formatMinutes(l.estimated_minutes);
    const bodyParagraphs = paragraphs(l.body);

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
                href={`/academy/courses/${slug}`}
              >
                {l.course.title}
              </Link>
              <span aria-hidden>/</span>
              <span className="font-medium text-[#fde68a]">{l.module_title}</span>
            </nav>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fde68a]/30 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#fde68a]">
              <BookOpen aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
              <span>{l.module_title}</span>
            </span>

            <h1 className="font-serif text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
              {l.title}
            </h1>
            {l.objective && (
              <p className="max-w-3xl text-sm leading-relaxed text-[#ffedd5]/90 sm:text-base">
                {l.objective}
              </p>
            )}

            {duration && (
              <ul aria-label="Info pelajaran" className="flex flex-wrap gap-2 pt-1">
                <li className="inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-medium text-[#fff7ed]">
                  <Clock aria-hidden className="h-3.5 w-3.5 text-[#fbbf24]" />
                  <span>Perkiraan {duration}</span>
                </li>
              </ul>
            )}
          </div>
        </header>

        {/* 2-Column Learning Workspace */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20.5rem] lg:items-start">
          <div className="min-w-0 space-y-5">
            {l.safety_notes && (
              <section className="rounded-[24px] border border-[#fed7aa] bg-[#fff6ee] p-5 shadow-2xs">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck aria-hidden className="h-5 w-5 text-[#9a3412]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#4a0d0d]">
                    Keselamatan
                  </h2>
                </div>
                <p className="text-sm leading-relaxed text-[#6d1b11]">{l.safety_notes}</p>
              </section>
            )}

            <section className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-2xs sm:p-6">
              <div className="mb-4 flex items-center gap-2.5 border-b border-[#ece2d8] pb-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                  <BookOpen aria-hidden className="h-4 w-4" />
                </span>
                <h2 className="font-serif text-xl font-bold text-[#2e0909]">Materi Pelajaran</h2>
              </div>
              <div className="space-y-4">
                {bodyParagraphs.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#ece2d8]/70 bg-[#FFFDF9] px-4 py-3.5 text-base leading-relaxed text-slate-800"
                  >
                    {p}
                  </div>
                ))}
              </div>
            </section>

            {(l.movement || (user && l.practice.available)) && (
              <section className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4] p-5">
                {l.movement && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#9a3412]">
                      Gerakan Terkait
                    </p>
                    <Link
                      className="mt-0.5 inline-block font-serif text-lg font-bold text-[#2e0909] hover:underline"
                      href={`/library/${l.movement.id}`}
                    >
                      {l.movement.name_id}
                    </Link>
                  </div>
                )}
                {user && l.practice.available && (
                  <Link href={`/app/courses/${slug}/lessons/${l.slug}`} className={CMS_BTN_PRIMARY}>
                    <Camera aria-hidden className="h-4 w-4" />
                    <span>Buka latihan dengan kamera</span>
                  </Link>
                )}
              </section>
            )}

            {/* Dicoding-style Bottom Stepper Bar */}
            <nav
              aria-label="Navigasi pelajaran"
              className="grid gap-3 border-t border-[#e7d7c8] pt-5 sm:grid-cols-2"
            >
              {l.prev_lesson ? (
                <Link
                  href={`${base}/${l.prev_lesson.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3.5 transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#faf7f4] text-[#6d1b11]">
                    <ArrowLeft aria-hidden className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Sebelumnya
                    </span>
                    <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                      {l.prev_lesson.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/academy/courses/${slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3.5 transition-all hover:border-[#fed7aa] hover:bg-[#fffaf5]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#faf7f4] text-[#6d1b11]">
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

              {l.next_lesson ? (
                <Link
                  href={`${base}/${l.next_lesson.slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff6ee] to-white px-4 py-3.5 text-right transition-all hover:border-[#ea580c]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#9a3412]">
                      Selanjutnya
                    </span>
                    <span className="line-clamp-1 block text-sm font-semibold text-[#2e0909]">
                      {l.next_lesson.title}
                    </span>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6d1b11] to-[#c2410c] text-white">
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/academy/courses/${slug}`}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff6ee] to-white px-4 py-3.5 text-right transition-all hover:border-[#ea580c]"
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

          <aside className="space-y-4 lg:sticky lg:top-[5.25rem]">
            {progressSlot && (
              <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-4 shadow-xs">
                {progressSlot}
              </div>
            )}

            {studioModules.length > 0 && (
              <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-4 shadow-xs">
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#fff6ee] text-[#9a3412]">
                    <Layers aria-hidden className="h-4 w-4" />
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a3412]">
                    Daftar Modul & Pelajaran
                  </h2>
                </div>
                <div className="max-h-[24rem] space-y-2.5 overflow-y-auto pr-1">
                  {studioModules.map((mod) => (
                    <div key={mod.id} className="rounded-2xl border border-[#ece2d8] bg-[#faf7f4] p-2.5">
                      <p className="px-1 text-xs font-bold text-[#2e0909]">{mod.title}</p>
                      <ol className="mt-2 space-y-1">
                        {mod.lessons.map((item) => {
                          const active = item.slug === lessonSlug;
                          return (
                            <li key={item.id}>
                              <Link
                                href={`${base}/${item.slug}`}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                                  active
                                    ? "border border-[#fed7aa] bg-white font-semibold text-[#4a0d0d]"
                                    : "text-slate-700 hover:bg-white hover:text-[#2e0909]"
                                }`}
                              >
                                <span className="line-clamp-1">{item.title}</span>
                                {item.estimated_minutes && (
                                  <span className="shrink-0 font-mono text-[10px] text-slate-500">
                                    {item.estimated_minutes} mnt
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </article>
    );
  }

  const l = (k as { ok: true; data: KLesson }).data;
  const resolvedMovements: ResolvedLessonMovement[] = l.movements.map((m) => ({
    ...m,
    clip: clipForSlug(manifest, m.slug),
    practicable: practicable(m.slug),
  }));
  const courseModules = courseK.ok ? courseK.data.modules : [];

  return (
    <DicodingLessonReader
      courseSlug={slug}
      lessonSlug={lessonSlug}
      lesson={l}
      courseModules={courseModules}
      movements={resolvedMovements}
      progressSlot={progressSlot}
    />
  );
}
