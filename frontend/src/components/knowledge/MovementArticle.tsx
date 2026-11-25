import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Camera,
  ChevronRight,
  Compass,
  ExternalLink,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import {
  cleanMovementText,
  isSupervisedSafety,
  MovementVisual,
  Pill,
  SafetyPill,
} from "@/components/knowledge/Bits";
import { MovementStage } from "@/components/knowledge/MovementStage";
import type { ClipMeta } from "@/lib/character";
import type { MovementDetail } from "@/lib/research";
import { LEVEL_ID } from "@/lib/research";

function getSupervisionAlert(m: MovementDetail): string | null {
  if (m.solo_form_status === "partner_form" || m.safety_class === "partner_required") {
    return "Latih berpasangan bersama pelatih.";
  }
  if (m.solo_form_status === "inferred_not_documented" || isSupervisedSafety(m.safety_class)) {
    return "Latih bersama pelatih.";
  }
  return null;
}

function isMeaningfulValue(val: string | null | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "\u2014" || trimmed === "-") return false;
  if (/^(tidak ada|tidak disusun|belum disusun)/i.test(trimmed)) return false;
  return true;
}

function SectionHeading({
  id,
  eyebrow,
  title,
  badge,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  badge?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-[#e7d7c8]/80 pb-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[#9a3412]">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="scroll-mt-8 font-serif text-2xl text-[#2e0909]">
          {title}
        </h2>
      </div>
      {badge && (
        <span className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3 py-1 text-xs font-semibold text-[#9a3412]">
          {badge}
        </span>
      )}
    </div>
  );
}

/** Artikel gerakan untuk Pustaka Gerakan: peraga 3D/2D terpusat di atas, instruksi fase praktis di bawah. */
export function MovementArticle({
  m,
  clip = null,
  practice = false,
}: {
  m: MovementDetail;
  clip?: ClipMeta | null;
  practice?: boolean;
}) {
  const supervisionAlert = getSupervisionAlert(m);
  const mistakes = m.common_mistakes
    .map((x) => cleanMovementText(typeof x === "string" ? x : x.text))
    .filter(Boolean);

  const anatomy = m.anatomy
    .filter(
      (a) =>
        a.basis !== "needs_validation" &&
        a.basis !== "gap" &&
        !/^tidak dirinci/i.test(a.text.trim()),
    )
    .map((a) => ({ ...a, cleaned: cleanMovementText(a.text) }))
    .filter((a) => Boolean(a.cleaned));

  const practiceFields: { label: string; value: string; wide?: boolean }[] = [];
  const hasSoloSequence = isMeaningfulValue(m.practice.sequence);

  if (hasSoloSequence) {
    const start = cleanMovementText(m.practice.start);
    const seq = cleanMovementText(m.practice.sequence);
    const tempo = cleanMovementText(m.practice.tempo.text);
    const reps = cleanMovementText(m.practice.repetitions.text);
    const prep = cleanMovementText(m.prerequisites.physical_prep);
    const space = cleanMovementText(`${m.prerequisites.space} ${m.prerequisites.surface}`);
    const easier = cleanMovementText(m.practice.easier);
    const prog = cleanMovementText(m.practice.progression);

    if (isMeaningfulValue(start)) practiceFields.push({ label: "Posisi awal", value: start });
    if (isMeaningfulValue(prep)) practiceFields.push({ label: "Persiapan", value: prep });
    if (isMeaningfulValue(seq)) practiceFields.push({ label: "Urutan latihan", value: seq, wide: true });
    if (isMeaningfulValue(tempo)) practiceFields.push({ label: "Tempo", value: tempo });
    if (isMeaningfulValue(reps)) practiceFields.push({ label: "Pengulangan", value: reps });
    if (isMeaningfulValue(space)) practiceFields.push({ label: "Ruang & lantai", value: space, wide: true });
    if (isMeaningfulValue(easier)) practiceFields.push({ label: "Versi lebih mudah", value: easier });
    if (isMeaningfulValue(prog)) practiceFields.push({ label: "Langkah berikutnya", value: prog });
  }

  const stopWhenText = cleanMovementText(m.practice.stop_when.join(" "));

  return (
    <article aria-label={m.names.primary} className="mx-auto max-w-4xl">
      {/* Compact Breadcrumb */}
      <nav
        aria-label="Jejak halaman"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-600"
      >
        <Link className="transition-colors hover:text-[#6d1b11] hover:underline" href="/library">
          Pustaka Gerakan
        </Link>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
        <Link
          className="transition-colors hover:text-[#6d1b11] hover:underline"
          href={`/library?kategori=${encodeURIComponent(m.category)}`}
        >
          {m.category_label}
        </Link>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-medium text-slate-900">{m.names.primary}</span>
      </nav>

      {/* Centered Practical Header */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9a3412]">
          {m.category_label}
        </p>
        <h1 className="mt-2 font-serif text-3xl leading-tight text-[#2e0909] sm:text-4xl lg:text-[2.5rem]">
          {m.names.primary}
        </h1>
        {m.names.aliases.length > 0 && (
          <p className="mt-1.5 text-sm text-slate-500">
            Dikenal juga sebagai {m.names.aliases.join(", ")}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {isSupervisedSafety(m.safety_class) && <SafetyPill cls={m.safety_class} />}
          <Pill>{LEVEL_ID[m.level] ?? m.level}</Pill>
          <Pill>{m.phases.length} fase</Pill>
          <Pill>
            <Link href={`/heritage/${m.tradition_slug}`} className="hover:underline">
              {m.tradition}
            </Link>
          </Pill>
        </div>

        {supervisionAlert && (
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#fed7aa] bg-[#fff6ee] px-3.5 py-1 text-xs font-semibold text-[#9a3412]">
            <AlertTriangle aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span>{supervisionAlert}</span>
          </p>
        )}

        {practice && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/library/${m.slug}/latihan`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <Camera aria-hidden className="h-4 w-4" />
              Coba Latihan Sekarang
            </Link>
          </div>
        )}
      </header>

      {/* Center Stage Hero Media (Peraga 3D / Ilustrasi 2D) */}
      <section aria-label={`Peraga gerak ${m.names.primary}`} className="mx-auto mt-8 w-full max-w-4xl">
        <MovementStage
          clip={clip}
          title={m.names.primary}
          variant="hero"
          twoD={<MovementVisual a={m.animation} title={m.names.primary} variant="hero" />}
        />
      </section>

      {/* Practical Step-by-Step Instructions Below */}
      <div className="mx-auto mt-10 max-w-4xl space-y-10">
        {/* 1. Langkah demi langkah */}
        <section aria-labelledby="langkah">
          <SectionHeading
            id="langkah"
            eyebrow="Urutan Gerak"
            title="Langkah demi langkah"
            badge={`${m.phases.length} fase`}
          />
          <ol className="grid gap-4">
            {m.phases.map((p) => {
              const startPos = cleanMovementText(p.start_position);
              const endPos = cleanMovementText(p.end_position);
              const changeText = cleanMovementText(p.change);
              const safetyText = cleanMovementText(p.safety);

              return (
                <li
                  key={p.id}
                  className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs sm:p-6"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4a120b] to-[#8f2317] text-sm font-bold text-white shadow-2xs">
                      {p.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-[#2e0909]">{p.name}</h3>

                      <dl className="mt-3.5 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl bg-[#faf7f4] p-3.5">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Mulai dari
                          </dt>
                          <dd className="mt-1 leading-relaxed text-slate-800">{startPos}</dd>
                        </div>

                        <div className="rounded-2xl bg-[#faf7f4] p-3.5">
                          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Hasil akhir
                          </dt>
                          <dd className="mt-1 leading-relaxed text-slate-800">{endPos}</dd>
                        </div>

                        {isMeaningfulValue(changeText) && (
                          <div className="rounded-2xl bg-[#faf7f4] p-3.5 sm:col-span-2">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Gerakan
                            </dt>
                            <dd className="mt-1 leading-relaxed text-slate-800">{changeText}</dd>
                          </div>
                        )}

                        {p.body_parts.length > 0 && (
                          <div className="rounded-2xl border border-[#ece2d8] bg-white p-3.5">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Bagian tubuh
                            </dt>
                            <dd className="mt-1.5 flex flex-wrap gap-1.5">
                              {p.body_parts.map((part) => (
                                <span
                                  key={part}
                                  className="rounded-full border border-[#fed7aa] bg-[#fff6ee] px-2.5 py-0.5 text-xs font-medium text-[#9a3412]"
                                >
                                  {part}
                                </span>
                              ))}
                            </dd>
                          </div>
                        )}

                        {isMeaningfulValue(p.direction) && (
                          <div className="rounded-2xl border border-[#ece2d8] bg-white p-3.5">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Arah
                            </dt>
                            <dd className="mt-1 leading-relaxed text-slate-800">{p.direction}</dd>
                          </div>
                        )}
                      </dl>

                      {isMeaningfulValue(safetyText) && (
                        <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-[#fed7aa] bg-[#fff6ee] px-4 py-3 text-sm text-[#2e0909]">
                          <AlertTriangle
                            aria-hidden
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#9a3412]"
                          />
                          <p>
                            <strong className="font-semibold">Perhatikan:</strong> {safetyText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* 2. Posisi tubuh */}
        {anatomy.length > 0 && (
          <section aria-labelledby="anatomi">
            <SectionHeading id="anatomi" eyebrow="Postur & Fokus" title="Posisi tubuh" />
            <dl className="grid gap-3.5 sm:grid-cols-2">
              {anatomy.map((a) => (
                <div
                  key={a.key}
                  className="rounded-[20px] border border-[#e7d7c8] bg-white p-4 shadow-2xs"
                >
                  <dt className="text-xs font-bold uppercase tracking-wider text-[#9a3412]">
                    {a.label}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">{a.cleaned}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* 3. Panduan latihan & Keselamatan */}
        {(practiceFields.length > 0 || isMeaningfulValue(stopWhenText) || mistakes.length > 0) && (
          <section aria-labelledby="latihan">
            <SectionHeading
              id="latihan"
              eyebrow="Keselamatan & Praktik"
              title="Panduan latihan"
            />
            <div className="space-y-4">
              {(practiceFields.length > 0 || isMeaningfulValue(stopWhenText)) && (
                <div className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs sm:p-6">
                  {practiceFields.length > 0 && (
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      {practiceFields.map((field) => (
                        <div key={field.label} className={field.wide ? "sm:col-span-2" : undefined}>
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {field.label}
                          </dt>
                          <dd className="mt-1 leading-relaxed text-slate-800">{field.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {isMeaningfulValue(stopWhenText) && (
                    <div
                      className={`${practiceFields.length > 0 ? "mt-5" : ""} flex items-start gap-3 rounded-2xl border border-[#fed7aa] bg-[#fff6ee] p-4 text-sm text-[#2e0909]`}
                    >
                      <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#9a3412]" />
                      <div className="space-y-0.5">
                        <p className="font-semibold">Berhenti bila</p>
                        <p className="leading-relaxed text-slate-700">{stopWhenText}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mistakes.length > 0 && (
                <div
                  aria-labelledby="perhatian"
                  className="rounded-[24px] border border-[#e7d7c8] bg-white p-5 shadow-xs sm:p-6"
                >
                  <h3 id="perhatian" className="font-serif text-xl text-[#2e0909]">
                    Hal yang perlu diperhatikan
                  </h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
                    {mistakes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 4. Latihan Kamera & Dipelajari di Akademi */}
        {(practice || m.used_in.length > 0) && (
          <section aria-label="Lanjutkan belajar" className="grid gap-4 md:grid-cols-2">
            {practice && (
              <div className="flex flex-col justify-between rounded-[24px] border border-[#fed7aa] bg-[#fff6ee] p-6">
                <div>
                  <p className="flex items-center gap-2 font-serif text-lg text-[#2e0909]">
                    <Camera aria-hidden className="h-5 w-5 text-[#9a3412]" />
                    Coba latihan dengan kamera
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    Ukur kesesuaian postur di perangkat Anda sendiri tanpa mengunggah video.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/library/${m.slug}/latihan`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4a0d0d] via-[#7c1d1d] to-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    <Camera aria-hidden className="h-4 w-4" />
                    Coba Latihan Sekarang
                  </Link>
                </div>
              </div>
            )}

            {m.used_in.length > 0 && (
              <div className="flex flex-col justify-between rounded-[24px] border border-[#e7d7c8] bg-white p-6 shadow-xs">
                <div>
                  <p className="flex items-center gap-2 font-serif text-lg text-[#2e0909]">
                    <GraduationCap aria-hidden className="h-5 w-5 text-[#9a3412]" />
                    Dipelajari di Akademi
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {m.used_in.map((u) => (
                      <li key={u.lesson_slug}>
                        <Link
                          className="inline-flex items-center gap-1.5 font-medium text-[#6d1b11] hover:underline"
                          href={`/academy/courses/${u.course_slug}/lessons/${u.lesson_slug}`}
                        >
                          <Compass aria-hidden className="h-3.5 w-3.5 shrink-0 text-[#9a3412]" />
                          {u.lesson_title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {/* 5. Rujukan Sumber Ringkas */}
        {m.references.length > 0 && (
          <footer
            aria-labelledby="rujukan"
            className="rounded-[24px] border border-[#e7d7c8] bg-[#faf7f4] p-5 text-sm text-slate-600 sm:p-6"
          >
            <h2 id="rujukan" className="flex items-center gap-2 font-serif text-base text-[#2e0909]">
              <BookOpen aria-hidden className="h-4 w-4 text-[#9a3412]" />
              Rujukan sumber
            </h2>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-slate-600">
              {m.references.map((ref, idx) => (
                <li key={`${ref.source_id}-${ref.locator}-${idx}`}>
                  <span>{ref.citation}</span>
                  {ref.locator && <span className="text-slate-500"> ({ref.locator})</span>}
                  {ref.url && (
                    <>
                      {" "}
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-0.5 font-medium text-[#6d1b11] underline"
                      >
                        tautan
                        <ExternalLink aria-hidden className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    </article>
  );
}
