"use client";
import { useEffect } from "react";

const SELECTOR = "[data-tilt], .solution-card, .door-tile, .world-tile";

/**
 * Cards lean towards the pointer in 3D, with a soft glare. Mouse and pen only
 * (no effect on touch), and off when the visitor prefers reduced motion. One
 * delegated listener for the whole page; about 1 KB.
 */
export function TiltRuntime() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("tilt-on");
    let current: HTMLElement | null = null;
    let raf = 0;
    const reset = (el: HTMLElement) => { el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); el.removeAttribute("data-tilting"); };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        const max = el.matches("[data-tilt]") ? 8 : 6;
        el.style.setProperty("--ry", `${(x - 0.5) * 2 * max}deg`);
        el.style.setProperty("--rx", `${(0.5 - y) * 2 * max}deg`);
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
        el.setAttribute("data-tilting", "");
      });
    };
    const onLeave = () => { if (current) reset(current); current = null; };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => { document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); document.documentElement.classList.remove("tilt-on"); };
  }, []);
  return null;
}
