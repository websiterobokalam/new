"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.getAttribute("data-theme") === "dark"), []);
  function toggle() {
    const next = !dark;
    setDark(next);
    const t = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("rk-theme", t); } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-heading"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark ?? undefined}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        {dark ? (
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
