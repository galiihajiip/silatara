// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CalibrationWorkspace } from "@/components/CalibrationWorkspace";
import { MovementDocumentView } from "@/components/MovementDocumentView";
import { PhaseEditor } from "@/components/studio/PhaseEditor";
import type { InstructorAnnotation, PublicDocument, StudioPhase } from "@/lib/types";

const doc = (over: Partial<PublicDocument> = {}): PublicDocument => ({
  id: "d1", version_no: 2, name_id: "Gerakan Uji", name_local: null, level: "beginner", safety_category: "solo_beginner",
  prerequisites: "Tidak ada", learning_context: null, description: "Baris satu.\n\nBaris dua.", terminology_notes: null,
  common_mistakes: ["Menahan napas"], safety_guidance: "Berhenti bila nyeri", relevant_body_parts: ["bahu"], relevant_landmarks: [11],
  phases: [{ id: "p1", order_index: 0, name: "Fase A", instruction: "<script>alert(1)</script> instruksi", body_focus: ["bahu"], safety_note: null, start_ms: 1000, end_ms: 2500 }],
  media: [], rights_holder: "Instruktur", license_type: "instructor_owned", usage_scope: "Belajar", changelog: "Perbaikan kecil", published_at: null, authors: ["Guru Uji"], ...over,
});

describe("MovementDocumentView", () => {
  it("menampilkan versi, penyusun, langkah fase, dan changelog tanpa basa-basi solo; teks HTML ditampilkan sebagai teks (tidak dieksekusi)", () => {
    const { container } = render(<MovementDocumentView doc={doc()} />);
    expect(screen.getByRole("heading", { name: "Langkah demi langkah" })).toBeTruthy();
    expect(screen.getByText("Fase A")).toBeTruthy();
    expect(screen.getByText(/Disusun oleh/)).toBeTruthy();
    expect(screen.getByText("Guru Uji")).toBeTruthy();
    expect(screen.queryByText(/Dapat dilatih sendiri|klasifikasi administratif/i)).toBeNull();
    expect(screen.getByText(/Catatan perubahan versi ini: Perbaikan kecil/)).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
  });
  it("menampilkan peringatan ringkas saat kategori keselamatan membutuhkan instruktur", () => {
    render(<MovementDocumentView doc={doc({ safety_category: "supervised_practice" })} />);
    expect(screen.getByText("Latih bersama instruktur.")).toBeTruthy();
  });
  it("pratinjau berlabel; tanpa media tidak ada bagian media (dokumentasi teks tetap sah)", () => {
    render(<MovementDocumentView doc={doc()} preview />);
    expect(screen.getByText("2 (pratinjau)")).toBeTruthy();
    expect(screen.queryByText("Media referensi")).toBeNull();
  });
  it("media publik menampilkan pemegang hak dan lingkup izin", () => {
    render(<MovementDocumentView doc={doc({ media: [{ id: "m1", kind: "video", title: "Klip", url: "/api/v1/media/m1/file", rights_holder: "Tim", source_description: "Sendiri", usage_scope: "Belajar", is_demo: true }] })} />);
    expect(screen.getByText(/Pemegang hak: Tim/)).toBeTruthy();
    expect(screen.getByText("[DEMO] Klip")).toBeTruthy();
  });
});

describe("PhaseEditor", () => {
  const phases: StudioPhase[] = [{ name: "A", instruction: "i", body_focus: [], safety_note: null, start_ms: null, end_ms: null }, { name: "B", instruction: "j", body_focus: [], safety_note: null, start_ms: null, end_ms: null }];
  it("menambah, memindah, dan menghapus fase; jumlah ditentukan instruktur", async () => {
    const onChange = vi.fn();
    render(<PhaseEditor phases={phases} onChange={onChange} disabled={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Turunkan fase 1" }));
    expect(onChange.mock.calls[0][0].map((p: StudioPhase) => p.name)).toEqual(["B", "A"]);
    await userEvent.click(screen.getByRole("button", { name: "Hapus fase 2" }));
    expect(onChange.mock.calls[1][0].map((p: StudioPhase) => p.name)).toEqual(["A"]);
    await userEvent.click(screen.getByRole("button", { name: "Tambah fase" }));
    expect(onChange.mock.calls[2][0]).toHaveLength(3);
  });
  it("waktu dalam detik dikonversi ke milidetik; terkunci saat disabled", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<PhaseEditor phases={phases} onChange={onChange} disabled={false} />);
    fireEvent.change(screen.getAllByLabelText(/Mulai di video referensi/)[0], { target: { value: "1.5" } });
    expect(onChange.mock.calls.at(-1)![0][0].start_ms).toBe(1500);
    rerender(<PhaseEditor phases={phases} onChange={onChange} disabled />);
    expect(screen.queryByRole("button", { name: "Tambah fase" })).toBeNull();
    expect((screen.getAllByLabelText(/Nama fase/)[0] as HTMLInputElement).disabled).toBe(true);
  });
  it("mengosongkan waktu menghasilkan null (bukan 0)", () => {
    const withTime = [{ ...phases[0], start_ms: 1000 }];
    const c2 = vi.fn();
    const { container } = render(<PhaseEditor phases={withTime} onChange={c2} disabled={false} />);
    fireEvent.change(container.querySelector("input[id='ph-s-0']")!, { target: { value: "" } });
    expect(c2.mock.calls.at(-1)![0][0].start_ms).toBeNull();
  });
  it("keadaan kosong menjelaskan bahwa tidak ada fase bawaan", () => {
    render(<PhaseEditor phases={[]} onChange={() => undefined} disabled={false} />);
    expect(screen.getByText(/sepenuhnya Anda tentukan/)).toBeTruthy();
  });
});

describe("CalibrationWorkspace (fixture [DEMO])", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} unobserve() {} });

  });
  const ann = (over: Partial<InstructorAnnotation> = {}): InstructorAnnotation => ({
    id: "a1", movement_id: "m1", media_id: null, fixture_key: "demo-synthetic", phase_id: null, kind: "phase_marker", timestamp_ms: 1500, label: "Penanda lama",
    note: null, annotator: "Guru", annotator_user_id: "u-other", model_version: "[DEMO] synthetic-fixture (tanpa model)", source_note: "[DEMO]", review_status: "pending",
    reviewed_by: null, reviewed_at: null, created_at: "2026-11-20T00:00:00Z", provenance_label: "Instructor reference annotation — bukan ground truth dan bukan label akurasi", ...over,
  });
  const base = { movementId: "m1", movementName: "Gerakan Uji", isDemo: true, media: [], phases: [], viewerId: "u-me", viewerRole: "instructor" as const };

  it("tanpa video berizin: fixture berlabel [DEMO], tanpa skor/akurasi, dan menjelaskan 'instructor reference annotation'", () => {
    render(<CalibrationWorkspace {...base} initialAnnotations={[ann()]} />);
    expect(screen.getAllByText(/instructor reference annotation/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fixture sintetis — bukan rekaman manusia/).length).toBeGreaterThan(0);
    expect(screen.getByRole("slider", { name: "Timeline referensi" }).getAttribute("aria-valuemax")).toBe("6000");
    expect(screen.queryByText(/(skor|similarity|akurasi|kemiripan)\s*[:=]\s*\d/i)).toBeNull(); // tidak ada angka penilaian
    expect(screen.getByText(/Tidak ada skor, ambang, kemiripan, atau koreksi otomatis/)).toBeTruthy(); // dan pernyataannya eksplisit
  });
  it("menambah penanda mengirim HANYA timestamp + provenance (tanpa landmark/frame); label wajib", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify(ann({ id: "a2", label: "Baru", timestamp_ms: 0, annotator_user_id: "u-me" })), { status: 201 }));
    vi.stubGlobal("fetch", f);
    render(<CalibrationWorkspace {...base} initialAnnotations={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Simpan penanda" }));
    expect(await screen.findByText(/Beri label atau pilih fase/)).toBeTruthy();
    expect(f).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText("Label penanda"), "Baru");
    await userEvent.click(screen.getByRole("button", { name: "Simpan penanda" }));
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("/api/v1/studio/movements/m1/annotations");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ fixture_key: "demo-synthetic", kind: "phase_marker", timestamp_ms: 0, label: "Baru" });
    expect(Object.keys(body).join()).not.toMatch(/landmark|pose|frame/i);
    expect(body.model_version).toMatch(/^\[DEMO\]/);
    const table = await screen.findByRole("table", { name: "Anotasi referensi instruktur" });
    expect(within(table).getByText("Baru")).toBeTruthy();
  });
  it("tombol Terima/Tolak tidak muncul untuk anotasi buatan sendiri (tidak ada persetujuan sendiri)", () => {
    render(<CalibrationWorkspace {...base} initialAnnotations={[ann({ annotator_user_id: "u-me", label: "Milik saya" }), ann({ id: "a3", label: "Milik lain" })]} />);
    const mine = screen.getByRole("row", { name: /Milik saya/ }), other = screen.getByRole("row", { name: /Milik lain/ });
    expect(within(mine).queryByRole("button", { name: "Terima" })).toBeNull();
    expect(within(other).getByRole("button", { name: "Terima" })).toBeTruthy();
  });
  it("keyboard pada timeline melangkah per frame dan Home/End melompat", async () => {
    render(<CalibrationWorkspace {...base} initialAnnotations={[]} />);
    const slider = screen.getByRole("slider", { name: "Timeline referensi" });
    slider.focus();
    await userEvent.keyboard("{End}");
    expect(slider.getAttribute("aria-valuenow")).toBe("6000");
    await userEvent.keyboard("{Home}{ArrowRight}");
    expect(Number(slider.getAttribute("aria-valuenow"))).toBe(33);
  });
});
