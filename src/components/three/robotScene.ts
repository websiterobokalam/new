import {
  ACESFilmicToneMapping, CanvasTexture, CapsuleGeometry, CircleGeometry, Clock, Color, CylinderGeometry, DirectionalLight,
  Group, HemisphereLight, IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry,
  PerspectiveCamera, PointLight, Scene, SphereGeometry, SRGBColorSpace, TorusGeometry, BoxGeometry, WebGLRenderer, MathUtils,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * "Kalam-bot": Robokalam's 3D mascot for the home hero. A friendly floating
 * robot with a screen face (big blinking eyes that follow the pointer), a glowing
 * antenna and a waving arm, inside two tilted orbit rings carrying gears, cubes,
 * gems and code blocks. Tap it and it does a happy spin.
 *
 * Loaded lazily (never part of the first-load JavaScript), only on devices that
 * can run WebGL and when the visitor hasn't asked for reduced motion. It pauses
 * when off screen or when the tab is hidden.
 */

const BRAND = { blue: 0x0098d6, teal: 0x00cbd6, sun: 0xffd31d, deep: 0x00445f, ink: 0x04202f, pink: 0xff8fb1, purple: 0x7c3aed };

type Mood = "normal" | "happy";

/** The face is a little screen: drawn on a 2D canvas and used as a texture. */
function makeFace() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 320;
  const g = c.getContext("2d")!;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const draw = (look: { x: number; y: number }, blink: number, mood: Mood) => {
    g.clearRect(0, 0, c.width, c.height);
    // screen
    const grd = g.createLinearGradient(0, 0, 0, c.height);
    grd.addColorStop(0, "#0b2a3d"); grd.addColorStop(1, "#04202F");
    g.fillStyle = grd;
    g.beginPath(); g.roundRect(0, 0, c.width, c.height, 90); g.fill();
    // eyes
    const ex = look.x * 26, ey = look.y * 16;
    g.fillStyle = "#5FF3FF";
    g.shadowColor = "#00CBD6"; g.shadowBlur = 36;
    for (const cx of [170, 342]) {
      if (mood === "happy") {
        g.lineWidth = 22; g.lineCap = "round"; g.strokeStyle = "#5FF3FF";
        g.beginPath(); g.arc(cx + ex, 165 + ey, 44, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      } else {
        const h = Math.max(8, 104 * (1 - blink));
        g.beginPath(); g.roundRect(cx - 40 + ex, 150 - h / 2 + ey, 80, h, 40); g.fill();
      }
    }
    g.shadowBlur = 0;
    // eye shine
    if (mood !== "happy" && blink < 0.5) {
      g.fillStyle = "rgba(255,255,255,.9)";
      for (const cx of [170, 342]) { g.beginPath(); g.arc(cx + 14 + ex, 128 + ey, 12, 0, Math.PI * 2); g.fill(); }
    }
    // smile
    g.strokeStyle = "#5FF3FF"; g.lineWidth = 14; g.lineCap = "round";
    g.beginPath(); g.arc(256 + ex * 0.5, 228 + ey * 0.5, mood === "happy" ? 40 : 26, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

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

  scene.add(new HemisphereLight(0xd8f6ff, 0x0b2233, 1.35));
  const key = new DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 6); scene.add(key);
  const rim = new PointLight(BRAND.teal, 30, 12); rim.position.set(-3, 1.5, -2); scene.add(rim);
  const warm = new PointLight(BRAND.sun, 10, 8); warm.position.set(2.5, -1.5, 3); scene.add(warm);

  const white = new MeshStandardMaterial({ color: 0xf4fbff, roughness: 0.32, metalness: 0.05 });
  const cyan = new MeshStandardMaterial({ color: BRAND.teal, roughness: 0.35, metalness: 0.1 });
  const blue = new MeshStandardMaterial({ color: BRAND.blue, roughness: 0.4, metalness: 0.1 });
  const pink = new MeshStandardMaterial({ color: BRAND.pink, roughness: 0.6, transparent: true, opacity: 0.85 });
  const glow = new MeshStandardMaterial({ color: BRAND.sun, emissive: new Color(BRAND.sun), emissiveIntensity: 1.6, roughness: 0.3 });

  /* ---------- the robot ---------- */
  const bot = new Group();
  scene.add(bot);

  const head = new Group();
  head.position.y = 0.95;
  bot.add(head);
  head.add(new Mesh(new RoundedBoxGeometry(2.2, 1.65, 1.6, 6, 0.48), white));
  const face = makeFace();
  const screen = new Mesh(new RoundedBoxGeometry(1.76, 1.12, 0.1, 4, 0.05), new MeshStandardMaterial({ map: face.tex, roughness: 0.25, emissive: new Color(0xffffff), emissiveMap: face.tex, emissiveIntensity: 0.55 }));
  screen.position.set(0, -0.02, 0.78);
  head.add(screen);
  for (const s of [-1, 1]) {
    const ear = new Mesh(new CylinderGeometry(0.26, 0.26, 0.22, 32), cyan);
    ear.rotation.z = Math.PI / 2; ear.position.set(s * 1.16, 0, 0); head.add(ear);
    // rosy cheeks, just below the screen
    const cheek = new Mesh(new CircleGeometry(0.11, 24), pink);
    cheek.scale.set(1.3, 0.8, 1);
    cheek.position.set(s * 0.62, -0.66, 0.805); head.add(cheek);
  }
  const antenna = new Group();
  antenna.position.y = 0.82;
  head.add(antenna);
  const stalk = new Mesh(new CylinderGeometry(0.05, 0.05, 0.5, 12), blue); stalk.position.y = 0.25; antenna.add(stalk);
  const bulb = new Mesh(new SphereGeometry(0.17, 24, 24), glow); bulb.position.y = 0.56; antenna.add(bulb);
  const bulbLight = new PointLight(BRAND.sun, 4, 3); bulbLight.position.y = 0.56; antenna.add(bulbLight);

  const body = new Mesh(new RoundedBoxGeometry(1.5, 1.15, 1.15, 6, 0.42), white);
  body.position.y = -0.5;
  bot.add(body);
  const belly = new Mesh(new RoundedBoxGeometry(0.8, 0.5, 0.08, 4, 0.12), cyan);
  belly.position.set(0, -0.48, 0.58);
  bot.add(belly);
  const heart = new Mesh(new SphereGeometry(0.1, 16, 16), glow); heart.position.set(0, -0.48, 0.64); bot.add(heart);

  const arm = (side: -1 | 1) => {
    const shoulder = new Group();
    shoulder.position.set(side * 0.9, -0.3, 0);
    const limb = new Mesh(new CapsuleGeometry(0.15, 0.55, 8, 16), white);
    limb.position.y = -0.36; shoulder.add(limb);
    const hand = new Mesh(new SphereGeometry(0.2, 24, 24), cyan); hand.position.y = -0.74; shoulder.add(hand);
    shoulder.rotation.z = side * 0.25;
    bot.add(shoulder);
    return shoulder;
  };
  const leftArm = arm(-1);
  const rightArm = arm(1);

  // a little jet glow under the body, and a soft shadow far below
  const jet = new Mesh(new CircleGeometry(0.42, 32), new MeshBasicMaterial({ color: BRAND.teal, transparent: true, opacity: 0.55 }));
  jet.rotation.x = -Math.PI / 2; jet.position.y = -1.12; bot.add(jet);
  const shadow = new Mesh(new CircleGeometry(1.1, 48), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.25; scene.add(shadow);

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
  const gear = () => {
    const m = new Mesh(new TorusGeometry(0.16, 0.07, 8, 20), new MeshStandardMaterial({ color: BRAND.sun, roughness: 0.4, metalness: 0.2 }));
    for (let i = 0; i < 8; i++) {
      const t = new Mesh(new BoxGeometry(0.07, 0.1, 0.1), m.material);
      const a = (i / 8) * Math.PI * 2;
      t.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0); t.rotation.z = a;
      m.add(t);
    }
    return m;
  };
  const codeBlock = () => {
    const m = new Mesh(new RoundedBoxGeometry(0.46, 0.34, 0.08, 3, 0.05), white);
    const bar = new Mesh(new BoxGeometry(0.3, 0.04, 0.02), blue); bar.position.set(0, 0.06, 0.05); m.add(bar);
    const bar2 = new Mesh(new BoxGeometry(0.2, 0.04, 0.02), cyan); bar2.position.set(-0.05, -0.04, 0.05); m.add(bar2);
    return m;
  };
  const inner = orbit(2.25, 0.32, -0.18, [
    gear(),
    new Mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 3, 0.06), new MeshStandardMaterial({ color: BRAND.sun, roughness: 0.35 })),
    codeBlock(),
    new Mesh(new IcosahedronGeometry(0.2, 0), new MeshStandardMaterial({ color: BRAND.purple, roughness: 0.3, flatShading: true })),
  ]);
  const outer = orbit(3.0, -0.2, 0.22, [
    new Mesh(new SphereGeometry(0.16, 24, 24), blue),
    codeBlock(),
    new Mesh(new OctahedronGeometry(0.2, 0), new MeshStandardMaterial({ color: BRAND.teal, roughness: 0.3, flatShading: true })),
    gear(),
    new Mesh(new SphereGeometry(0.12, 24, 24), pink),
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
  const look = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = MathUtils.clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1);
    pointer.y = MathUtils.clamp((e.clientY / window.innerHeight) * 2 - 1, -1, 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let mood: Mood = "normal";
  let spinUntil = 0;
  const onTap = () => {
    mood = "happy";
    spinUntil = clock.elapsedTime + 1.2;
    setTimeout(() => { mood = "normal"; }, 1800);
  };
  host.addEventListener("pointerdown", onTap);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(host);

  const clock = new Clock();
  let raf = 0;
  let nextBlink = 2.5;
  let lastFace = "";
  let first = true;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const t = clock.getElapsedTime();

    // float, sway and follow the pointer; scrolling turns the bot and pulls the camera back
    const scroll = Math.min(1, window.scrollY / 700);
    camera.position.z = 9.2 + scroll * 2.6;
    camera.position.y = 0.35 + scroll * 0.8;
    inner.g.rotation.x = 0.32 + scroll * 0.5;
    outer.g.rotation.x = -0.2 - scroll * 0.4;
    bot.position.y = Math.sin(t * 1.4) * 0.14;
    const spinning = t < spinUntil;
    const targetY = spinning ? bot.rotation.y + 0.35 : pointer.x * 0.5 + scroll * 1.4;
    bot.rotation.y = spinning ? targetY : MathUtils.lerp(bot.rotation.y % (Math.PI * 2), targetY, 0.06);
    bot.rotation.x = MathUtils.lerp(bot.rotation.x, pointer.y * 0.12, 0.06);
    head.rotation.z = Math.sin(t * 0.9) * 0.05;
    look.x = MathUtils.lerp(look.x, pointer.x, 0.12);
    look.y = MathUtils.lerp(look.y, pointer.y, 0.12);

    // wave, antenna bob and glow
    rightArm.rotation.z = 2.55 + Math.sin(t * 6) * 0.3; // hand up, waving
    rightArm.rotation.x = -0.2;
    leftArm.rotation.z = -0.25 + Math.sin(t * 1.4 + 1) * 0.08;
    antenna.rotation.z = Math.sin(t * 2.2) * 0.12;
    (glow as MeshStandardMaterial).emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.6;
    jet.scale.setScalar(1 + Math.sin(t * 9) * 0.08);
    shadow.scale.setScalar(1 - bot.position.y * 0.25);

    // blink every few seconds (eyes close and open over 0.16s)
    let blink = 0;
    if (t >= nextBlink) {
      const p = (t - nextBlink) / 0.16;
      if (p >= 1) nextBlink = t + 2.5 + Math.random() * 3;
      else blink = 1 - Math.abs(p * 2 - 1);
    }
    // Redraw the face only when it visibly changes.
    const faceKey = `${look.x.toFixed(2)}:${look.y.toFixed(2)}:${blink.toFixed(2)}:${mood}`;
    if (faceKey !== lastFace) { face.draw(look, blink, mood); lastFace = faceKey; }

    // orbits turn; their things tumble
    inner.spin.rotation.y = t * 0.45;
    outer.spin.rotation.y = -t * 0.3;
    for (const o of [inner, outer]) for (const m of o.items) { m.rotation.x += 0.012; m.rotation.y += 0.018; }

    renderer.render(scene, camera);
    if (first) { first = false; opts.onReady?.(); }
  };
  tick();

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
