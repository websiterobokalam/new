"use client";
import { useEffect, useState } from "react";

/**
 * A short confirmation at the bottom of the screen. Forms that disappear after
 * a successful save (an item leaving a list) hand their message here, so the
 * person still sees "Marked answered" and screen readers still hear it.
 */
export const flash = (text: string) => window.dispatchEvent(new CustomEvent("rk-flash", { detail: text }));

export function FlashHost() {
  const [msg, setMsg] = useState<{ text: string; n: number }>();
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => setMsg({ text: String((e as CustomEvent).detail), n: ++n });
    window.addEventListener("rk-flash", on);
    return () => window.removeEventListener("rk-flash", on);
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(undefined), 4000);
    return () => clearTimeout(t);
  }, [msg]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      {msg && <p key={msg.n} className="rounded-full bg-[#04202F] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-lift)]">✓ {msg.text}</p>}
    </div>
  );
}
