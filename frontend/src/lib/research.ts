/** Tipe & label untuk bagian publik "Riset" (API /api/v1/research/*). Semua konten berlabel draf riset. */

export type Basis = "source" | "editorial" | "needs_validation" | "gap" | "source+editorial" | "editorial_unvalidated" | null;

export type AnimationRef = {
  status: "generated" | "needs_reference";
  animation_id: string;
  url: string | null;
  thumbnail_url: string | null;
  needs: string | null;
};

export type ResearchSummary = {
  disclaimer: string;
  as_of: string;
  sources: { total: number; by_read_status: Record<string, number> };
  entities: { total: number; by_category: Record<string, number>; by_verification: Record<string, number> };
  provinces: { total: number; by_status: Record<string, number> };
  movements: { total: number; animated: number; by_safety: Record<string, number>; by_content_status: Record<string, number> };
  courses: number;
  lessons: number;
  global_gaps: string[];
  instructor_validated: number;
};

export type MovementItem = {
  slug: string; id: string; name: string; aliases: string[]; category: string; category_label: string; level: string;
  safety_class: string; solo_form_status: string; content_status: string; phases: number; sources: string[]; animation: AnimationRef;
  tradition_slug: string; tradition_name: string; summary: string;
};

export type Phase = {
  id: string; order: number; name: string; start_position: string; change: string; body_parts: string[]; direction: string;
  end_position: string; mistakes: string[]; safety: string | null; tempo: string | null; basis: Basis; source_ids?: string[]; locator?: string;
};

export type TextNode = { text: string; basis: Basis; locator?: string | null; sources: string[] };
export type Reference = { source_id: string; locator: string; supports?: string; citation: string; url?: string | null };

export type MovementDetail = {
  disclaimer: string; id: string; slug: string; names: { primary: string; local: string | null; aliases: string[] };
  category: string; category_label: string; level: string; safety_class: string; solo_form_status: string; content_status: string;
  tradition_slug: string; evidence_tier: string; instructor_validation: string; permission_status: string; tradition: string;
  cultural: { context: TextNode; purpose: TextNode; meaning: TextNode; terminology: { term: string; explanation: string }[];
    variants: TextNode[]; differs_from: { movement_id: string; text: string }[] };
  prerequisites: Record<"abilities" | "physical_prep" | "space" | "surface" | "equipment" | "limits", string>;
  anatomy: { key: string; label: string; text: string; basis: Basis; sources: string[] }[];
  phases: Phase[];
  practice: { start: string; sequence: string; tempo: { text: string; basis: Basis }; repetitions: { text: string; basis: Basis };
    easier: string; progression: string; cooldown: string; stop_when: string[]; stop_basis: string };
  common_mistakes: (string | { text: string })[]; common_mistakes_gap: string | null;
  references: Reference[]; gaps: string[];
  animation: AnimationRef & { notes_markdown: string | null };
  used_in: { course_slug: string; course_title: string; lesson_slug: string; lesson_title: string }[];
};

export type Curricula = {
  disclaimer: string;
  items: { id: string; slug: string; title: string; summary: string; level: string; estimated_minutes: number; safety_notes: string;
    tradition: string; editorial_note?: string;
    modules: { id: string; order: number; title: string; summary: string; lessons: { slug: string; title: string; description: string; duration_min: number; order: number }[] }[] }[];
};

export type LessonDetail = {
  disclaimer: string; course: { slug: string; title: string }; module: string; slug: string; title: string; description: string;
  objectives: string[]; prior_competence: string; duration_min: number; equipment: string; space: string; safety_briefing: string;
  theory: string; cultural_explanation: string; practice_steps: string[]; summary: string; reflection: string[];
  quiz: { q: string; options: string[]; answer_index: number; source_id: string }[];
  references: Reference[];
  movements: { slug: string; name: string; safety_class: string; phases: Phase[]; common_mistakes: (string | { text: string })[];
    common_mistakes_gap: string | null; animation: AnimationRef }[];
  prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null;
};

export type Coverage = {
  as_of: string; legend: Record<string, string>; global_gaps: string[];
  provinces: { name: string; status: string; gap: string; entities: { id: string; name: string; category: string }[] }[];
};

export type Entity = {
  id: string; name: string; aliases?: string[]; category: string; provinces: string[]; localities?: string[]; verification: string;
  notes?: string; founder?: { name: string }; wbtb?: Record<string, string>; sources: { id: string; citation: string }[];
};

export type Source = {
  id: string; type: string; title: string; author_or_publisher: string; venue?: string; year: number | null; url?: string;
  doi?: string; isbn?: string; read_status: string; license?: string; supports?: string[]; note?: string;
};

export type Inventory = { purpose: string; groups: { label: string; tradition: string; items: { name: string; safety?: string; doc_ref?: string | null; gap?: string; note?: string }[] }[] };

export const SAFETY_CLASS_LABEL: Record<string, string> = {
  solo_beginner: "Solo · pemula", solo_intermediate: "Solo · menengah", solo_advanced: "Solo · lanjut",
  supervised_only: "Dengan pengawasan", partner_required: "Butuh pasangan", restricted: "Tidak diuraikan", needs_reference: "Nama jurus",
};
export const LEVEL_ID: Record<string, string> = { beginner: "Pemula", intermediate: "Menengah", advanced: "Lanjut" };
/** Label asal informasi, ditulis untuk pembaca, bukan untuk alur kerja internal. */
export const BASIS_LABEL: Record<string, string> = {
  source: "Menurut sumber", "source+editorial": "Sumber & catatan redaksi", editorial: "Catatan redaksi",
  editorial_unvalidated: "Saran redaksi", needs_validation: "Tanyakan pelatih", gap: "Tidak dibahas sumber",
};
export const COVERAGE_LABEL: Record<string, string> = {
  sources_adequate: "Terdokumentasi baik", sources_limited: "Catatan awal", no_documentation_found: "Masih ditelusuri",
};
export const CATEGORY_ENTITY_LABEL: Record<string, string> = {
  tradition: "Tradisi", style: "Aliran", perguruan: "Perguruan", training_place: "Tempat latihan", organization: "Organisasi",
  community: "Komunitas", regional_term: "Sebutan lokal",
};
export const READ_STATUS_LABEL: Record<string, string> = {
  full_text: "Rujukan utama", page: "Laman resmi", search_snippet: "Rujukan pendukung", unreachable: "Tidak dikutip",
};

export type TraditionItem = {
  slug: string; name: string; local_name: string | null; region: string | null; public_summary: string; provinces: string[];
  movement_count: number; animated_count: number; course_count: number; related_entity_count: number;
};
export type EntityBrief = { id: string; name: string; category: string; provinces: string[]; localities?: string[]; notes?: string };
export type CourseBrief = { slug: string; title: string; summary: string; level: string; estimated_minutes: number; lesson_count: number; module_count: number };
export type TraditionDetail = Omit<TraditionItem, "movement_count" | "animated_count" | "course_count" | "related_entity_count"> & {
  movements: MovementItem[]; courses: CourseBrief[]; related_entities: EntityBrief[]; references: Reference[];
};
export type CourseDetailK = CourseBrief & {
  safety_notes: string; goals: string[]; tradition: { slug: string; name: string };
  modules: { order: number; title: string; summary: string; lessons: { slug: string; title: string; description: string; duration_min: number; order: number }[] }[];
  movements: { slug: string; name: string; safety_class: string; animation: AnimationRef }[];
  references: Reference[];
};

/** Kategori entitas yang ditampilkan di halaman Perguruan (lembaga) vs Warisan (tradisi/aliran/sebutan). */
export const INSTITUTION_CATEGORIES = ["perguruan", "training_place", "organization", "community"];
export const HERITAGE_CATEGORIES = ["tradition", "style", "regional_term"];
