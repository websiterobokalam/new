"use client";
import { useEffect } from "react";

/**
 * A small globe of 0s and 1s that follows the pointer, after the binary globe
 * in the Robokalam logo. Digits on the front are larger and brighter ("bulged"),
 * the ones behind are smaller and fade into depth. It trails the pointer, spins
 * faster when you move quickly, and a few digits flip as it turns.
 *
 * Desktop pointers only; never on touch, with reduced motion, in the signed-in
 * app, or over text fields. It stops drawing when the pointer is still.
 */
const R = 30; // globe radius in CSS px
const SIZE = 132; // canvas size in CSS px
const N = 64; // digits on the globe
const COLOR = "0, 152, 214"; // Robokalam blue

export function CursorGlobe() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "cursor-globe";
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    wrap.appendChild(canvas);
    document.body.appendChild(wrap);
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Evenly spread points on a sphere (Fibonacci), each carrying a 0 or a 1.
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963229728653; // golden angle
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, d: Math.random() < 0.5 ? "0" : "1" };
    });

    const pos = { x: -200, y: -200 }, target = { x: -200, y: -200 };
    let angle = 0, spin = 0.6, last = performance.now(), raf = 0, idleSince = 0, visible = false, nextFlip = 0;

    const blocked = (el: Element | null) =>
      !!el?.closest("input, textarea, select, [contenteditable='true'], [data-app-shell], dialog[open], .pg-viewer");

    const show = (on: boolean) => {
      if (on === visible) return;
      visible = on;
      wrap.style.opacity = on ? "1" : "0";
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // trail the pointer
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      wrap.style.transform = `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0)`;
      // spin eases back to a calm turn
      spin += (0.6 - spin) * 0.04;
      angle += spin * dt;
      if (now > nextFlip) { pts[(Math.random() * N) | 0].d = Math.random() < 0.5 ? "0" : "1"; nextFlip = now + 140; }

      ctx.clearRect(0, 0, SIZE, SIZE);
      const c = SIZE / 2;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const tilt = 0.35, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const proj = pts.map((p) => {
        // rotate around Y, then tilt around X
        const x1 = p.x * cosA + p.z * sinA;
        const z1 = -p.x * sinA + p.z * cosA;
        const y2 = p.y * cosT - z1 * sinT;
        const z2 = p.y * sinT + z1 * cosT;
        const k = 2.6 / (2.6 - z2); // perspective: front (z2 → 1) bulges
        return { sx: c + x1 * R * k, sy: c + y2 * R * k, z: z2, k, d: p.d };
      }).sort((a, b) => a.z - b.z); // back first

      for (const p of proj) {
        const depth = (p.z + 1) / 2; // 0 back … 1 front
        ctx.font = `700 ${(5 + depth * 8) * (p.k / 1.6)}px ui-monospace, "JetBrains Mono", monospace`;
        ctx.fillStyle = `rgba(${COLOR}, ${0.12 + depth * 0.78})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.d, p.sx, p.sy);
      }

      if (now - idleSince > 1200 && Math.abs(target.x - pos.x) < 0.5 && Math.abs(target.y - pos.y) < 0.5) { raf = 0; return; }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - target.x, dy = e.clientY - target.y;
      if (target.x > -100) spin = Math.min(5, spin + Math.hypot(dx, dy) * 0.02);
      target.x = e.clientX; target.y = e.clientY;
      if (pos.x < -100) { pos.x = target.x; pos.y = target.y; }
      idleSince = performance.now();
      show(!blocked(e.target as Element));
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
    };
    const onLeave = () => show(false);
    const onFocus = (e: FocusEvent) => { if (blocked(e.target as Element)) show(false); };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("focusin", onFocus);
      wrap.remove();
    };
  }, []);
  return null;
}
