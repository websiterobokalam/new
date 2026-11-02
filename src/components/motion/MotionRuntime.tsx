"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * One small runtime for the whole motion system (about 2 KB gzipped).
 * Everything it does is progressive: with JS off or reduced motion, content
 * is fully visible and static. It only ever animates transform and opacity
 * (CSS handles stroke-dashoffset).
 */
export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    // 1. Power on sections when they enter the viewport (once).
    const powerIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.on = "true";
            e.target.dispatchEvent(new CustomEvent("rk:power", { bubbles: true }));
            powerIO.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    document.querySelectorAll<HTMLElement>("[data-power]:not([data-on='true'])").forEach((el, i) => {
      el.querySelectorAll<HTMLElement>("[data-stagger]").forEach((c, j) => c.style.setProperty("--i", String(j)));
      // Anything already on screen at load powers on immediately.
      powerIO.observe(el);
      void i;
    });
    cleanups.push(() => powerIO.disconnect());

    // 2. Pause anything off-screen.
    const scopeIO = new IntersectionObserver((entries) => {
      for (const e of entries) (e.target as HTMLElement).dataset.offscreen = String(!e.isIntersecting);
    });
    document.querySelectorAll("[data-anim-scope]").forEach((el) => scopeIO.observe(el));
    cleanups.push(() => scopeIO.disconnect());

    if (!reduced && fine) {
      // 3. Magnetic buttons.
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = (ev.clientX - (r.left + r.width / 2)) * 0.18;
          const y = (ev.clientY - (r.top + r.height / 2)) * 0.25;
          el.style.transform = `translate(${x}px, ${y}px)`;
        };
        const leave = () => (el.style.transform = "");
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });

      // 4. Card tilt.
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        const move = (ev: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
        };
        const leave = () => (el.style.transform = "");
        el.style.transition = "transform .35s cubic-bezier(.22,1,.36,1)";
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });

      // 5. Soft cursor glow (desktop only).
      const glow = document.createElement("div");
      glow.setAttribute("aria-hidden", "true");
      glow.style.cssText =
        "position:fixed;left:0;top:0;width:420px;height:420px;margin:-210px 0 0 -210px;border-radius:50%;pointer-events:none;z-index:1;background:radial-gradient(circle,rgba(0,203,214,.10),transparent 65%);transition:opacity .3s;opacity:0;will-change:transform";
      document.body.appendChild(glow);
      let raf = 0;
      const onMove = (e: PointerEvent) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          glow.style.opacity = "1";
          glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        });
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => { window.removeEventListener("pointermove", onMove); glow.remove(); });
    }

    return () => cleanups.forEach((f) => f());
  }, [pathname]);

  return null;
}
