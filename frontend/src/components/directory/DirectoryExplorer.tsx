"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Crosshair,
  ExternalLink,
  Layers,
  List as ListIcon,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import {
  activeFilterCount,
  bboxParam,
  EMPTY_FILTERS,
  escapeHtml,
  filtersFromParams,
  filtersToPageParams,
  filtersToQuery,
  groupByCoordinate,
  INDONESIA_BOUNDS,
  shortRegion,
  styleOf,
  TILE_ATTRIBUTION,
  TILE_URL,
  type DirectoryFilters,
  type Facets,
  type HeritageArea,
  type PlaceSummary,
  type PlacesResponse,
} from "@/lib/directory";

export type VerificationStatus = "" | "active_confirmed" | "active_unverified" | "inactive" | "closed";

type MapState = "loading" | "ready" | "error";
type Near = { lat: number; lng: number } | null;

export function safeStyleOf(cat: string) {
  const s = styleOf(cat);
  if (s.color === "#0f766e") {
    return { ...s, color: "#8a4522" };
  }
  return s;
}

function markerHtml(p: PlaceSummary): string {
  const s = safeStyleOf(p.category);
  const area = p.precision !== "exact";
  return `<span class="sil-pin${area ? " sil-pin--area" : " sil-pin--drop"}" style="--pin:${s.color}" aria-hidden="true"><b>${s.glyph}</b></span>`;
}

function popupHtml(items: PlaceSummary[]): string {
  const one = (p: PlaceSummary) => {
    const rows = [
      `<p class="sil-pop__meta">${escapeHtml(p.category_label)}${p.organization ? ` · ${escapeHtml(p.organization.short_name ?? p.organization.name)}` : ""}</p>`,
      `<p class="sil-pop__place">${escapeHtml([p.district, shortRegion(p.regency), p.province].filter(Boolean).join(", "))}</p>`,
      p.address ? `<p>${escapeHtml(p.address)}</p>` : "",
      p.is_training_location ? `<p>Tempat latihan</p>` : "",
      p.website ? `<p><a href="${escapeHtml(p.website)}" target="_blank" rel="noopener noreferrer">Situs web</a></p>` : "",
      `<p class="sil-pop__actions"><a href="/community/tempat/${encodeURIComponent(p.slug)}">Lihat detail</a>${p.precision === "exact"
        ? ` · <a href="https://www.openstreetmap.org/directions?to=${p.lat.toFixed(6)}%2C${p.lng.toFixed(6)}" target="_blank" rel="noopener noreferrer">Arah</a>` : ""}</p>`,
    ];
    return `<div class="sil-pop__item"><h3>${escapeHtml(p.name)}</h3>${rows.join("")}</div>`;
  };
  if (items.length === 1) return `<div class="sil-pop">${one(items[0])}</div>`;
  return `<div class="sil-pop"><p class="sil-pop__group">${items.length} lokasi tercatat di ${escapeHtml(shortRegion(items[0].regency))} (tingkat wilayah)</p>${items.map(one).join("")}</div>`;
}

export function DirectoryExplorer({ facets: initialFacets, initialParams }: { facets: Facets; initialParams: string }) {
  const [filters, setFilters] = useState<DirectoryFilters>(() => filtersFromParams(new URLSearchParams(initialParams)));
  const [status, setStatus] = useState<VerificationStatus>(() => {
    const sp = new URLSearchParams(initialParams);
    const st = sp.get("status") ?? "";
    return ["active_confirmed", "active_unverified", "inactive", "closed"].includes(st) ? (st as VerificationStatus) : "";
  });
  const [draftQ, setDraftQ] = useState(filters.q);
  const [facets, setFacets] = useState<Facets>(initialFacets);
  const [mapState, setMapState] = useState<MapState>("loading");
  const [viewport, setViewport] = useState<{ bbox: string; zoom: number } | null>(null);
  const [mapData, setMapData] = useState<PlacesResponse | null>(null);
  const [list, setList] = useState<{ total: number; items: PlaceSummary[] } | null>(null);
  const [totalAll, setTotalAll] = useState<number | null>(null);
  const [listScope, setListScope] = useState<"viewport" | "all">("viewport");
  const [near, setNear] = useState<Near>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [showHeritage, setShowHeritage] = useState(false);
  const [heritage, setHeritage] = useState<HeritageArea[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [expandedSlugs, setExpandedSlugs] = useState<Record<string, boolean>>({});

  const mapEl = useRef<HTMLDivElement>(null);
  const L = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const heritageLayer = useRef<Leaflet.LayerGroup | null>(null);
  const userLayer = useRef<Leaflet.LayerGroup | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const reqId = useRef(0);

  // Inisialisasi peta (Leaflet)
  useEffect(() => {
    let disposed = false;
    import("leaflet").then((mod) => {
      if (disposed || !mapEl.current) return;
      const Lf = (mod.default ?? mod) as typeof Leaflet;
      L.current = Lf;
      const m = Lf.map(mapEl.current, { zoomControl: true, minZoom: 4, maxZoom: 18, worldCopyJump: false, keyboard: true })
        .fitBounds(INDONESIA_BOUNDS);
      Lf.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(m);
      layer.current = Lf.layerGroup().addTo(m);
      heritageLayer.current = Lf.layerGroup();
      userLayer.current = Lf.layerGroup().addTo(m);
      const update = () => {
        const b = m.getBounds();
        setViewport({ bbox: bboxParam({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() }), zoom: m.getZoom() });
      };
      let t: ReturnType<typeof setTimeout> | undefined;
      m.on("moveend", () => { clearTimeout(t); t = setTimeout(update, 200); });
      map.current = m;
      update();
      setMapState("ready");
    }).catch(() => { if (!disposed) setMapState("error"); });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sinkron URL
  useEffect(() => {
    const qs = filtersToPageParams(filters);
    const sp = new URLSearchParams(qs);
    if (status) sp.set("status", status);
    const finalQs = sp.toString();
    window.history.replaceState(null, "", finalQs ? `?${finalQs}` : window.location.pathname);
  }, [filters, status]);

  // Data peta (viewport)
  useEffect(() => {
    if (!viewport) return;
    const id = ++reqId.current;
    const extra = {
      bbox: viewport.bbox,
      zoom: viewport.zoom,
      ...(status ? { status } : {}),
      ...(near ? { near: `${near.lat},${near.lng}`, sort: "distance" } : {}),
    };
    apiGet<PlacesResponse>(`/directory/places?${filtersToQuery(filters, extra)}`).then((r) => {
      if (id !== reqId.current) return;
      if (r.ok) { setMapData(r.data); setFetchError(null); } else setFetchError(r.error);
    });
  }, [viewport, filters, status, near]);

  // Daftar tempat
  useEffect(() => {
    const extra: Record<string, string | number | undefined> = {
      page_size: 60,
      ...(status ? { status } : {}),
    };
    if (listScope === "viewport" && viewport) extra.bbox = viewport.bbox;
    if (near) { extra.near = `${near.lat},${near.lng}`; extra.sort = "distance"; }
    let alive = true;
    queueMicrotask(() => { if (alive) setBusy(true); });
    Promise.all([
      apiGet<{ total: number; items: PlaceSummary[] }>(`/directory/list?${filtersToQuery(filters, extra)}`),
      apiGet<{ total: number }>(`/directory/list?${filtersToQuery(filters, { page_size: 1, ...(status ? { status } : {}) })}`),
    ]).then(([a, b]) => {
      if (!alive) return;
      setBusy(false);
      if (a.ok) setList(a.data); else setFetchError(a.error);
      if (b.ok) setTotalAll(b.data.total);
    });
    return () => { alive = false; };
  }, [filters, status, viewport, listScope, near]);

  // Facets kab/kota saat provinsi berubah
  useEffect(() => {
    if (!filters.province) return;
    let alive = true;
    apiGet<Facets>(`/directory/facets?province=${filters.province}`).then((r) => { if (alive && r.ok) setFacets((f) => ({ ...f, regencies: r.data.regencies })); });
    return () => { alive = false; };
  }, [filters.province]);

  // Gambar layer penanda & klaster
  useEffect(() => {
    const Lf = L.current, m = map.current, lg = layer.current;
    if (!Lf || !m || !lg || !mapData) return;
    lg.clearLayers();
    markers.current.clear();
    const addPlaces = (g: PlaceSummary[]) => {
      const p = g[0];
      const html = g.length > 1 ? `<span class="sil-pin sil-pin--area sil-pin--group" style="--pin:#6d1b11" aria-hidden="true">${g.length}</span>` : markerHtml(p);
      const icon = Lf.divIcon({ className: "", html, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -14] });
      const title = g.length > 1 ? `${g.length} lokasi di ${shortRegion(p.regency)}` : p.name;
      const mk = Lf.marker([p.lat, p.lng], { icon, keyboard: true, title, alt: title, riseOnHover: true })
        .bindPopup(popupHtml(g), { maxWidth: 300, autoPanPadding: [24, 24], className: "sil-popup" })
        .bindTooltip(title, { direction: "top", offset: [0, -14] });
      mk.addTo(lg);
      for (const it of g) markers.current.set(it.slug, mk);
    };
    if (mapData.mode === "clusters") {
      for (const c of mapData.clusters) {
        if (c.single) { addPlaces([c.single]); continue; }
        const size = Math.min(64, 30 + Math.log2(c.count + 1) * 6);
        const icon = Lf.divIcon({ className: "", html: `<span class="sil-cluster" style="width:${size}px;height:${size}px">${c.count}</span>`, iconSize: [size, size] });
        const mk = Lf.marker([c.lat, c.lng], { icon, keyboard: true, title: `${c.count} lokasi | perbesar`, alt: `${c.count} lokasi` });
        mk.on("click", () => {
          const [a, b, cc, d] = c.bbox;
          if (a === cc && b === d) m.setView([b, a], Math.min(m.getZoom() + 3, 14));
          else m.fitBounds([[b, a], [d, cc]], { padding: [40, 40], maxZoom: 14 });
        });
        mk.addTo(lg);
      }
      return;
    }
    for (const g of groupByCoordinate(mapData.items)) addPlaces(g);
  }, [mapData]);

  // Layer area warisan
  useEffect(() => {
    const Lf = L.current, m = map.current, hl = heritageLayer.current;
    if (!Lf || !m || !hl) return;
    if (!showHeritage) { hl.remove(); return; }
    if (!heritage) {
      apiGet<{ items: HeritageArea[] }>("/directory/heritage-areas").then((r) => { if (r.ok) setHeritage(r.data.items); });
      return;
    }
    hl.clearLayers();
    for (const a of heritage) {
      for (const pt of a.points) {
        Lf.circle([pt.lat, pt.lng], { radius: 18000, color: "#9a3412", weight: 1.5, dashArray: "4 4", fillColor: "#9a3412", fillOpacity: 0.12 })
          .bindPopup(`<div class="sil-pop"><div class="sil-pop__item"><h3>${escapeHtml(a.name)}</h3><p class="sil-pop__meta">Area warisan terdokumentasi</p><p>${escapeHtml(a.locality_text ?? "")}</p>${a.public_note ? `<p>${escapeHtml(a.public_note)}</p>` : ""}</div></div>`, { maxWidth: 300, className: "sil-popup" })
          .addTo(hl);
      }
    }
    hl.addTo(m);
  }, [showHeritage, heritage, mapState]);

  const update = useCallback((patch: Partial<DirectoryFilters>) => setFilters((f) => ({ ...f, ...patch })), []);

  const flyToRegion = (code: string, kind: "province" | "regency") => {
    const rec = kind === "province" ? facets.provinces.find((p) => p.code === code) : facets.regencies.find((r) => r.code === code);
    const b = rec?.bbox;
    if (b && map.current) map.current.fitBounds([[b[1], b[0]], [b[3], b[2]]], { padding: [20, 20] });
  };

  const locate = () => {
    if (!("geolocation" in navigator)) { setGeoMsg("Peramban ini tidak mendukung lokasi."); return; }
    setGeoMsg("Meminta izin lokasi…");
    navigator.geolocation.getCurrentPosition((pos) => {
      const n = { lat: Number(pos.coords.latitude.toFixed(4)), lng: Number(pos.coords.longitude.toFixed(4)) };
      setNear(n);
      setGeoMsg("Daftar diurutkan dari yang terdekat. Lokasi Anda tidak dikirim untuk disimpan.");
      setListScope("all");
      const Lf = L.current;
      if (Lf && userLayer.current && map.current) {
        userLayer.current.clearLayers();
        Lf.circleMarker([n.lat, n.lng], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#8f2317", fillOpacity: 1 }).bindTooltip("Lokasi Anda").addTo(userLayer.current);
        map.current.setView([n.lat, n.lng], 9);
      }
    }, (err) => setGeoMsg(err.code === err.PERMISSION_DENIED ? "Izin lokasi ditolak. Anda tetap dapat mencari berdasarkan wilayah." : "Lokasi tidak dapat ditentukan."),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setStatus("");
    setDraftQ("");
    setNear(null);
    setGeoMsg(null);
    userLayer.current?.clearLayers();
    map.current?.fitBounds(INDONESIA_BOUNDS);
  };

  const focusPlace = (p: PlaceSummary) => {
    const m = map.current;
    if (!m) return;
    m.setView([p.lat, p.lng], Math.max(m.getZoom(), p.precision === "exact" ? 15 : 10));
    setTimeout(() => markers.current.get(p.slug)?.openPopup(), 450);
    mapEl.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const toggleExpand = (slug: string) => {
    setExpandedSlugs((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const nActive = activeFilterCount(filters) + (status ? 1 : 0);
  const regencies = facets.regencies.filter((r) => r.province_code === filters.province);

  return (
    <section aria-labelledby="peta-judul" className="mb-12 space-y-6">
      <h2 id="peta-judul" className="sr-only">Peta dan direktori tempat pencak silat</h2>

      {/* ---------- 1. PETA LUAS DI BAGIAN ATAS (WIDE MAP) ---------- */}
      <div className="space-y-3">
        {/* Tombol aksi peta cepat & info ringkas */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={locate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 bg-paper-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs hover:bg-parchment-100 transition-colors"
            >
              <Crosshair aria-hidden className="h-3.5 w-3.5 text-chocolate-700" />
              <span>Lokasi terdekat</span>
            </button>
            <label className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 bg-paper-50 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs cursor-pointer hover:bg-parchment-100 transition-colors">
              <input
                type="checkbox"
                checked={showHeritage}
                onChange={(e) => setShowHeritage(e.target.checked)}
                className="rounded border-line-200 text-forest-700 focus:ring-forest-700"
              />
              <Layers aria-hidden className="h-3.5 w-3.5 text-bronze-700" />
              <span>Area warisan terdokumentasi</span>
            </label>
          </div>
          <p aria-live="polite" className="text-xs text-slate-600">
            {mapData ? (
              <>
                <strong className="text-slate-800">{mapData.total}</strong> lokasi di area peta
                {totalAll !== null && ` · ${totalAll} total sesuai saringan`}
              </>
            ) : (
              "Memuat lokasi…"
            )}
          </p>
        </div>

        {geoMsg && <p role="status" className="text-xs text-slate-600">{geoMsg}</p>}

        {/* Bingkai Peta Bento Lebar Penuh (w-full) */}
        <div className="relative w-full overflow-hidden rounded-[24px] border border-line-200 bg-parchment-100 shadow-sm">
          <div
            ref={mapEl}
            className="h-[360px] sm:h-[420px] lg:h-[480px] w-full"
            role="region"
            aria-label="Peta lokasi pencak silat di Indonesia"
          />
          {mapState === "loading" && (
            <div className="absolute inset-0 grid place-items-center bg-paper-50/70 text-sm font-medium text-slate-600 backdrop-blur-xs">
              Memuat peta…
            </div>
          )}
          {mapState === "error" && (
            <div role="alert" className="absolute inset-0 grid place-items-center bg-paper-50 p-6 text-center text-sm">
              Peta tidak dapat dimuat. Daftar lokasi di bawah tetap dapat digunakan.
            </div>
          )}
        </div>

        <Legend />
        {fetchError && <p role="alert" className="mt-1 text-xs text-clay-600">Gagal memuat data: {fetchError}</p>}
      </div>

      {/* ---------- 2. KONTROL SARINGAN & PENCARIAN KOMPAK ---------- */}
      <div className="rounded-[24px] border border-line-200 bg-paper-50 p-4 sm:p-5 shadow-xs">
        <form
          role="search"
          aria-label="Cari dan saring tempat pencak silat"
          onSubmit={(e) => { e.preventDefault(); update({ q: draftQ }); }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Cari Nama */}
            <div>
              <label htmlFor="dir-q" className="mb-1 block text-xs font-semibold text-slate-700">
                Cari nama atau wilayah
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    id="dir-q"
                    value={draftQ}
                    onChange={(e) => setDraftQ(e.target.value)}
                    placeholder="mis. PSHT, Madiun"
                    className="w-full rounded-xl border border-line-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-forest-700 px-3.5 py-2 text-sm font-medium text-paper-50 transition-colors hover:bg-forest-900"
                  aria-label="Cari"
                >
                  Cari
                </button>
              </div>
            </div>

            {/* 2. Provinsi */}
            <div>
              <label htmlFor="dir-prov" className="mb-1 block text-xs font-semibold text-slate-700">
                Provinsi
              </label>
              <select
                id="dir-prov"
                value={filters.province}
                onChange={(e) => {
                  update({ province: e.target.value, regency: "" });
                  if (e.target.value) flyToRegion(e.target.value, "province");
                }}
                className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="">Semua provinsi</option>
                {facets.provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.count})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Kabupaten / Kota */}
            <div>
              <label htmlFor="dir-reg" className="mb-1 block text-xs font-semibold text-slate-700">
                Kabupaten / Kota
              </label>
              <select
                id="dir-reg"
                value={filters.regency}
                disabled={!filters.province}
                onChange={(e) => {
                  update({ regency: e.target.value });
                  if (e.target.value) flyToRegion(e.target.value, "regency");
                }}
                className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="">
                  {filters.province ? "Semua kabupaten/kota" : "Pilih provinsi dahulu"}
                </option>
                {regencies.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}{r.count ? ` (${r.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Status Verifikasi */}
            <div>
              <label htmlFor="dir-status" className="mb-1 block text-xs font-semibold text-slate-700">
                Status verifikasi
              </label>
              <select
                id="dir-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as VerificationStatus)}
                className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              >
                <option value="">Semua status</option>
                <option value="active_confirmed">Terverifikasi / Terkonfirmasi</option>
                <option value="active_unverified">Belum terverifikasi</option>
              </select>
            </div>
          </div>

          {/* Saringan lanjutan toggle & reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-200 pt-3 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                aria-expanded={showMoreFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs hover:bg-parchment-100 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-forest-700" aria-hidden />
                <span>Saringan lanjutan</span>
                {nActive > 0 && (
                  <span className="rounded-full bg-forest-700 px-1.5 py-0.2 text-[11px] font-semibold text-paper-50">
                    {nActive}
                  </span>
                )}
                {showMoreFilters ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
              </button>

              {nActive > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-parchment-100 hover:text-forest-700"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden />
                  <span>Atur ulang filter ({nActive})</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600">
              Ditemukan <strong className="text-slate-900">{list?.total ?? 0}</strong> tempat terdata
            </div>
          </div>

          {/* Drawer Saringan Lanjutan */}
          {showMoreFilters && (
            <div className="mt-3 rounded-2xl border border-line-200/80 bg-slate-50/70 p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="dir-org" className="mb-1 block text-xs font-semibold text-slate-700">
                    Perguruan / Organisasi induk
                  </label>
                  <select
                    id="dir-org"
                    className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm"
                    value={filters.organization}
                    onChange={(e) => update({ organization: e.target.value })}
                  >
                    <option value="">Semua organisasi</option>
                    {facets.organizations.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.short_name ?? o.name} ({o.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dir-act" className="mb-1 block text-xs font-semibold text-slate-700">
                    Aktivitas
                  </label>
                  <select
                    id="dir-act"
                    className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm"
                    value={filters.activity}
                    onChange={(e) => update({ activity: e.target.value as DirectoryFilters["activity"] })}
                  >
                    <option value="">Semua aktivitas</option>
                    {facets.activities.map((a) => (
                      <option key={a.key} value={a.key}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dir-prec" className="mb-1 block text-xs font-semibold text-slate-700">
                    Ketepatan lokasi
                  </label>
                  <select
                    id="dir-prec"
                    className="w-full rounded-xl border border-line-200 bg-white px-3 py-2 text-sm"
                    value={filters.precision}
                    onChange={(e) => update({ precision: e.target.value as DirectoryFilters["precision"] })}
                  >
                    <option value="">Semua ketepatan</option>
                    <option value="exact">Titik tempat</option>
                    <option value="regency">Tingkat kabupaten/kota</option>
                  </select>
                </div>
              </div>

              <fieldset>
                <legend className="mb-1.5 text-xs font-semibold text-slate-700">Jenis tempat</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {facets.categories.map((c) => {
                    const st = safeStyleOf(c.key);
                    const on = filters.categories.includes(c.key);
                    return (
                      <label key={c.key} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            update({
                              categories: on
                                ? filters.categories.filter((x) => x !== c.key)
                                : [...filters.categories, c.key],
                            })
                          }
                          className="rounded border-line-200 text-forest-700 focus:ring-forest-700"
                        />
                        <span
                          aria-hidden
                          className="sil-pin sil-pin--sm"
                          style={{ "--pin": st.color } as React.CSSProperties}
                        >
                          {st.glyph}
                        </span>
                        <span className="truncate">{c.label}</span>
                        <span className="text-slate-400">({c.count})</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-2 text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.has_contact}
                    onChange={(e) => update({ has_contact: e.target.checked })}
                    className="rounded border-line-200 text-forest-700 focus:ring-forest-700"
                  />
                  <span>Punya kontak / situs bersumber</span>
                </label>
                <label className="flex items-center gap-2 text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.open_public}
                    onChange={(e) => update({ open_public: e.target.checked })}
                    className="rounded border-line-200 text-forest-700 focus:ring-forest-700"
                  />
                  <span>Terbuka untuk umum (menurut sumber)</span>
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ---------- 3. DAFTAR TERORGANISIR DI BAWAH PETA ---------- */}
      <div className="space-y-4">
        {/* Header Daftar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-200 pb-3">
          <div className="flex items-center gap-2">
            <ListIcon aria-hidden className="h-5 w-5 text-forest-700" />
            <h3 className="font-serif text-xl font-bold text-forest-900">
              Daftar Perguruan & Lokasi
            </h3>
            {list && (
              <span className="rounded-full bg-parchment-100 border border-line-200 px-2.5 py-0.5 text-xs font-semibold text-chocolate-700">
                {list.total}
              </span>
            )}
          </div>

          {/* Cakupan daftar (viewport / all) */}
          <div
            role="radiogroup"
            aria-label="Cakupan daftar"
            className="flex rounded-xl border border-line-200 bg-paper-50 p-1 text-xs"
          >
            {(["viewport", "all"] as const).map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={listScope === s}
                onClick={() => setListScope(s)}
                className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                  listScope === s
                    ? "bg-forest-700 text-paper-50 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {s === "viewport" ? "Di area peta" : "Semua hasil"}
              </button>
            ))}
          </div>
        </div>

        {/* Konten Grid Kartu Perguruan / Padepokan */}
        {!list ? (
          <div className="rounded-2xl border border-line-200 bg-paper-50 p-8 text-center text-sm text-slate-600">
            Memuat daftar lokasi…
          </div>
        ) : list.total === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-200 bg-paper-50 p-8 text-center text-sm">
            <p className="font-semibold text-slate-800">Belum ada lokasi yang terdata untuk saringan ini.</p>
            <p className="mt-1 text-slate-600 max-w-md mx-auto">
              Direktori ini masih bertumbuh. Jika Anda mengetahui tempat latihan di wilayah ini,{" "}
              <Link className="text-forest-700 font-medium underline underline-offset-2 hover:text-forest-900" href="/community/kirim-tempat">
                kirimkan informasinya
              </Link>.
            </p>
          </div>
        ) : (
          <ul
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${
              busy ? "opacity-70" : ""
            }`}
            aria-busy={busy}
          >
            {list.items.map((place) => (
              <PlaceCard
                key={place.slug}
                place={place}
                isExpanded={!!expandedSlugs[place.slug]}
                onToggleExpand={() => toggleExpand(place.slug)}
                onFocusMap={() => focusPlace(place)}
              />
            ))}
          </ul>
        )}

        {list && list.total > list.items.length && (
          <p className="text-center text-xs text-slate-500 pt-2">
            Menampilkan {list.items.length} dari {list.total} tempat. Perbesar peta atau persempit saringan untuk melihat titik lainnya.
          </p>
        )}
      </div>
    </section>
  );
}

interface PlaceCardProps {
  place: PlaceSummary;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onFocusMap: () => void;
}

function PlaceCard({ place, isExpanded, onToggleExpand, onFocusMap }: PlaceCardProps) {
  const st = safeStyleOf(place.category);
  const isConfirmed = place.operational_status === "active_confirmed" || place.source_count >= 2;
  const isClosed = place.operational_status === "closed";
  const locationText = [shortRegion(place.regency), place.province].filter(Boolean).join(", ");

  return (
    <li className="flex flex-col justify-between rounded-2xl border border-line-200 bg-paper-50 p-4 shadow-xs transition-shadow hover:shadow-md">
      <div>
        {/* Header Kartu: Chip Tradisi / Gaya & Badge Verifikasi */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          {/* Chip Kategori / Aliran Tradisi */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-2xs">
            <span
              aria-hidden
              className={`sil-pin sil-pin--sm ${place.precision !== "exact" ? "sil-pin--area" : ""}`}
              style={{ "--pin": st.color } as React.CSSProperties}
            >
              {st.glyph}
            </span>
            <span className="truncate max-w-[130px]">{place.category_label}</span>
          </span>

          {/* Badge Verifikasi */}
          {isClosed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-clay-600/30 bg-clay-600/10 px-2 py-0.5 text-[11px] font-medium text-clay-700">
              Tutup
            </span>
          ) : isConfirmed ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-forest-700/25 bg-forest-700/10 px-2 py-0.5 text-[11px] font-medium text-forest-800">
              <BadgeCheck className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              <span>Terverifikasi</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-600/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <Clock className="h-3 w-3 text-amber-700" aria-hidden />
              <span>Belum terverifikasi</span>
            </span>
          )}
        </div>

        {/* Nama Tempat */}
        <h4 className="font-serif text-base font-semibold leading-snug text-slate-900 mb-1">
          <Link
            href={`/community/tempat/${place.slug}`}
            className="hover:text-forest-700 hover:underline underline-offset-2"
          >
            {place.name}
          </Link>
        </h4>

        {/* Organisasi / Induk */}
        {place.organization && (
          <p className="text-xs font-medium text-chocolate-700 mb-1 truncate">
            {place.organization.short_name ?? place.organization.name}
          </p>
        )}

        {/* Kota / Wilayah */}
        <p className="flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
          <span className="truncate">{locationText || "Wilayah belum tercatat"}</span>
          {place.distance_km !== undefined && (
            <span className="shrink-0 font-medium text-forest-800"> · ±{place.distance_km} km</span>
          )}
        </p>

        {/* Bagian Rincian Lengkap (Hanya tampil saat tombol expand ditekan) */}
        {isExpanded && (
          <div className="mt-3 space-y-2.5 border-t border-line-200 pt-3 text-xs text-slate-700 animate-in fade-in duration-150">
            {/* 1. Alamat Lengkap */}
            <div>
              <span className="font-semibold text-slate-900 block mb-0.5">Alamat lengkap:</span>
              <p className="text-slate-600 leading-relaxed">
                {place.address || place.locality_text || [place.district, shortRegion(place.regency), place.province].filter(Boolean).join(", ") || "Alamat rinci belum dicatat dalam sumber."}
              </p>
            </div>

            {/* 2. Kontak, Situs, Jadwal, & Keterangan */}
            <div className="rounded-xl border border-line-200/80 bg-slate-50/80 p-2.5 space-y-1.5">
              {place.website && (
                <div className="flex items-center gap-1.5 truncate">
                  <ExternalLink className="h-3.5 w-3.5 text-forest-700 shrink-0" aria-hidden />
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forest-700 underline underline-offset-2 truncate hover:text-forest-900"
                  >
                    {place.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-chocolate-700 shrink-0" aria-hidden />
                <span>{place.has_contact ? "Kontak resmi tercatat" : "Kontak belum tercatat dalam sumber"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" aria-hidden />
                <span>{place.has_schedule ? "Jadwal latihan tersedia" : "Jadwal belum tercatat"}</span>
              </div>

              {place.is_training_location && (
                <p className="text-[11px] text-slate-600 pl-5">
                  • Tempat latihan pencak silat aktif
                </p>
              )}
              {place.is_organization_office && (
                <p className="text-[11px] text-slate-600 pl-5">
                  • Kantor / sekretariat organisasi
                </p>
              )}
            </div>

            {/* 3. Detail Verifikasi & Sumber */}
            <div>
              <span className="font-semibold text-slate-900 block mb-0.5">Detail verifikasi & sumber:</span>
              <p className="text-slate-600">
                Presisi: <span className="font-medium text-slate-800">{place.precision_label}</span>
                {place.precision !== "exact" && " (penanda tingkat kabupaten/kota)"}
              </p>
              <p className="text-slate-600">
                Sumber: {place.source_count} tercatat ({place.source_types.length ? place.source_types.join(", ") : "Umum"})
              </p>
              {place.attribution && (
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  {place.attribution}
                </p>
              )}
            </div>

            {/* 4. Tautan Aksi */}
            <div className="pt-1 flex items-center justify-between border-t border-line-200">
              <Link
                href={`/community/tempat/${place.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-900"
              >
                <span>Halaman tempat</span>
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={onFocusMap}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-forest-700"
              >
                <MapPin className="h-3 w-3" />
                Lihat di peta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Kartu: Tombol Toggle Lihat Lengkap / Ringkas & Pusatkan Peta */}
      <div className="mt-3 pt-3 border-t border-line-200 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-parchment-100 hover:text-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              <span>Ringkas</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              <span>Lihat lengkap</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onFocusMap}
          className="inline-flex items-center justify-center rounded-xl p-1.5 text-slate-500 hover:bg-parchment-100 hover:text-forest-700 transition-colors"
          aria-label={`Tampilkan ${place.name} di peta`}
          title="Pusatkan di peta"
        >
          <MapPin aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function Legend() {
  const groups = new Map<string, { color: string; glyph: string }>();
  for (const k of ["perguruan_center", "perguruan_branch", "padepokan", "training_center", "ipsi", "organization_office", "campus_unit", "community", "sports_venue", "cultural_center"]) {
    const s = safeStyleOf(k);
    if (!groups.has(s.group)) groups.set(s.group, s);
  }
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Keterangan penanda">
      {[...groups.entries()].map(([g, s]) => (
        <span key={g} className="inline-flex items-center gap-1"><span aria-hidden className="sil-pin sil-pin--sm" style={{ "--pin": s.color } as React.CSSProperties}>{s.glyph}</span>{g}</span>
      ))}
      <span className="inline-flex items-center gap-1"><span aria-hidden className="sil-pin sil-pin--sm sil-pin--area" style={{ "--pin": "#52605a" } as React.CSSProperties}>•</span>Tingkat wilayah (alamat belum terdata)</span>
    </div>
  );
}