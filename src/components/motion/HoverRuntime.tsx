"use client";
import { useEffect } from "react";

/**
 * Small hover interactions, site-wide:
 * - Mono links and buttons scramble their letters for a moment, then settle back
 *   into the word (like a display resolving). The accessible name is fixed first,
 *   so screen readers never hear the scrambled letters.
 * - The pointer globe grows a little over anything clickable (see CursorGlobe).
 * Desktop pointers only; nothing happens with reduced motion.
 */
const GLYPHS = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ#/_<>";
const SELECTOR = ".nav-mono, .btn, .az-side, .mono-link";

function firstText(el: Element): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  return walker.nextNode() as Text | null;
}

export function HoverRuntime() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const running = new WeakMap<Element, number>();

    const scramble = (el: HTMLElement) => {
      const node = firstText(el);
      if (!node) return;
      const original = (node as Text & { __orig?: string }).__orig ?? node.textContent ?? "";
      (node as Text & { __orig?: string }).__orig = original;
      if (!el.hasAttribute("aria-label")) {
        const copy = el.cloneNode(true) as HTMLElement;
        copy.querySelectorAll("[aria-hidden='true']").forEach((n) => n.remove());
        el.setAttribute("aria-label", (copy.textContent ?? "").replace(/\s+/g, " ").trim());
      }
      cancelAnimationFrame(running.get(el) ?? 0);
      const start = performance.now(), dur = 380;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const settled = Math.floor(t * original.length);
        let out = "";
        for (let i = 0; i < original.length; i++) {
          const ch = original[i];
          out += i < settled || ch === " " || /[^\w]/.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        node.textContent = out;
        if (t < 1) running.set(el, requestAnimationFrame(step));
        else node.textContent = original;
      };
      running.set(el, requestAnimationFrame(step));
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest<HTMLElement>(SELECTOR);
      if (!el || el.contains(e.relatedTarget as Node)) return;
      scramble(el);
    };
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => document.removeEventListener("pointerover", onOver);
  }, []);
  return null;
}
