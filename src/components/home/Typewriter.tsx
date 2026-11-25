"use client";
import { useEffect, useState } from "react";

/**
 * Types each word, pauses, deletes it, and moves to the next, with a blinking
 * cursor, after the hero on old.robokalam.com. Decorative: the heading carries
 * the full sentence for screen readers and search. Holds the first word still
 * for people who prefer reduced motion.
 */
export function Typewriter({ words, className = "" }: { words: string[]; className?: string }) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0, n = words[0].length, deleting = true, t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const w = words[i];
      if (deleting) {
        n--;
        if (n <= 0) { deleting = false; i = (i + 1) % words.length; n = 0; }
      } else {
        n++;
        if (n >= words[i].length) { deleting = true; setText(words[i]); t = setTimeout(tick, 2200); return; }
      }
      setText((deleting ? w : words[i]).slice(0, Math.max(0, n)));
      t = setTimeout(tick, deleting ? 45 : 85);
    };
    t = setTimeout(tick, 2600);
    return () => clearTimeout(t);
  }, [words]);
  return (
    <span aria-hidden className={`typewriter ${className}`}>
      <span className="typewriter-text">{text || " "}</span>
      <span className="typewriter-caret" />
    </span>
  );
}
