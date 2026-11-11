"use client";
import { useEffect, useRef, useState } from "react";
import { Kiko } from "./art/Kiko";
import { Mascot } from "./art/Mascot";

const KIKO_LINES = ["Hi, I'm Kiko!", "Let's build a robot!", "Beep boop! 👋", "See you in class!"];
const MASCOT_LINES = ["Keep building!", "You've got this! 👍", "Hello, Kiko!", "Come learn with us!"];

/**
 * Kiko (left) and the Robokalam mascot (right) at the foot of every page.
 * Kiko's eyes follow the pointer left and right across the footer; tapping
 * either friend makes them hop and say something. Both are real buttons.
 */
export function FooterFriends() {
  const root = useRef<HTMLDivElement>(null);
  const [say, setSay] = useState<{ who: "kiko" | "mascot"; text: string; n: number } | null>(null);
  const [hop, setHop] = useState<{ who: "kiko" | "mascot"; n: number } | null>(null);
  const count = useRef(0);

  useEffect(() => {
    const el = root.current;
    const footer = el?.closest("footer");
    if (!el || !footer || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const k = el.querySelector(".footer-kiko")!.getBoundingClientRect();
      const look = Math.max(-1, Math.min(1, (e.clientX - (k.left + k.width / 2)) / (window.innerWidth / 3)));
      el.style.setProperty("--look", look.toFixed(3));
      el.dataset.following = "";
    };
    const leave = () => { delete el.dataset.following; el.style.removeProperty("--look"); };
    footer.addEventListener("pointermove", move, { passive: true });
    footer.addEventListener("pointerleave", leave);
    return () => { footer.removeEventListener("pointermove", move); footer.removeEventListener("pointerleave", leave); };
  }, []);

  useEffect(() => {
    if (!say) return;
    const t = setTimeout(() => setSay(null), 2600);
    return () => clearTimeout(t);
  }, [say]);

  const poke = (who: "kiko" | "mascot") => {
    const n = ++count.current;
    const lines = who === "kiko" ? KIKO_LINES : MASCOT_LINES;
    setHop({ who, n });
    setSay({ who, text: lines[(n - 1) % lines.length], n });
  };

  return (
    <div ref={root} className="footer-bots">
      <div className="footer-pair">
        <button type="button" className="footer-friend" aria-label="Say hi to Kiko" onClick={() => poke("kiko")}>
          <span key={hop?.who === "kiko" ? hop.n : "k"} className={hop?.who === "kiko" ? "friend-hop" : undefined}><Kiko className="footer-kiko" /></span>
          {say?.who === "kiko" && <span key={say.n} className="friend-say friend-say-left">{say.text}</span>}
        </button>
        <button type="button" className="footer-friend" aria-label="Say hi to the Robokalam mascot" onClick={() => poke("mascot")}>
          <span key={hop?.who === "mascot" ? hop.n : "m"} className={hop?.who === "mascot" ? "friend-hop" : undefined}><Mascot className="footer-mascot" sizes="200px" float={false} /></span>
          {say?.who === "mascot" && <span key={say.n} className="friend-say friend-say-right">{say.text}</span>}
        </button>
      </div>
      <div aria-hidden className="footer-ground-line" />
      <p className="sr-only" aria-live="polite">{say?.text ?? ""}</p>
    </div>
  );
}
