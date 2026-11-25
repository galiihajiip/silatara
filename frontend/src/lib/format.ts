import type { ContentStatus } from "@/lib/types";

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "Pemula", intermediate: "Menengah", advanced: "Lanjut",
};
export const PARTNER_TYPE_LABEL: Record<string, string> = {
  school: "Perguruan", community: "Komunitas", institution: "Institusi", individual_master: "Maestro perorangan",
};
export const PRACTICE_MODE_LABEL: Record<string, string> = {
  solo_beginner: "Latihan mandiri pemula",
  supervised_only: "Hanya dengan pengawasan instruktur",
  not_for_practice: "Bukan untuk dipraktikkan mandiri",
};
export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draf", pending_review: "Menunggu review", needs_revision: "Perlu revisi", rejected: "Ditolak",
  verified: "Terverifikasi (belum terbit)", published: "Terbit", archived: "Diarsipkan",
};
export const ACTION_LABEL: Record<string, string> = {
  submit: "Ajukan review", approve: "Setujui", reject: "Tolak", publish: "Terbitkan",
  unpublish: "Tarik dari publik", archive: "Arsipkan", restore: "Pulihkan ke draf",
};
export const ROLE_LABEL: Record<string, string> = {
  learner: "Pelajar", instructor: "Instruktur", curator: "Kurator", admin: "Admin",
};
export const KIND_LABEL: Record<string, string> = {
  traditions: "Tradisi", partners: "Perguruan", instructors: "Instruktur",
  movements: "Gerakan", courses: "Kurikulum", lessons: "Pelajaran",
};

export function formatMinutes(min: number | null | undefined): string | null {
  if (!min) return null;
  if (min < 60) return `${min} menit`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

/** Pisahkan teks menjadi paragraf (teks polos; tidak ada HTML yang dirender). */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** 125000 ms -> "2 mnt 5 dtk"; di bawah semenit -> "45 dtk". */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60), sec = total % 60;
  return m ? `${m} mnt ${sec} dtk` : `${sec} dtk`;
}
export function formatClock(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
}
export const PRACTICE_STATUS_LABEL: Record<string, string> = {
  in_progress: "Berjalan", completed: "Selesai", abandoned: "Dihentikan sebelum selesai", error: "Berakhir karena masalah teknis",
};

export const SAFETY_LABEL: Record<string, string> = {
  solo_beginner: "Solo pemula", supervised_practice: "Latihan terawasi", contact_practice: "Latihan kontak",
  weapon_related: "Terkait senjata", restricted: "Terbatas",
};
export const SAFETY_HINT: Record<string, string> = {
  solo_beginner: "Dapat dilatih sendiri oleh pemula. Satu-satunya kategori yang dapat membuka Practice Studio.",
  supervised_practice: "Hanya dengan pengawasan instruktur.",
  contact_practice: "Melibatkan kontak/pasangan; tidak untuk latihan mandiri.",
  weapon_related: "Terkait senjata; tidak untuk latihan mandiri.",
  restricted: "Pengetahuan terbatas oleh mitra/komunitas; tidak untuk latihan mandiri.",
};
export const LICENSE_LABEL: Record<string, string> = {
  instructor_owned: "Milik instruktur", partner_permission: "Izin dari mitra", other_written_permission: "Izin tertulis pihak lain",
};
export const PARTNER_STATUS_LABEL: Record<string, string> = {
  draft: "Draf: belum diajukan", pending_verification: "Menunggu verifikasi admin", verified: "Terverifikasi",
  rejected: "Ditolak", suspended: "Ditangguhkan",
};
export const PARTNER_ACTION_LABEL: Record<string, string> = {
  submit: "Ajukan verifikasi", verify: "Verifikasi", reject: "Tolak", suspend: "Tangguhkan", reopen: "Buka kembali sebagai draf",
  reinstate: "Aktifkan kembali (ajukan ulang)", publish_listing: "Cantumkan di direktori publik", unlist: "Tarik dari direktori",
};
export const DOC_ACTION_LABEL: Record<string, string> = {
  submit: "Ajukan review", curator_review: "Tandai ditinjau (kurator)", confirm_partner: "Konfirmasi sebagai mitra",
  request_revision: "Minta revisi", reject: "Tolak", approve: "Setujui", publish: "Terbitkan", archive: "Arsipkan",
};
export const CONSENT_TONE: Record<string, string> = {
  declared: "bg-bronze-500/15 text-ink-950", verified: "bg-forest-700/10 text-forest-900",
  rejected: "border border-clay-600/40 bg-clay-600/10 text-ink-950", revoked: "border border-clay-600/40 bg-clay-600/10 text-ink-950",
};
export const ACTION_LOG_LABEL: Record<string, string> = {
  "movement.create": "Dokumentasi dibuat", "movement.document_update": "Isi diperbarui", "movement.phases_put": "Fase diperbarui",
  "movement.new_version": "Versi baru dibuat", "movement.submit": "Diajukan review", "movement.curator_review": "Ditinjau kurator",
  "movement.confirm_partner": "Dikonfirmasi mitra", "movement.request_revision": "Revisi diminta", "movement.reject": "Ditolak",
  "movement.approve": "Disetujui", "movement.publish": "Diterbitkan", "movement.archive": "Diarsipkan",
  "movement.lesson_link": "Ditautkan ke pelajaran", "movement.lesson_unlink": "Tautan pelajaran dilepas",
  "partner.create": "Profil mitra dibuat", "partner.update": "Profil mitra diubah", "partner.submit": "Verifikasi diajukan",
  "partner.verify": "Mitra diverifikasi", "partner.reject": "Verifikasi ditolak", "partner.suspend": "Mitra ditangguhkan",
  "partner.reopen": "Dibuka kembali", "partner.reinstate": "Diaktifkan kembali", "partner.publish_listing": "Dicantumkan di direktori",
  "partner.unlist": "Ditarik dari direktori", "partner.member_add": "Anggota ditambahkan", "partner.member_remove": "Anggota dikeluarkan",
  "partner.document_add": "Dokumen persetujuan diunggah", "media.upload": "Media diunggah", "media.update": "Media diperbarui",
  "media.delete": "Media dihapus", "annotation.create": "Anotasi dibuat", "annotation.update": "Anotasi diubah",
};
export function actionLabel(a: string): string { return ACTION_LOG_LABEL[a] ?? a; }
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export const PROGRAM_STATUS_LABEL: Record<string, string> = {
  draft: "Draf", pending_approval: "Menunggu persetujuan", approved: "Disetujui", active: "Berjalan", completed: "Selesai", cancelled: "Dibatalkan", archived: "Diarsipkan",
};
export const PROGRAM_ACTION_LABEL: Record<string, string> = {
  submit: "Ajukan untuk disetujui", approve: "Setujui program", reject: "Tolak (kembalikan ke draf)", activate: "Aktifkan program", complete: "Tandai selesai", cancel: "Batalkan", archive: "Arsipkan",
};
export const COHORT_STATUS_LABEL: Record<string, string> = { draft: "Draf", open: "Terbuka untuk undangan", closed: "Ditutup", completed: "Selesai" };
export const INVITE_STATUS_LABEL: Record<string, string> = { pending: "Menunggu", accepted: "Diterima", revoked: "Dicabut", expired: "Kedaluwarsa" };
export const SURVEY_KIND_LABEL: Record<string, string> = { baseline: "Survei awal (baseline)", endline: "Survei akhir (endline)", feedback_learner: "Umpan balik peserta", feedback_instructor: "Umpan balik instruktur" };
export function formatPct(v: number | null | undefined): string { return v === null || v === undefined ? "-" : `${Math.round(v * 100)}%`; }
