"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { MovementDocumentView } from "@/components/MovementDocumentView";
import { Notice } from "@/components/Notice";
import { clientRequest } from "@/lib/client-api";
import { LEVEL_LABEL, LICENSE_LABEL, SAFETY_HINT, SAFETY_LABEL } from "@/lib/format";
import { LANDMARK_GROUPS, POSE_LANDMARK_NAMES } from "@/lib/landmark-names";
import { describeError } from "@/lib/studio-api";
import type { HistoryEntry, Level, LicenseType, PublicDocument, SafetyCategory, StudioDocument, StudioMovement, StudioPhase } from "@/lib/types";
import { btnGhost, Checklist, Field, inputCls, Section, splitTags } from "./bits";
import { LessonLinks } from "./LessonLinks";
import { MediaPanel } from "./MediaPanel";
import { PhaseEditor } from "./PhaseEditor";
import { ReviewPanel } from "./ReviewPanel";

type F = {
  name_id: string; name_local: string; level: Level | ""; safety_category: SafetyCategory | ""; prerequisites: string; learning_context: string;
  description: string; terminology_notes: string; common_mistakes: string[]; safety_guidance: string; relevant_body_parts: string;
  relevant_landmarks: number[]; source_citation: string; source_url: string; author_declaration: boolean; rights_holder: string;
  license_type: LicenseType | ""; usage_scope: string; changelog: string;
};
const fromDoc = (d: StudioDocument): F => ({
  name_id: d.name_id, name_local: d.name_local ?? "", level: d.level ?? "", safety_category: d.safety_category ?? "", prerequisites: d.prerequisites ?? "",
  learning_context: d.learning_context ?? "", description: d.description ?? "", terminology_notes: d.terminology_notes ?? "", common_mistakes: d.common_mistakes,
  safety_guidance: d.safety_guidance ?? "", relevant_body_parts: d.relevant_body_parts.join(", "), relevant_landmarks: d.relevant_landmarks,
  source_citation: d.source_citation ?? "", source_url: d.source_url ?? "", author_declaration: d.author_declaration, rights_holder: d.rights_holder ?? "",
  license_type: d.license_type ?? "", usage_scope: d.usage_scope ?? "", changelog: d.changelog ?? "",
});
const toApi = (k: keyof F, f: F): unknown => {
  const v = f[k];
  if (k === "relevant_body_parts") return splitTags(String(v));
  if (k === "common_mistakes") return (v as string[]).map((x) => x.trim()).filter(Boolean);
  if (typeof v === "string") return v.trim() === "" && k !== "name_id" ? null : v.trim();
  return v;
};
type Save = { state: "idle" | "saving" | "saved" | "error"; at?: Date; msg?: string };

export function MovementWorkspace({ initial, initialHistory }: { initial: StudioMovement; initialHistory: HistoryEntry[] }) {
  const [mv, setMv] = useState(initial);
  const [history, setHistory] = useState(initialHistory);
  const doc = mv.active_document;
  const [f, setF] = useState<F | null>(doc ? fromDoc(doc) : null);
  const [phases, setPhases] = useState<StudioPhase[]>(doc?.phases ?? []);
  const [save, setSave] = useState<Save>({ state: "idle" });
  const [msg, setMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const dirty = useRef<Set<keyof F>>(new Set());
  const phasesDirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const docRef = useRef(doc);
  const fRef = useRef(f);
  const phRef = useRef(phases);
  useEffect(() => { docRef.current = doc; fRef.current = f; phRef.current = phases; });

  const editable = !!doc?.editable;
  const reset = useCallback((m: StudioMovement) => {
    const d = m.active_document;
    dirty.current.clear(); phasesDirty.current = false;
    setF(d ? fromDoc(d) : null); setPhases(d?.phases ?? []); setSave({ state: "idle" });
  }, []);
  const loadHistory = useCallback(async (id: string) => {
    const r = await clientRequest<HistoryEntry[]>("GET", `/studio/movements/${id}/history`);
    if (r.ok) setHistory(r.data);
  }, []);

  /** Simpan perubahan tertunda (autosave). Hanya untuk versi yang masih dapat diedit. */
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inflight.current) await inflight.current;
    const d = docRef.current, cur = fRef.current;
    if (!d || !cur || !d.editable) return true;
    if (dirty.current.size === 0 && !phasesDirty.current) return true;
    const keys = [...dirty.current], sendPhases = phasesDirty.current;
    dirty.current = new Set(); phasesDirty.current = false;
    setSave({ state: "saving" });
    const run = (async () => {
      let latest: StudioDocument | null = null;
      if (keys.length) {
        const body: Record<string, unknown> = {};
        for (const k of keys) body[k] = toApi(k, cur);
        const r = await clientRequest<StudioDocument>("PATCH", `/studio/documents/${d.id}`, body);
        if (!r.ok) { keys.forEach((k) => dirty.current.add(k)); setSave({ state: "error", msg: describeError(r) }); return false; }
        latest = r.data;
      }
      if (sendPhases) {
        const r = await clientRequest<StudioDocument>("PUT", `/studio/documents/${d.id}/phases`, { phases: phRef.current.map(({ name, instruction, body_focus, safety_note, start_ms, end_ms }) => ({ name, instruction, body_focus, safety_note, start_ms, end_ms })) });
        if (!r.ok) { phasesDirty.current = true; setSave({ state: "error", msg: describeError(r) }); return false; }
        latest = r.data;
      }
      if (latest) { const l = latest; setMv((m) => ({ ...m, active_document: m.active_document ? { ...m.active_document, completeness: l.completeness, complete: l.complete, updated_at: l.updated_at } : m.active_document })); }
      setSave({ state: "saved", at: new Date() });
      return true;
    })();
    inflight.current = run;
    const ok = await run;
    inflight.current = null;
    return ok;
  }, []);
  const schedule = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void flush(); }, 1200); }, [flush]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current.size || phasesDirty.current) { e.preventDefault(); } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const set = <K extends keyof F>(k: K, v: F[K]) => { setF((p) => (p ? { ...p, [k]: v } : p)); dirty.current.add(k); schedule(); };
  const setPh = (p: StudioPhase[]) => { setPhases(p); phasesDirty.current = true; schedule(); };

  async function newVersion() {
    setMsg(null);
    const r = await clientRequest<StudioMovement>("POST", `/studio/movements/${mv.id}/versions`);
    if (!r.ok) return setMsg({ kind: "error", text: describeError(r) });
    setMv(r.data); reset(r.data); void loadHistory(mv.id);
    setMsg({ kind: "success", text: `Versi ${r.data.active_document?.version_no} dibuat dari versi tayang. Versi tayang tetap utuh sampai versi baru disetujui dan diterbitkan.` });
  }
  const onTransition = (m: StudioMovement) => { setMv(m); reset(m); void loadHistory(m.id); };

  const previewDoc: PublicDocument | null = useMemo(() => {
    if (!doc || !f) return null;
    return {
      id: doc.id, version_no: doc.version_no, name_id: f.name_id, name_local: f.name_local || null, level: (f.level || null) as Level | null,
      safety_category: (f.safety_category || null) as SafetyCategory | null, prerequisites: f.prerequisites || null, learning_context: f.learning_context || null,
      description: f.description || null, terminology_notes: f.terminology_notes || null, common_mistakes: f.common_mistakes.filter(Boolean),
      safety_guidance: f.safety_guidance || null, relevant_body_parts: splitTags(f.relevant_body_parts), relevant_landmarks: f.relevant_landmarks,
      phases: phases.map((p, i) => ({ id: String(i), order_index: i, name: p.name || "(tanpa nama)", instruction: p.instruction, body_focus: p.body_focus, safety_note: p.safety_note, start_ms: p.start_ms, end_ms: p.end_ms })),
      media: [], rights_holder: f.rights_holder || null, license_type: (f.license_type || null) as LicenseType | null, usage_scope: f.usage_scope || null,
      changelog: f.changelog || null, published_at: null, authors: doc.author ? [doc.author] : [],
    };
  }, [doc, f, phases]);

  if (!doc || !f) return <p>Tidak ada versi dokumentasi.</p>;
  const dis = !editable;
  const solo = f.safety_category === "solo_beginner";
  const sections = [
    ["identitas", "Identitas"], ["deskripsi", "Deskripsi"], ["fase", "Fase"], ["tubuh", "Tubuh & kesalahan"], ["keselamatan", "Keselamatan"], ["sumber", "Sumber & hak"],
    ...(doc.version_no > 1 ? [["changelog", "Catatan perubahan"]] : []), ["media", "Media referensi"], ["pelajaran", "Pelajaran"], ["pratinjau", "Pratinjau"], ["review", "Review & versi"],
  ];
  const saveText = save.state === "saving" ? "Menyimpan…" : save.state === "saved" ? `Tersimpan ${save.at?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : save.state === "error" ? `Gagal menyimpan: ${save.msg}` : editable ? "Perubahan tersimpan otomatis" : "Terkunci";
  const done = doc.completeness.filter((c) => c.ok).length;

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-bronze-700">Movement Documentation Studio</p>
        <h1 className="font-serif text-3xl text-forest-900">{f.name_id || "(tanpa nama)"}{mv.is_demo && <span className="ml-3 align-middle text-sm font-normal text-slate-600">[DEMO]</span>}</h1>
        <p className="mt-2 text-sm text-slate-600">{mv.tradition_name} · {mv.partner_name} · versi {doc.version_no} ({doc.status_label.toLowerCase()}){mv.published_version_no ? ` · tayang: v${mv.published_version_no}` : " · belum tayang"}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[15.5rem_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-[5.25rem] lg:self-start" aria-label="Navigasi dokumentasi">
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <nav aria-label="Bagian dokumentasi"><ul className="space-y-0.5 text-sm">{sections.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-xl px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-parchment-100 hover:text-forest-900">{label}</a></li>))}</ul></nav>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
            <Checklist items={doc.completeness} label={`Kelengkapan (${done}/${doc.completeness.length})`} />
            <p aria-live="polite" className={`mt-3 text-xs ${save.state === "error" ? "text-clay-600" : "text-slate-500"}`}>{saveText}</p>
            <Link href={`/app/studio/movements/${mv.id}/calibration`} className="mt-3 inline-flex items-center text-xs font-medium text-forest-800 hover:text-bronze-700 hover:underline">Calibration Workspace →</Link>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {dis && (
            <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border border-line-200 bg-parchment-100 px-4 py-3 text-sm">
              <Lock aria-hidden className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">Versi {doc.version_no} berstatus <strong>{doc.status_label}</strong> dan tidak dapat diubah. Isi yang sudah diajukan atau terbit dibekukan agar jejak review tetap utuh.</span>
              {mv.can_create_version && <button onClick={newVersion} className={btnGhost}>Buat versi baru</button>}
            </div>)}
          <Notice kind={msg?.kind ?? null}>{msg?.text}</Notice>

          <Section id="identitas" title="Identitas gerakan" description="Semua isi ditulis oleh instruktur. SILATARA tidak menambahkan sejarah, filosofi, atau teknik.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name_id" label="Nama gerakan" required><input id="name_id" value={f.name_id} disabled={dis} maxLength={200} onChange={(e) => set("name_id", e.target.value)} className={inputCls} /></Field>
              <Field id="name_local" label="Nama lokal / istilah daerah"><input id="name_local" value={f.name_local} disabled={dis} maxLength={200} onChange={(e) => set("name_local", e.target.value)} className={inputCls} /></Field>
              <Field id="level" label="Tingkat" required><select id="level" value={f.level} disabled={dis} onChange={(e) => set("level", e.target.value as Level | "")} className={inputCls}><option value="">Pilih</option>{Object.entries(LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
              <div><p className="mb-1 text-sm font-medium">Tradisi · Perguruan sumber</p><p className="rounded-xl bg-parchment-100 px-3 py-2.5 text-sm">{mv.tradition_name} · {mv.partner_name}</p></div>
            </div>
            <fieldset disabled={dis}>
              <legend className="mb-2 text-sm font-medium">Kategori keselamatan <span aria-hidden className="text-clay-600">*</span></legend>
              <div className="grid gap-2 sm:grid-cols-2">{Object.entries(SAFETY_LABEL).map(([v, l]) => (
                <label key={v} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${f.safety_category === v ? "border-forest-700 bg-forest-700/5" : "border-line-200"}`}>
                  <input type="radio" name="safety_category" value={v} checked={f.safety_category === v} onChange={() => set("safety_category", v as SafetyCategory)} className="mt-1" />
                  <span><span className="block font-medium">{l}</span><span className="text-slate-600">{SAFETY_HINT[v]}</span></span></label>))}</div>
              <p className="mt-2 text-xs text-slate-600">Klasifikasi administratif untuk menentukan ruang lingkup penggunaan, bukan sertifikasi keselamatan. Hanya gerakan terbit berkategori solo pemula yang dapat membuka Practice Studio.</p>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="prerequisites" label={`Prasyarat${solo ? "" : " (opsional)"}`} required={solo}><textarea id="prerequisites" rows={3} value={f.prerequisites} disabled={dis} onChange={(e) => set("prerequisites", e.target.value)} className={inputCls} /></Field>
              <Field id="learning_context" label={`Konteks belajar${solo ? "" : " (opsional)"}`} required={solo} hint="Kapan dan dalam situasi apa gerakan ini dipelajari."><textarea id="learning_context" rows={3} value={f.learning_context} disabled={dis} onChange={(e) => set("learning_context", e.target.value)} className={inputCls} /></Field>
            </div>
          </Section>

          <Section id="deskripsi" title="Deskripsi">
            <Field id="description" label="Deskripsi gerakan (ditulis instruktur)" required><textarea id="description" rows={6} value={f.description} disabled={dis} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field>
            <Field id="terminology_notes" label="Catatan istilah dan variasi (opsional)" hint="Variasi nama/istilah antarperguruan yang ingin dicatat."><textarea id="terminology_notes" rows={3} value={f.terminology_notes} disabled={dis} onChange={(e) => set("terminology_notes", e.target.value)} className={inputCls} /></Field>
          </Section>

          <Section id="fase" title="Fase gerakan" description="Urutan fase, nama, dan instruksi sepenuhnya ditentukan instruktur. Minimal satu fase untuk diajukan.">
            <PhaseEditor phases={phases} onChange={setPh} disabled={dis} />
          </Section>

          <Section id="tubuh" title="Bagian tubuh dan kesalahan umum">
            <Field id="relevant_body_parts" label="Bagian tubuh relevan" hint="Pisahkan dengan koma."><input id="relevant_body_parts" value={f.relevant_body_parts} disabled={dis} onChange={(e) => set("relevant_body_parts", e.target.value)} className={inputCls} /></Field>
            <fieldset disabled={dis}>
              <legend className="mb-1 text-sm font-medium">Landmark MediaPipe relevan (opsional)</legend>
              <p className="mb-2 text-xs text-slate-600">Hanya penanda bagian tubuh yang menurut instruktur diperhatikan. Bukan ambang atau penilaian.</p>
              <div className="space-y-2">{LANDMARK_GROUPS.map((g) => (
                <div key={g.label}><p className="text-xs font-medium text-slate-600">{g.label}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">{g.ids.map((id) => (
                    <label key={id} className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.relevant_landmarks.includes(id)}
                      onChange={(e) => set("relevant_landmarks", (e.target.checked ? [...f.relevant_landmarks, id] : f.relevant_landmarks.filter((x) => x !== id)).sort((a, b) => a - b))} />{POSE_LANDMARK_NAMES[id]}</label>))}</div></div>))}</div>
            </fieldset>
            <div>
              <p className="mb-1 text-sm font-medium">Kesalahan umum (menurut instruktur)</p>
              <ul className="space-y-2">{f.common_mistakes.map((m, i) => (
                <li key={i} className="flex gap-2"><label className="sr-only" htmlFor={`cm-${i}`}>Kesalahan umum {i + 1}</label>
                  <input id={`cm-${i}`} value={m} disabled={dis} maxLength={1000} onChange={(e) => set("common_mistakes", f.common_mistakes.map((x, k) => (k === i ? e.target.value : x)))} className={inputCls} />
                  {!dis && <button type="button" aria-label={`Hapus kesalahan ${i + 1}`} onClick={() => set("common_mistakes", f.common_mistakes.filter((_, k) => k !== i))} className="px-2 text-clay-600">×</button>}</li>))}</ul>
              {!dis && <button type="button" onClick={() => set("common_mistakes", [...f.common_mistakes, ""])} className={`${btnGhost} mt-2`}>+ Tambah kesalahan umum</button>}
            </div>
          </Section>

          <Section id="keselamatan" title="Arahan keselamatan">
            <Field id="safety_guidance" label="Arahan keselamatan (ditulis instruktur)" required><textarea id="safety_guidance" rows={4} value={f.safety_guidance} disabled={dis} onChange={(e) => set("safety_guidance", e.target.value)} className={inputCls} /></Field>
          </Section>

          <Section id="sumber" title="Sumber, provenance, dan hak penggunaan" description="Wajib sebelum diajukan. Tanpa deklarasi dan sumber, dokumentasi tidak dapat direview.">
            <Field id="source_citation" label="Sumber / atribusi" required hint="Mis. perguruan, guru, tahun, atau dokumen sumber."><textarea id="source_citation" rows={2} value={f.source_citation} disabled={dis} onChange={(e) => set("source_citation", e.target.value)} className={inputCls} /></Field>
            <Field id="source_url" label="Tautan sumber (opsional)"><input id="source_url" type="url" value={f.source_url} disabled={dis} onChange={(e) => set("source_url", e.target.value)} className={inputCls} placeholder="https://" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="rights_holder" label="Pemegang hak" required><input id="rights_holder" value={f.rights_holder} disabled={dis} maxLength={300} onChange={(e) => set("rights_holder", e.target.value)} className={inputCls} /></Field>
              <Field id="license_type" label="Jenis izin" required><select id="license_type" value={f.license_type} disabled={dis} onChange={(e) => set("license_type", e.target.value as LicenseType | "")} className={inputCls}><option value="">Pilih</option>{Object.entries(LICENSE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            </div>
            <Field id="usage_scope" label="Ruang lingkup penggunaan yang diizinkan" required><textarea id="usage_scope" rows={2} value={f.usage_scope} disabled={dis} onChange={(e) => set("usage_scope", e.target.value)} className={inputCls} /></Field>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={f.author_declaration} disabled={dis} onChange={(e) => set("author_declaration", e.target.checked)} className="mt-1" />
              <span>Saya menyatakan isi dokumentasi ini ditulis oleh instruktur/mitra sendiri (bukan teks buatan AI atau salinan pihak lain tanpa izin), dan saya berhak menyerahkannya sesuai lingkup di atas.</span></label>
          </Section>

          {doc.version_no > 1 && (
            <Section id="changelog" title="Catatan perubahan" description="Wajib untuk versi lanjutan. Ditampilkan publik pada riwayat versi.">
              <Field id="changelog" label="Apa yang berubah dari versi sebelumnya?" required><textarea id="changelog" rows={3} value={f.changelog} disabled={dis} onChange={(e) => set("changelog", e.target.value)} className={inputCls} /></Field>
            </Section>)}

          <Section id="media" title="Media referensi">
            <MediaPanel movementId={mv.id} canUpload onCount={(n) => setMv((m) => (m.media_count === n ? m : { ...m, media_count: n }))} />
          </Section>

          <Section id="pelajaran" title="Pelajaran terkait" description="Tautkan gerakan ke pelajaran di Jalur Belajar. Pelajar melihat gerakan terbit beserta instruktur, sumber, dan status verifikasinya.">
            <LessonLinks movementId={mv.id} linked={mv.lessons} canEdit onChange={(m) => setMv((p) => ({ ...p, lessons: m.lessons }))} />
          </Section>

          <Section id="pratinjau" title="Pratinjau" description="Tampilan seperti yang akan dilihat pelajar setelah terbit (media belum disertakan).">
            <button type="button" onClick={async () => { await flush(); setPreview((p) => !p); }} aria-expanded={preview} className={btnGhost}>{preview ? "Sembunyikan pratinjau" : "Tampilkan pratinjau"}</button>
            {preview && previewDoc && <div className="rounded-xl border border-line-200 bg-parchment-100/40 p-5"><h3 className="mb-4 font-serif text-2xl text-forest-900">{previewDoc.name_id}</h3><MovementDocumentView doc={previewDoc} preview /></div>}
          </Section>

          <Section id="review" title="Review dan versi" description="Penulis mengajukan; kurator meninjau kelengkapan dan asal-usul; penanggung jawab mitra mengonfirmasi; admin memutuskan penerbitan. Tidak ada yang dapat menyetujui tulisannya sendiri.">
            <ReviewPanel mv={mv} history={history} onChange={onTransition} beforeAction={flush} />
          </Section>
        </div>
      </div>
    </div>
  );
}
