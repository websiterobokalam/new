"use client";
import { useEffect, useRef, useState } from "react";
import { KalamBot } from "../art/Small";

/**
 * THE KALAM LINE: one continuous SVG path that spans the page and is drawn by
 * scroll. It runs through nodes placed with <LineNode/>. On phones it runs
 * down the left edge. It is decorative (aria-hidden). With reduced motion it
 * is drawn fully and static. No pinning, no scroll hijacking.
 */
type Node = { x: number; y: number; el: HTMLElement; bot?: string };

const CURVE = 110;

export function KalamLineScope({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ d: string; w: number; h: number; nodes: Node[] } | null>(null);
  const [mood, setMood] = useState<"idle" | "wave">("idle");

  // Build the path from node positions; rebuild on resize.
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const build = () => {
      const r = root.getBoundingClientRect();
      const w = r.width;
      const mobile = w < 768;
      const gutter = mobile ? 14 : Math.max(18, (w - 1216) / 2 + 12);
      const nodes: Node[] = Array.from(root.querySelectorAll<HTMLElement>("[data-line-node]")).map((el) => {
        const b = el.getBoundingClientRect();
        const pos = el.dataset.x;
        const x = mobile || pos === "gutter" ? gutter : pos === "center" ? w / 2 : gutter;
        return { x, y: b.top - r.top, el, bot: el.dataset.bot };
      });
      if (nodes.length < 2) return;
      let d = `M ${nodes[0].x} ${nodes[0].y}`;
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i - 1];
        const b = nodes[i];
        const dy = b.y - a.y;
        if (a.x === b.x) {
          d += ` L ${b.x} ${b.y}`;
          continue;
        }
        const c = Math.min(CURVE, dy / 2);
        // leave a, sweep to the gutter quickly, drop, then sweep into b
        if (a.x !== gutter && b.x === gutter) {
          d += ` C ${a.x} ${a.y + c * 0.6}, ${gutter} ${a.y + c * 0.4}, ${gutter} ${a.y + c} L ${b.x} ${b.y}`;
        } else if (a.x === gutter && b.x !== gutter) {
          d += ` L ${gutter} ${b.y - c} C ${gutter} ${b.y - c * 0.4}, ${b.x} ${b.y - c * 0.6}, ${b.x} ${b.y}`;
        } else {
          d += ` C ${a.x} ${a.y + dy / 2}, ${b.x} ${a.y + dy / 2}, ${b.x} ${b.y}`;
        }
      }
      setGeo({ d, w, h: r.height, nodes });
    };
    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Draw on scroll, move the bot to the tip, light nodes as the line arrives.
  useEffect(() => {
    const path = pathRef.current;
    const root = scope.current;
    if (!geo || !path || !root) return;
    const total = path.getTotalLength();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sample length -> y once; y is monotonic along the path.
    const N = 240;
    const samples: number[] = [];
    for (let i = 0; i <= N; i++) samples.push(path.getPointAtLength((total * i) / N).y);
    path.style.strokeDasharray = `${total}`;
    if (reduced) {
      path.style.strokeDashoffset = "0";
      geo.nodes.forEach((n) => (n.el.dataset.on = "true"));
      root.querySelectorAll<SVGCircleElement>("svg.kalam-line circle.node-dot").forEach((c) => (c.dataset.on = "true"));
      return;
    }
    const dots = root.querySelectorAll<SVGCircleElement>("svg.kalam-line circle.node-dot");
    let raf = 0;
    let waved = new Set<number>();
    const update = () => {
      raf = 0;
      const top = root.getBoundingClientRect().top;
      const target = -top + innerHeight * 0.62;
      let i = 0;
      while (i < N && samples[i + 1] <= target) i++;
      const len = Math.max(0, Math.min(total, (total * i) / N));
      path.style.strokeDashoffset = String(total - len);
      const p = path.getPointAtLength(len);
      if (botRef.current) botRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
      geo.nodes.forEach((n, k) => {
        const on = n.y <= p.y + 1;
        n.el.dataset.on = String(on);
        if (dots[k]) dots[k].dataset.on = String(on);
        if (on && n.bot === "wave" && !waved.has(k)) {
          waved.add(k);
          setMood("wave");
          setTimeout(() => setMood("idle"), 2200);
        }
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); waved = new Set(); };
  }, [geo]);

  return (
    <div ref={scope} className="has-line relative">
      {geo && (
        <svg className="kalam-line pointer-events-none absolute left-0 top-0 z-20 overflow-visible" width={geo.w} height={geo.h} aria-hidden>
          <defs>
            <linearGradient id="kl-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={geo.h}>
              <stop offset="0" stopColor="#0098D6" />
              <stop offset=".5" stopColor="#00CBD6" />
              <stop offset="1" stopColor="#00B16A" />
            </linearGradient>
            <filter id="kl-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <path d={geo.d} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="2 8" />
          <path d={geo.d} fill="none" stroke="url(#kl-g)" strokeWidth="5" opacity=".35" filter="url(#kl-glow)" />
          <path ref={pathRef} d={geo.d} fill="none" stroke="url(#kl-g)" strokeWidth="2.5" strokeLinecap="round" />
          {geo.nodes.map((n, i) => (
            <circle key={i} className="node-dot" cx={n.x} cy={n.y} r="5.5" fill="var(--line)" stroke="var(--bg)" strokeWidth="2.5" />
          ))}
        </svg>
      )}
      {geo && (
        <div ref={botRef} className="pointer-events-none absolute left-0 top-0 z-30 will-change-transform motion-reduce:hidden" aria-hidden>
          <div className="-ml-[15px] -mt-[38px] w-[30px] md:-ml-[20px] md:-mt-[50px] md:w-10">
            <KalamBot mood={mood} />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/** A point the line passes through. `x`: "gutter" (left edge) or "center". */
export function LineNode({ x = "gutter", bot }: { x?: "gutter" | "center"; bot?: "wave" }) {
  return <div data-line-node data-x={x} data-bot={bot} aria-hidden className="h-0 w-full" />;
}
