"use client";
import { useEffect, useState } from "react";

/** Light is the default. This small switch in the footer lets a visitor opt in to dark, remembered on this device. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); setReady(true); }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { if (next) localStorage.setItem("rk-theme", "dark"); else localStorage.removeItem("rk-theme"); } catch {}
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      disabled={!ready}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-3 text-xs text-[#c9dbe5] hover:border-[#7FD0F2] hover:text-white"
    >
      <span aria-hidden className={`relative h-4 w-7 rounded-full transition-colors ${dark ? "bg-[#00CBD6]" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left] ${dark ? "left-3.5" : "left-0.5"}`} />
      </span>
      Dark theme
    </button>
  );
}
