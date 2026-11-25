"use client";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, RotateCw, Rotate3d } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type * as THREE_NS from "three";
import { clipPhaseAt, type ClipMeta, type ViewKey, VIEW_LABEL, viewCamera } from "@/lib/character";

const SPEEDS = [0.25, 0.5, 1, 1.5] as const;
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => { const m = window.matchMedia(RM); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const MODEL_URL = "/api/v1/research/character/model.glb";

type Loaded = { gltf: { scene: THREE_NS.Group; animations: THREE_NS.AnimationClip[] }; THREE: typeof THREE_NS; SkeletonUtils: { clone: (o: THREE_NS.Object3D) => THREE_NS.Object3D } };
let modelPromise: Promise<Loaded> | null = null;

/** Satu unduhan GLB untuk semua pemutar di halaman; tiap pemutar memakai salinan rig (SkeletonUtils.clone). */
function loadModel(): Promise<Loaded> {
  modelPromise ??= (async () => {
    const [THREE, { GLTFLoader }, SkeletonUtils] = await Promise.all([
      import("three"), import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/utils/SkeletonUtils.js"),
    ]);
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    return { gltf: gltf as unknown as Loaded["gltf"], THREE, SkeletonUtils: SkeletonUtils as unknown as Loaded["SkeletonUtils"] };
  })();
  modelPromise.catch(() => { modelPromise = null; });
  return modelPromise;
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export function Movement3DPlayer({
  clip,
  title,
  fallback,
  variant = "default",
}: {
  clip: ClipMeta;
  title: string;
  fallback?: React.ReactNode;
  variant?: "default" | "hero";
}) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const reducedMotion = useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const playing = choice ?? !reducedMotion;
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [view, setView] = useState<ViewKey>(clip.view_recommendation === "samping" ? "side" : "front");
  const [orbit, setOrbit] = useState(false);
  const [time, setTime] = useState(0);
  const api = useRef<{
    seek: (t: number) => void; setPaused: (p: boolean) => void; setSpeed: (s: number) => void;
    setView: (v: ViewKey) => void; setOrbit: (o: boolean) => void; resetCamera: () => void;
  } | null>(null);

  // muat saat pemutar terlihat (hemat data pada halaman panjang)
  useEffect(() => {
    const el = host.current;
    if (!el || state !== "idle") return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); setState(webglAvailable() ? "loading" : "error"); } }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [state]);

  // Scene dibuat SEKALI saat status "loading" dan hanya dibongkar saat komponen dilepas / klip berganti.
  // (Jangan memasukkan `state` ke dependensi: perubahan ke "ready" akan membongkar scene yang baru dibuat.)
  const startedFor = useRef<string | null>(null);
  const teardown = useRef<(() => void) | null>(null);
  useEffect(() => () => { teardown.current?.(); teardown.current = null; startedFor.current = null; }, [clip.clip]);
  useEffect(() => {
    if (state !== "loading" || startedFor.current === clip.clip) return;
    startedFor.current = clip.clip;
    const el = host.current!;
    let disposed = false;
    let raf = 0;
    let cleanup: (() => void) | null = null;
    teardown.current = () => { disposed = true; cleanup?.(); api.current = null; };
    loadModel().then(async ({ gltf, THREE, SkeletonUtils }) => {
      if (disposed) return;
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const source = gltf.animations.find((a) => a.name === clip.clip);
      if (!source) throw new Error("klip tidak ada");
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f6f2e9");
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", `Peraga 3D gerakan ${title}`);
      renderer.domElement.style.touchAction = "none";
      el.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 40);
      scene.add(new THREE.HemisphereLight("#fffaf0", "#b8a98f", 1.4));
      const key = new THREE.DirectionalLight("#ffffff", 2.1);
      key.position.set(2.2, 4, 3);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.2, bottom: -0.5, near: 0.5, far: 10 });
      scene.add(key);
      const rim = new THREE.DirectionalLight("#cfe0d6", 0.8);
      rim.position.set(-3, 2.5, -2.5);
      scene.add(rim);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.MeshStandardMaterial({ color: "#e9e3d6", roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);
      const rings = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.56, 64), new THREE.MeshBasicMaterial({ color: "#cfc6b4" }));
      rings.rotation.x = -Math.PI / 2;
      rings.position.y = 0.001;
      scene.add(rings);

      const model = SkeletonUtils.clone(gltf.scene);
      model.traverse((o) => {
        const m = o as THREE_NS.Mesh;
        if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; }
      });
      scene.add(model);
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(source);
      action.setLoop(THREE.LoopRepeat, Infinity).play();

      // kamera mengarah ke pusat badan karakter; gerak pindah (root motion) kecil sehingga sasaran tetap
      const target = new THREE.Vector3(0, 0.9, 0);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(target);
      controls.enableDamping = true;
      controls.minDistance = 1.2;
      controls.maxDistance = 9;
      controls.maxPolarAngle = Math.PI * 0.53;
      controls.autoRotateSpeed = 2.2;
      const place = (v: ViewKey) => {
        const p = viewCamera(v);
        camera.position.set(target.x + p[0], p[1], target.z + p[2]);
        controls.target.copy(target);
        controls.update();
      };
      place(view);

      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const clock = new THREE.Clock();
      let lastUi = 0;
      let visible = true;
      const vis = new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); }, {});
      vis.observe(el);
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.1);
        if (!visible || document.hidden) return;
        mixer.update(dt);
        controls.update();
        renderer.render(scene, camera);
        const now = performance.now();
        if (now - lastUi > 120) { lastUi = now; setTime(action.time); }
      };
      loop();

      api.current = {
        seek: (t) => { action.time = Math.max(0, Math.min(t, source.duration - 1e-3)); mixer.update(0); setTime(action.time); },
        setPaused: (p) => { action.paused = p; },
        setSpeed: (s) => { action.timeScale = s; },
        setView: (v) => { controls.autoRotate = false; place(v); },
        setOrbit: (o) => { controls.autoRotate = o; },
        resetCamera: () => place(view),
      };
      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        vis.disconnect();
        controls.dispose();
        mixer.stopAllAction();
        scene.traverse((o) => {
          const m = o as THREE_NS.Mesh;
          if (m.isMesh && (m.geometry !== undefined) && !(m as unknown as { isSkinnedMesh?: boolean }).isSkinnedMesh) m.geometry.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
      else setState("ready");
    }).catch(() => { if (!disposed) setState("error"); });
    // view/title sengaja tidak menjadi dependensi: perubahan tampilan lewat api.current
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, clip.clip]);

  useEffect(() => { api.current?.setPaused(!playing); }, [playing, state]);
  useEffect(() => { api.current?.setSpeed(speed); }, [speed, state]);
  useEffect(() => { api.current?.setOrbit(orbit); }, [orbit, state]);

  const changeView = useCallback((v: ViewKey) => { setView(v); setOrbit(false); api.current?.setView(v); }, []);
  const phase = clipPhaseAt(clip, time);
  const phaseIdx = phase ? clip.phases.indexOf(phase) : -1;
  const goPhase = (d: number) => {
    const i = Math.min(clip.phases.length - 1, Math.max(0, (phaseIdx < 0 ? 0 : phaseIdx) + d));
    api.current?.seek(clip.phases[i].start + 0.01);
  };

  if (state === "error") {
    return (
      <div>
        {fallback}
        <p className="mt-2 text-xs text-slate-600">Peraga 3D tidak dapat ditampilkan di perangkat ini; ilustrasi 2D ditampilkan.</p>
      </div>
    );
  }
  const hero = variant === "hero";
  const btnBase = hero
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors disabled:opacity-50"
    : "inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-2.5 text-sm disabled:opacity-50";
  const btn = `${btnBase} border-line-200 bg-paper-50 text-slate-700 hover:bg-parchment-100`;
  const btnOn = `${btnBase} border-forest-700 bg-forest-700 text-paper-50 hover:bg-forest-900`;
  const ready = state === "ready";
  return (
    <figure className={`overflow-hidden border ${hero ? "rounded-[20px] border-slate-200/80 bg-white" : "rounded-xl border-line-200 bg-paper-50"}`}>
      <div
        ref={host}
        className={`relative w-full bg-parchment-100 ${hero ? "aspect-[4/3] max-h-[520px] sm:aspect-[16/10]" : "aspect-[4/5]"}`}
        data-state={state}
        data-testid="movement-3d"
      >
        {!ready && <div className="absolute inset-0 grid place-items-center text-sm text-slate-600">Memuat peraga 3D…</div>}
        {ready && phase && (
          <div aria-live="polite" className={`pointer-events-none absolute left-3 top-3 max-w-[85%] rounded-full bg-paper-50/92 px-3 py-1.5 text-xs shadow-sm backdrop-blur-xs ${hero ? "border border-slate-200/70" : "rounded-lg left-2 top-2 px-2.5"}`}>
            <span className="font-semibold text-forest-900">{phase.label}</span>{phase.caption ? <span className="text-slate-600"> · {phase.caption}</span> : null}
          </div>
        )}
      </div>
      <div className={hero ? "space-y-3 bg-white p-4 sm:p-5" : "space-y-2 p-2.5"}>
        {/* linimasa + penanda fase */}
        <div className="relative h-6" role="group" aria-label="Linimasa gerakan">
          <div className="absolute inset-x-0 top-2.5 h-1.5 rounded-full bg-line-200" />
          <div className="absolute left-0 top-2.5 h-1.5 rounded-full bg-forest-700" style={{ width: `${(time / clip.duration_s) * 100}%` }} />
          {clip.phases.map((p, i) => (
            <button key={`${p.keyframe}-${i}`} type="button" disabled={!ready} onClick={() => api.current?.seek(p.start + 0.01)}
              className={`absolute top-0 h-6 w-3 -translate-x-1/2 rounded ${phase === p ? "bg-bronze-500" : "bg-transparent"} after:absolute after:left-1/2 after:top-1.5 after:h-3 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-forest-900`}
              style={{ left: `${(p.start / clip.duration_s) * 100}%` }} aria-label={`Ke fase ${i + 1}: ${p.label}`} title={p.label ?? undefined} />
          ))}
        </div>
        <div className={hero ? "flex flex-wrap items-center justify-between gap-3" : "space-y-2"}>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className={btn} disabled={!ready} onClick={() => setChoice(!playing)} aria-label={playing ? "Jeda" : "Putar"}>
              {playing ? <Pause aria-hidden className="h-4 w-4" /> : <Play aria-hidden className="h-4 w-4" />}
            </button>
            <button type="button" className={btn} disabled={!ready} onClick={() => { api.current?.seek(0); setChoice(true); }} aria-label="Putar ulang"><RotateCcw aria-hidden className="h-4 w-4" /></button>
            <button type="button" className={btn} disabled={!ready} onClick={() => goPhase(-1)} aria-label="Fase sebelumnya"><ChevronLeft aria-hidden className="h-4 w-4" /></button>
            <button type="button" className={btn} disabled={!ready} onClick={() => goPhase(1)} aria-label="Fase berikutnya"><ChevronRight aria-hidden className="h-4 w-4" /></button>
            <label className="sr-only" htmlFor={`spd-${clip.clip}`}>Kecepatan</label>
            <select id={`spd-${clip.clip}`} className={`h-9 border border-line-200 bg-paper-50 px-2.5 text-sm font-medium text-slate-700 ${hero ? "rounded-full" : "rounded-lg"}`} value={speed} disabled={!ready}
              onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}>
              {SPEEDS.map((s) => <option key={s} value={s}>{String(s).replace(".", ",")}×</option>)}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sudut pandang">
            {(["front", "side", "three_quarter"] as ViewKey[]).map((v) => (
              <button key={v} type="button" className={view === v && !orbit ? btnOn : btn}
                aria-pressed={view === v && !orbit} disabled={!ready} onClick={() => changeView(v)}>{VIEW_LABEL[v]}</button>
            ))}
            <button type="button" className={orbit ? btnOn : btn} aria-pressed={orbit}
              disabled={!ready} onClick={() => setOrbit(!orbit)}><Rotate3d aria-hidden className="h-4 w-4" />360°</button>
            <button type="button" className={btn} disabled={!ready} onClick={() => api.current?.resetCamera()} aria-label="Atur ulang kamera"><RotateCw aria-hidden className="h-4 w-4" /></button>
          </div>
        </div>
        <figcaption className={`text-xs text-slate-500 ${hero ? "border-t border-slate-100 pt-2.5 text-center sm:text-left" : "text-slate-600"}`}>
          Seret untuk memutar, cubit atau gulir untuk memperbesar. Fase {phaseIdx >= 0 ? phaseIdx + 1 : 1} dari {clip.phases.length}.
        </figcaption>
      </div>
    </figure>
  );
}
