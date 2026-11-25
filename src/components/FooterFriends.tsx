"use client";
import { useEffect, useRef, useState } from "react";
import { Kiko } from "./art/Kiko";
import { Mascot } from "./art/Mascot";

type Who = "kiko" | "mascot";
const LINES: Record<Who, string[]> = {
  kiko: ["Hi, I'm Kiko!", "Let's build a robot!", "Beep boop! 👋", "See you in class!"],
  mascot: ["Keep building!", "You've got this! 👍", "Hello, Kiko!", "Come learn with us!"],
};

/**
 * Kiko (left) and the Robokalam mascot (right) at the foot of every page.
 * Kiko's eyes follow the pointer left and right across the footer; tapping
 * either friend makes them hop and say something. Both are real buttons.
 *
 * The images are rendered once and never re-created: the hop is a one-off
 * Web Animation on the existing element, so rapid taps can't stack copies.
 */
export function FooterFriends() {
  const root = useRef<HTMLDivElement>(null);
  const bodies = useRef<Record<Who, HTMLSpanElement | null>>({ kiko: null, mascot: null });
  const [say, setSay] = useState<{ who: Who; text: string; n: number } | null>(null);
  const count = useRef(0);

  useEffect(() => {
    const el = root.current;
    const footer = el?.closest("footer");
    if (!el || !footer || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const k = el.querySelector(".footer-kiko")?.getBoundingClientRect();
      if (!k) return;
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

  const poke = (who: Who) => {
    const n = ++count.current;
    setSay({ who, text: LINES[who][(n - 1) % LINES[who].length], n });
    const body = bodies.current[who];
    if (body && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      body.getAnimations().forEach((a) => a.cancel());
      body.animate(
        [
          { transform: "translateY(0) scale(1, 1)" },
          { transform: "translateY(0) scale(1.08, 0.9)", offset: 0.2 },
          { transform: "translateY(-22px) scale(0.96, 1.05)", offset: 0.55 },
          { transform: "translateY(0) scale(1, 1)" },
        ],
        { duration: 600, easing: "cubic-bezier(.3,1.5,.6,1)" },
      );
    }
  };

  const friend = (who: Who, label: string, art: React.ReactNode) => (
    <button type="button" className="footer-friend" aria-label={label} onClick={() => poke(who)}>
      <span ref={(el) => { bodies.current[who] = el; }} className="footer-friend-body">{art}</span>
      {say?.who === who && <span key={`say-${say.n}`} className={`friend-say friend-say-${who === "kiko" ? "left" : "right"}`}>{say.text}</span>}
    </button>
  );

  return (
    <div ref={root} className="footer-bots">
      <div className="footer-pair">
        {friend("kiko", "Say hi to Kiko", <Kiko className="footer-kiko" />)}
        {friend("mascot", "Say hi to the Robokalam mascot", <Mascot className="footer-mascot" sizes="(min-width: 768px) 180px, 110px" float={false} />)}
      </div>
      <div aria-hidden className="footer-ground-line" />
      <p className="sr-only" aria-live="polite">{say?.text ?? ""}</p>
    </div>
  );
}
