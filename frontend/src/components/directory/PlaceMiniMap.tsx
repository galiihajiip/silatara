"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { TILE_ATTRIBUTION, TILE_URL, type Precision } from "@/lib/directory";

/** Peta kecil detail tempat. Presisi wilayah digambar sebagai lingkaran area, bukan pin alamat. */
export function PlaceMiniMap({ lat, lng, precision, label }: { lat: number; lng: number; precision: Precision; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let m: Leaflet.Map | null = null;
    let gone = false;
    import("leaflet").then((mod) => {
      if (gone || !el.current) return;
      const L = (mod.default ?? mod) as typeof Leaflet;
      const exact = precision === "exact";
      m = L.map(el.current, { scrollWheelZoom: false, keyboard: true }).setView([lat, lng], exact ? 16 : 10);
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(m);
      if (exact) {
        L.marker([lat, lng], {
          icon: L.divIcon({ className: "", html: '<span class="sil-pin sil-pin--drop" style="--pin:#6d1b11"><b>•</b></span>', iconSize: [28, 28], iconAnchor: [14, 28] }),
          title: label, alt: label,
        }).addTo(m);
      } else {
        L.circle([lat, lng], { radius: 15000, color: "#6d1b11", weight: 2, dashArray: "6 6", fillOpacity: 0.08 }).bindTooltip("Lokasi tingkat kabupaten/kota").addTo(m);
      }
    }).catch(() => setFailed(true));
    return () => { gone = true; m?.remove(); };
  }, [lat, lng, precision, label]);
  if (failed) return <p className="rounded-xl border border-line-200 bg-paper-50 p-4 text-sm">Peta tidak dapat dimuat.</p>;
  return <div ref={el} role="region" aria-label={`Peta lokasi ${label}`} className="h-64 w-full overflow-hidden rounded-2xl border border-line-200" />;
}
