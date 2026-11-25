// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthBentoShell } from "@/components/AuthBentoShell";
import { AuthForm } from "@/components/AuthForm";
import { EmptyState, Pagination, ProgressBar, ProvenanceBadge } from "@/components/ui";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

beforeEach(() => { push.mockReset(); vi.unstubAllGlobals(); });

describe("AuthForm (register)", () => {
  it("menampilkan error validasi dan tidak memanggil API bila tidak valid", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    render(<AuthForm mode="register" />);
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    expect(await screen.findByText("Kata sandi minimal 12 karakter.")).toBeTruthy();
    expect(screen.getByText("Masukkan alamat email yang valid.")).toBeTruthy();
    expect(f).not.toHaveBeenCalled();
  });
  it("mengirim data valid ke /auth/register lalu meminta pengguna memeriksa email (tanpa sesi/redirect)", async () => {
    const f = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "check_email" }), { status: 202 }));
    vi.stubGlobal("fetch", f);
    render(<AuthForm mode="register" />);
    await userEvent.type(screen.getByLabelText("Nama tampilan"), "Sari");
    await userEvent.type(screen.getByLabelText("Email"), "sari@contoh.test");
    await userEvent.type(screen.getByLabelText("Kata sandi"), "kata-sandi-12345");
    await userEvent.type(screen.getByLabelText("Ulangi kata sandi"), "kata-sandi-12345");
    await userEvent.click(screen.getByRole("button", { name: "Buat akun" }));
    expect(await screen.findByText("Periksa email Anda")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
    expect(f.mock.calls[0][0]).toBe("/api/v1/auth/register");
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ email: "sari@contoh.test", password: "kata-sandi-12345", display_name: "Sari" });
  });
});

describe("AuthForm (login)", () => {
  it("menampilkan pesan error dari server (role=alert) saat kredensial salah", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: "INVALID_CREDENTIALS", message: "Email atau kata sandi salah." } }), { status: 401 })));
    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.id");
    await userEvent.type(screen.getByLabelText("Kata sandi"), "salah");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Email atau kata sandi salah.");
    expect(push).not.toHaveBeenCalled();
  });
  it("mengabaikan ?next yang tidak aman (open redirect)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: {}, csrf_token: "t" }), { status: 200 })));
    render(<AuthForm mode="login" next="//evil.example" />);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.id");
    await userEvent.type(screen.getByLabelText("Kata sandi"), "apa-saja");
    await userEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/app"));
  });
  it("merender bingkai Bento 2-kolom dengan toggle visibilitas sandi dan lolos axe-core", async () => {
    const { container } = render(
      <AuthBentoShell title="Masuk" description="Lanjutkan belajar dan lihat progres Anda.">
        <AuthForm mode="login" />
      </AuthBentoShell>,
    );
    const shell = container.querySelector("[data-auth-page]");
    expect(shell).not.toBeNull();
    expect(shell?.hasAttribute("data-fullbleed")).toBe(true);
    expect(shell?.className).toContain("min-h-dvh");
    expect(shell?.className).toContain("w-full");
    expect(shell?.className).toContain("lg:grid-cols-2");
    expect(shell?.querySelectorAll("pattern")).toHaveLength(0);
    expect(screen.getByRole("heading", { level: 1, name: "Masuk" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Kembali ke Beranda/i }).getAttribute("href")).toBe("/");
    expect(screen.queryByText("Warisan Nusantara")).toBeNull();
    expect(screen.queryByText("ARSIP 3D · LATIHAN")).toBeNull();
    expect(screen.queryByText("Pelestarian Silat Nusantara")).toBeNull();
    const aside = shell?.querySelector("aside");
    expect(aside).not.toBeNull();
    expect(aside?.textContent?.trim()).toBe("");
    expect(screen.getByText(/38 Provinsi · 120\+ Gerakan Terarsip/)).toBeTruthy();

    const pw = screen.getByLabelText("Kata sandi") as HTMLInputElement;
    expect(pw.type).toBe("password");
    await userEvent.click(screen.getByRole("button", { name: "Tampilkan kata sandi" }));
    expect(pw.type).toBe("text");
    await userEvent.click(screen.getByRole("button", { name: "Sembunyikan kata sandi" }));
    expect(pw.type).toBe("password");

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
  });
});

describe("komponen UI", () => {
  const prov = { status: "published", is_demo: true, partner_verified: false, verification_label: "[DEMO] Contoh teknis — belum diverifikasi mitra", source_citation: null, source_url: null, approved_by_name: null, approved_at: null } as const;
  it("ProvenanceBadge menampilkan label jujur", () => {
    render(<ProvenanceBadge p={prov} />);
    expect(screen.getByText(/belum diverifikasi mitra/)).toBeTruthy();
    expect(screen.queryByText("Terverifikasi oleh mitra")).toBeNull();
  });
  it("ProgressBar memiliki semantik progressbar", () => {
    render(<ProgressBar progress={{ completed: 1, total: 3, percent: 33 }} label="Progres" />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("33");
  });
  it("Pagination tersembunyi bila satu halaman dan menjaga filter di URL", () => {
    const { container, rerender } = render(<Pagination page={{ page: 1, total_pages: 1, total: 3 }} basePath="/x" params={{}} />);
    expect(container.textContent).toBe("");
    rerender(<Pagination page={{ page: 2, total_pages: 3, total: 30 }} basePath="/x" params={{ q: "silat", page: "2" }} />);
    expect(screen.getByRole("link", { name: /Berikutnya/ }).getAttribute("href")).toBe("/x?q=silat&page=3");
    expect(screen.getByRole("link", { name: /Sebelumnya/ }).getAttribute("href")).toBe("/x?q=silat&page=1");
  });
  it("EmptyState menampilkan judul", () => {
    render(<EmptyState title="Kosong" />);
    expect(screen.getByText("Kosong")).toBeTruthy();
  });
});
