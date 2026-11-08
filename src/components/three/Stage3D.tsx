"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Hosts the 3D Kalam-bot. The illustrated robot (children) shows first; on
 * devices that can run WebGL, wide enough screens and no reduced-motion
 * preference, the 3D scene loads after the page is idle and fades in on top.
 */
export function Stage3D({ children }: { children: React.ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const gl = (() => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } })();
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || !wide || !gl || saveData) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const start = () => import("./robotScene").then(({ mountRobotScene }) => {
      if (cancelled || !host.current) return;
      stop = mountRobotScene(host.current, { onReady: () => setReady(true) });
    }).catch(() => {});
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => { cancelled = true; if (!w.requestIdleCallback) clearTimeout(id); stop?.(); };
  }, []);
  return (
    <div ref={host} className="stage3d" data-ready={ready || undefined} title={ready ? "Tap the robot!" : undefined}>
      <div className="stage3d-fallback">{children}</div>
    </div>
  );
}
