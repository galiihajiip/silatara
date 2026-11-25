// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CameraCheck } from "@/components/CameraCheck";

function mockMedia(impl: () => Promise<MediaStream>) {
  const getUserMedia = vi.fn(impl);
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) },
    configurable: true,
  });
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    value: () => Promise.resolve(),
    configurable: true,
  });
  return getUserMedia;
}

const stream = (label = "Kamera uji") => {
  const stop = vi.fn();
  const t = { stop, label, getSettings: () => ({ deviceId: "d" }) };
  return {
    s: { getTracks: () => [t], getVideoTracks: () => [t] } as unknown as MediaStream,
    stop,
  };
};

afterEach(() => vi.restoreAllMocks());

describe("CameraCheck", () => {
  it("menampilkan pemberitahuan privasi di samping pratinjau kamera dan TIDAK meminta kamera sebelum diklik", async () => {
    const g = mockMedia(async () => stream().s);
    const { container } = render(<CameraCheck />);
    expect(screen.getByText(/tidak direkam, disimpan, atau dikirim/)).toBeTruthy();
    expect(screen.getByText(/bukan penilaian gerakan/)).toBeTruthy();
    expect(screen.getByText(/Ringkasan kondisi perangkat/)).toBeTruthy();
    expect(g).not.toHaveBeenCalled();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it("izin ditolak -> pesan jelas dan tombol mulai tersedia lagi", async () => {
    mockMedia(async () => {
      throw Object.assign(new Error("x"), { name: "NotAllowedError" });
    });
    render(<CameraCheck />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    expect(await screen.findByText(/Izin kamera ditolak/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /nyalakan kamera/ })).toBeTruthy();
  });

  it("kamera tidak ada -> pesan unavailable", async () => {
    mockMedia(async () => {
      throw Object.assign(new Error("x"), { name: "NotFoundError" });
    });
    render(<CameraCheck />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    expect(await screen.findByText(/Kamera tidak ditemukan/)).toBeTruthy();
  });

  it("aktif -> ada tombol Hentikan; hentikan menghentikan track; unmount juga menghentikan", async () => {
    const a = stream();
    mockMedia(async () => a.s);
    const { unmount } = render(<CameraCheck />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    const stopBtn = await screen.findByRole("button", { name: /Hentikan kamera/ });
    await userEvent.click(stopBtn);
    expect(a.stop).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Kamera dihentikan.")).toBeTruthy();
    // mulai lagi lalu unmount tanpa menekan stop -> stream tetap dimatikan
    const b = stream();
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockImplementation(
      async () => b.s,
    );
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    await screen.findByRole("button", { name: /Hentikan kamera/ });
    unmount();
    await waitFor(() => expect(b.stop).toHaveBeenCalled());
  });

  const makeAdapter = (over: Partial<Record<string, unknown>> = {}) => {
    const a = {
      name: "fake-async",
      setHandlers: vi.fn(),
      init: vi
        .fn()
        .mockResolvedValue({ initMs: 12, startupMs: 3, delegate: "CPU", library: "fake" }),
      submit: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      dispose: vi.fn().mockResolvedValue(undefined),
      ...over,
    };
    return a;
  };

  it("deteksi memakai adapter asinkron, menampilkan info ramah pengguna di panel samping, dan lolos axe-core; unmount men-dispose worker", async () => {
    mockMedia(async () => stream("fake_device_0").s);
    const adapter = makeAdapter();
    const { container, unmount } = render(<CameraCheck createAdapter={() => adapter} />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Nyalakan deteksi landmark/ }));
    await waitFor(() => expect(adapter.init).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: /Matikan deteksi landmark/ })).toBeTruthy();

    const metrics = await screen.findByTestId("cam-metrics");
    expect(metrics.getAttribute("data-engine")).toBe("worker");
    expect(metrics.getAttribute("data-delegate")).toBe("CPU");
    expect(within(metrics).getByText("Kesiapan Sistem")).toBeTruthy();
    expect(within(metrics).getByText("Siap digunakan")).toBeTruthy();
    expect(within(metrics).getByText("Pemrosesan perangkat")).toBeTruthy();
    expect(within(metrics).getByText("Prosesor standar (CPU)")).toBeTruthy();
    expect(within(metrics).getByText("Waktu muat awal")).toBeTruthy();
    expect(within(metrics).getByText("Kecepatan respons kamera")).toBeTruthy();
    expect(within(metrics).getByText("Kelancaran layar")).toBeTruthy();
    expect(within(metrics).getByText(/Tubuh terdeteksi 0 kali · Tangan 0 kali/)).toBeTruthy();
    expect(within(metrics).getByText("Detail teknis lanjutan")).toBeTruthy();
    expect(within(metrics).getByText(/SINTETIS/)).toBeTruthy();

    const results = await axe.run(container);
    expect(results.violations).toEqual([]);

    unmount();
    await waitFor(() => expect(adapter.dispose).toHaveBeenCalled());
  });

  it("init gagal -> pesan galat jelas, kamera tetap aktif, TIDAK ada pemrosesan cadangan, worker di-dispose", async () => {
    mockMedia(async () => stream().s);
    const adapter = makeAdapter({
      init: vi.fn().mockRejectedValue(new Error("model tidak dapat dimuat")),
    });
    render(<CameraCheck createAdapter={() => adapter} />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Nyalakan deteksi landmark/ }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("model tidak dapat dimuat");
    expect(alert.textContent).toContain("Tidak ada pemrosesan cadangan");
    expect(screen.getByRole("button", { name: /Hentikan kamera/ })).toBeTruthy();
    expect(adapter.dispose).toHaveBeenCalled();
    expect(adapter.submit).not.toHaveBeenCalled();
  });

  it("dibatalkan saat memuat (matikan deteksi sebelum init selesai) -> adapter di-dispose, tidak berjalan", async () => {
    mockMedia(async () => stream().s);
    let release!: (v: unknown) => void;
    const adapter = makeAdapter({
      init: vi.fn(() => new Promise((res) => {
        release = res;
      })),
    });
    render(<CameraCheck createAdapter={() => adapter} />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Nyalakan deteksi landmark/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Matikan deteksi landmark/ }));
    release({ initMs: 1, startupMs: 1, delegate: null, library: "x" });
    await waitFor(() => expect(adapter.dispose).toHaveBeenCalled());
    expect(await screen.findByRole("button", { name: /Nyalakan deteksi landmark/ })).toBeTruthy();
  });

  it("tab tersembunyi menjeda inferensi (bukan kamera) dan kembali berjalan saat terlihat", async () => {
    mockMedia(async () => stream().s);
    const adapter = makeAdapter();
    render(<CameraCheck createAdapter={() => adapter} />);
    await userEvent.click(screen.getByRole("button", { name: /nyalakan kamera/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Nyalakan deteksi landmark/ }));
    await screen.findByRole("button", { name: /Matikan deteksi landmark/ });
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(adapter.pause).toHaveBeenCalled());
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(adapter.resume).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /Hentikan kamera/ })).toBeTruthy();
  });
});
