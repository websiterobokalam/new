import {
  ACESFilmicToneMapping, BoxGeometry, CircleGeometry, Clock, DirectionalLight, Group, HemisphereLight, IcosahedronGeometry,
  MathUtils, Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera, PlaneGeometry, PointLight,
  Scene, SphereGeometry, SRGBColorSpace, TextureLoader, TorusGeometry, WebGLRenderer, type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * The home hero in 3D: the Robokalam mascot standing in space inside two tilted
 * orbits that carry gears, cubes, gems and code blocks, passing in front of and
 * behind it. The mascot leans towards the pointer, floats, turns as you scroll,
 * and does a happy hop when tapped.
 *
 * Loaded lazily (never in the first-load JavaScript), only with WebGL, on
 * wider screens and without reduced motion. Pauses off screen and in hidden tabs.
 */

const BRAND = { blue: 0x0098d6, teal: 0x00cbd6, sun: 0xffd31d, lime: 0x7dc242, purple: 0x7c3aed, pink: 0xff8fb1 };

export function mountRobotScene(host: HTMLElement, opts: { onReady?: () => void } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "robot-canvas";
  host.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.35, 9.2);

  scene.add(new HemisphereLight(0xd8f6ff, 0x0b2233, 1.4));
  const key = new DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rim = new PointLight(BRAND.teal, 30, 12); rim.position.set(-3, 1.5, -2); scene.add(rim);

  const white = new MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.32, metalness: 0.05 });
  const blue = new MeshStandardMaterial({ color: BRAND.blue, roughness: 0.4, metalness: 0.1 });
  const lime = new MeshStandardMaterial({ color: BRAND.lime, roughness: 0.4, metalness: 0.1 });

  /* ---------- the mascot (the official artwork, on a plane in 3D space) ---------- */
  const bot = new Group();
  scene.add(bot);
  const MASCOT_H = 4.3, MASCOT_W = MASCOT_H * (967 / 1200);
  // Unlit, so the artwork keeps its exact colours; tone mapping off for the same reason.
  const mascotMat = new MeshBasicMaterial({ transparent: true, alphaTest: 0.04, toneMapped: false });
  bot.add(new Mesh(new PlaneGeometry(MASCOT_W, MASCOT_H), mascotMat));
  const halo = new Mesh(new CircleGeometry(1.9, 64), new MeshBasicMaterial({ color: BRAND.teal, transparent: true, opacity: 0.18, depthWrite: false }));
  halo.position.set(0, 0.3, -0.4); bot.add(halo);
  const shadow = new Mesh(new CircleGeometry(1.1, 48), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.45; scene.add(shadow);

  /* ---------- orbits with little things on them ---------- */
  const orbit = (radius: number, tiltX: number, tiltZ: number, items: Mesh[]) => {
    const g = new Group();
    g.rotation.set(tiltX, 0, tiltZ);
    const ring = new Mesh(new TorusGeometry(radius, 0.018, 8, 160), new MeshBasicMaterial({ color: BRAND.teal, transparent: true, opacity: 0.55 }));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const spin = new Group();
    g.add(spin);
    items.forEach((m, i) => {
      const a = (i / items.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      spin.add(m);
    });
    scene.add(g);
    return { g, spin, items };
  };
  const gear = (color = BRAND.sun) => {
    const mat = new MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
    const m = new Mesh(new TorusGeometry(0.16, 0.07, 8, 20), mat);
    for (let i = 0; i < 8; i++) {
      const tooth = new Mesh(new BoxGeometry(0.07, 0.1, 0.1), mat);
      const a = (i / 8) * Math.PI * 2;
      tooth.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0); tooth.rotation.z = a;
      m.add(tooth);
    }
    return m;
  };
  const codeBlock = () => {
    const m = new Mesh(new RoundedBoxGeometry(0.46, 0.34, 0.08, 3, 0.05), white);
    const bar = new Mesh(new BoxGeometry(0.3, 0.04, 0.02), blue); bar.position.set(0, 0.06, 0.05); m.add(bar);
    const bar2 = new Mesh(new BoxGeometry(0.2, 0.04, 0.02), lime); bar2.position.set(-0.05, -0.04, 0.05); m.add(bar2);
    return m;
  };
  const inner = orbit(2.35, 0.32, -0.18, [
    gear(),
    new Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 3, 0.06), new MeshStandardMaterial({ color: BRAND.sun, roughness: 0.35 })),
    codeBlock(),
    new Mesh(new IcosahedronGeometry(0.2, 0), new MeshStandardMaterial({ color: BRAND.purple, roughness: 0.3, flatShading: true })),
  ]);
  const outer = orbit(3.1, -0.2, 0.22, [
    new Mesh(new SphereGeometry(0.16, 24, 24), blue),
    codeBlock(),
    new Mesh(new OctahedronGeometry(0.2, 0), new MeshStandardMaterial({ color: BRAND.lime, roughness: 0.3, flatShading: true })),
    gear(BRAND.teal),
    new Mesh(new SphereGeometry(0.12, 24, 24), new MeshStandardMaterial({ color: BRAND.pink, roughness: 0.5 })),
  ]);

  /* ---------- size, pointer, visibility ---------- */
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  const pointer = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = MathUtils.clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    pointer.y = MathUtils.clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const clock = new Clock();
  let hopAt = -10;
  const onTap = () => { hopAt = clock.elapsedTime; };
  host.addEventListener("pointerdown", onTap);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);

  let raf = 0;
  let ready = false;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!ready || !visible || document.hidden) { clock.getDelta(); return; }
    const t = clock.getElapsedTime();

    // scrolling turns the scene and pulls the camera back
    const scroll = Math.min(1, window.scrollY / 700);
    camera.position.z = 9.2 + scroll * 2.6;
    camera.position.y = 0.35 + scroll * 0.8;
    inner.g.rotation.x = 0.32 + scroll * 0.5;
    outer.g.rotation.x = -0.2 - scroll * 0.4;

    // float, lean towards the pointer, hop when tapped
    const sinceHop = t - hopAt;
    const hop = sinceHop < 0.7 ? Math.sin((sinceHop / 0.7) * Math.PI) * 0.7 : 0;
    const squash = sinceHop < 0.7 ? 1 + Math.sin((sinceHop / 0.7) * Math.PI * 2) * 0.05 : 1;
    bot.position.y = Math.sin(t * 1.4) * 0.12 + hop;
    bot.scale.set(1 / squash, squash, 1);
    bot.rotation.y = MathUtils.lerp(bot.rotation.y, pointer.x * 0.35 + scroll * 0.25, 0.06);
    bot.rotation.x = MathUtils.lerp(bot.rotation.x, pointer.y * 0.08, 0.06);
    bot.rotation.z = Math.sin(t * 0.9) * 0.025;
    shadow.scale.setScalar(1 - bot.position.y * 0.25);
    (halo.material as MeshBasicMaterial).opacity = 0.14 + Math.sin(t * 2) * 0.05;

    // orbits turn; their things tumble
    inner.spin.rotation.y = t * 0.45;
    outer.spin.rotation.y = -t * 0.3;
    for (const o of [inner, outer]) for (const m of o.items) { m.rotation.x += 0.012; m.rotation.y += 0.018; }

    renderer.render(scene, camera);
  };
  tick();

  // Show the canvas only once the mascot artwork has loaded.
  new TextureLoader().load("/brand/mascot.webp", (tex: Texture) => {
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    mascotMat.map = tex;
    mascotMat.needsUpdate = true;
    ready = true;
    requestAnimationFrame(() => opts.onReady?.());
  });

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    window.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerdown", onTap);
    scene.traverse((o) => {
      const m = o as Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as MeshStandardMaterial | MeshStandardMaterial[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { x.map?.dispose(); x.dispose(); });
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
