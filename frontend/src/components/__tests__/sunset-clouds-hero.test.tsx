// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { SunsetCloudsHero } from "@/components/landing/SunsetCloudsHero";

describe("SunsetCloudsHero", () => {
  it("merender hero langit polos berawan & berbintang dengan gunung solid tanpa batik, tanpa dek kartu, dan lolos aksesibilitas", async () => {
    const { container } = render(<SunsetCloudsHero practiceHref="/library/kuda-kuda-tengah/latihan" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Warisan Gerak");
    expect(screen.getByRole("link", { name: /Jelajahi Pustaka Gerakan/i }).getAttribute("href")).toBe("/library");
    expect(screen.getByRole("link", { name: /Coba Latihan Kamera/i }).getAttribute("href")).toBe(
      "/library/kuda-kuda-tengah/latihan",
    );

    // Pure SVG/CSS hero: zero raster images and >= 8 SVG linearGradients
    expect(container.querySelectorAll("img").length).toBe(0);
    expect(container.querySelectorAll("svg linearGradient").length).toBeGreaterThanOrEqual(8);

    // Clean plain gradient sky with stars, shooting stars, birds & clouds, zero Batik repeating pattern in Hero sky
    expect(container.querySelector("section")?.getAttribute("data-surface")).toBe("sunset-sky");
    expect(container.querySelectorAll("svg pattern").length).toBe(0);
    expect(container.querySelector("[data-hero-stars]")).not.toBeNull();
    expect(container.querySelector("[data-hero-shooting-stars]")).not.toBeNull();
    expect(container.querySelector("[data-hero-birds]")).not.toBeNull();
    expect(container.querySelector("[data-hero-clouds]")).not.toBeNull();

    // Solid opaque mountain base silhouettes on all 4 depth layers with 100% opaque mountain gradients
    expect(container.querySelector('[data-mountain-base="layer-1"]')).not.toBeNull();
    expect(container.querySelector('[data-mountain-base="layer-2"]')).not.toBeNull();
    expect(container.querySelector('[data-mountain-base="layer-3"]')).not.toBeNull();
    expect(container.querySelector('[data-mountain-base="layer-4"]')).not.toBeNull();

    const mountainGradients = Array.from(container.querySelectorAll("svg linearGradient")).filter((grad) =>
      /(merapi|mid-|near-|fore-)/.test(grad.id),
    );
    expect(mountainGradients.length).toBeGreaterThanOrEqual(8);
    for (const grad of mountainGradients) {
      const stops = Array.from(grad.querySelectorAll("stop"));
      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        expect(stop.getAttribute("stop-opacity")).toBe("1");
      }
    }

    // Confirm no fanned movement card deck or carousel controls inside the hero
    expect(screen.queryByRole("button", { name: /gerakan berikutnya/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /gerakan sebelumnya/i })).toBeNull();
    expect(container.querySelectorAll("article").length).toBe(0);

    const a11y = await axe.run(container);
    expect(a11y.violations).toEqual([]);
  });
});
