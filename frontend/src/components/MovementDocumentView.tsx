import { AlertTriangle } from "lucide-react";
import { cleanMovementText } from "@/components/knowledge/Bits";
import { LEVEL_LABEL, LICENSE_LABEL, SAFETY_LABEL, formatClock, paragraphs } from "@/lib/format";
import { RefImage } from "@/components/studio/bits";
import type { PublicDocument, SafetyCategory } from "@/lib/types";

const SUPERVISED_PRECAUTION: Partial<Record<SafetyCategory, string>> = {
  supervised_practice: "Latih bersama instruktur.",
  contact_practice: "Melibatkan pasangan atau kontak, tidak untuk latihan mandiri.",
  weapon_related: "Terkait alat atau senjata, latih bersama instruktur.",
  restricted: "Materi terbatas perguruan, tidak untuk latihan mandiri.",
};

function Block({ title, text }: { title: string; text: string | null | undefined }) {
  const ps = paragraphs(text)
    .map((p) => cleanMovementText(p))
    .filter((p) => Boolean(p) && !/^tidak ada\.?$/i.test(p));
  if (!ps.length) return null;
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-serif text-lg text-[#2e0909]">{title}</h3>
      {ps.map((p, i) => (
        <p key={i} className="mb-2 max-w-prose text-slate-700">
          {p}
        </p>
      ))}
    </section>
  );
}

/** Tampilan dokumentasi gerakan (publik/pratinjau). Semua isi = teks polos yang ditulis instruktur; tidak ada HTML dirender. */
export function MovementDocumentView({
  doc,
  preview = false,
  layout = "default",
}: {
  doc: PublicDocument;
  preview?: boolean;
  layout?: "default" | "centered";
}) {
  const precaution = doc.safety_category ? SUPERVISED_PRECAUTION[doc.safety_category] : undefined;

  const mediaSection =
    doc.media.length > 0 ? (
      <section className={layout === "centered" ? "mx-auto mb-8 w-full max-w-4xl" : "mb-6"}>
        <h3 className={layout === "centered" ? "sr-only" : "mb-3 font-serif text-lg text-[#2e0909]"}>
          Media referensi
        </h3>
        <ul className="space-y-4">
          {doc.media.map((m) => (
            <li
              key={m.id}
              className={
                layout === "centered"
                  ? "overflow-hidden rounded-[24px] border border-[#e7d7c8] bg-white p-4 shadow-sm sm:p-5"
                  : "rounded-xl border border-line-200 bg-paper-50 p-4"
              }
            >
              {m.kind === "video" ? (
                <video
                  controls
                  preload="metadata"
                  src={m.url}
                  className={
                    layout === "centered"
                      ? "mx-auto mb-3 max-h-[32rem] w-full rounded-[18px] bg-ink-950"
                      : "mb-2 max-h-[28rem] w-full rounded-lg bg-ink-950"
                  }
                  aria-label={m.title}
                />
              ) : (
                <RefImage
                  src={m.url}
                  alt={m.title}
                  className={
                    layout === "centered"
                      ? "mx-auto mb-3 max-h-[32rem] rounded-[18px]"
                      : "mb-2 max-h-[28rem] rounded-lg"
                  }
                />
              )}
              <p className="font-medium text-[#2e0909]">
                {m.is_demo ? "[DEMO] " : ""}
                {m.title}
              </p>
              <p className="text-xs text-slate-600">
                Pemegang hak: {m.rights_holder} · Sumber: {m.source_description} · Lingkup izin:{" "}
                {m.usage_scope}
              </p>
            </li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <article aria-label={`Dokumentasi ${doc.name_id}`}>
      {layout === "centered" && mediaSection}

      <dl
        className={`mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 ${
          layout === "centered"
            ? "justify-center rounded-2xl border border-[#e7d7c8] bg-white px-4 py-3"
            : ""
        }`}
      >
        {doc.level && (
          <div>
            <dt className="inline font-medium text-ink-950">Tingkat: </dt>
            <dd className="inline">{LEVEL_LABEL[doc.level]}</dd>
          </div>
        )}
        {doc.safety_category && doc.safety_category !== "solo_beginner" && (
          <div>
            <dt className="inline font-medium text-ink-950">Kategori: </dt>
            <dd className="inline">{SAFETY_LABEL[doc.safety_category]}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium text-ink-950">Versi: </dt>
          <dd className="inline">
            {doc.version_no}
            {preview ? " (pratinjau)" : ""}
          </dd>
        </div>
        {doc.authors.length > 0 && (
          <div>
            <dt className="inline font-medium text-ink-950">Disusun oleh: </dt>
            <dd className="inline">{doc.authors.join(", ")}</dd>
          </div>
        )}
      </dl>

      {precaution && (
        <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[#fed7aa] bg-[#fff6ee] px-4 py-3 text-sm text-[#2e0909]">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#9a3412]" />
          <p className="font-medium">{precaution}</p>
        </div>
      )}

      {doc.phases.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-3 font-serif text-xl text-[#2e0909]">Langkah demi langkah</h3>
          <ol className="space-y-3">
            {doc.phases.map((p, i) => (
              <li
                key={p.id ?? i}
                className={
                  layout === "centered"
                    ? "rounded-[20px] border border-[#e7d7c8] bg-white p-5 shadow-2xs"
                    : "rounded-xl border border-line-200 bg-paper-50 p-4"
                }
              >
                <p className="font-semibold text-[#2e0909]">
                  <span className="mr-2 text-[#9a3412]">{i + 1}.</span>
                  {p.name}
                </p>
                {paragraphs(p.instruction).map((t, j) => (
                  <p key={j} className="mt-1 max-w-prose text-slate-700">
                    {cleanMovementText(t)}
                  </p>
                ))}
                {p.body_focus.length > 0 && (
                  <p className="mt-2 text-sm text-slate-600">
                    Fokus tubuh: {p.body_focus.join(", ")}
                  </p>
                )}
                {p.safety_note && (
                  <p className="mt-1 text-sm text-[#9a3412]">
                    <strong>Perhatikan:</strong> {cleanMovementText(p.safety_note)}
                  </p>
                )}
                {(p.start_ms !== null || p.end_ms !== null) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Penanda waktu referensi:{" "}
                    {p.start_ms !== null ? formatClock(p.start_ms) : "-"} –{" "}
                    {p.end_ms !== null ? formatClock(p.end_ms) : "-"}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Block title="Deskripsi" text={doc.description} />
      <Block title="Prasyarat" text={doc.prerequisites} />

      {doc.common_mistakes.length > 0 && (
        <section className="mb-6">
          <h3 className="mb-2 font-serif text-lg text-[#2e0909]">Hal yang perlu diperhatikan</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-700">
            {doc.common_mistakes.map((m, i) => (
              <li key={i}>{cleanMovementText(m)}</li>
            ))}
          </ul>
        </section>
      )}

      <Block title="Arahan keselamatan" text={doc.safety_guidance} />

      {doc.relevant_body_parts.length > 0 && (
        <p className="mb-6 text-sm text-slate-600">
          <strong className="text-ink-950">Bagian tubuh relevan:</strong>{" "}
          {doc.relevant_body_parts.join(", ")}
        </p>
      )}

      {layout === "default" && mediaSection}

      <footer className="mt-8 border-t border-line-200 pt-4 text-xs text-slate-600">
        {doc.rights_holder && (
          <p>
            Hak dokumentasi: {doc.rights_holder}
            {doc.license_type ? ` (${LICENSE_LABEL[doc.license_type]})` : ""}
            {doc.usage_scope ? `: ${doc.usage_scope}` : ""}
          </p>
        )}
        {doc.changelog && <p className="mt-1">Catatan perubahan versi ini: {doc.changelog}</p>}
      </footer>
    </article>
  );
}
