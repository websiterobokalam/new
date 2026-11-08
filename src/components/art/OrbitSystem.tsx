/**
 * The Robokalam orbit: a glowing core inside three rings, each carrying little
 * robots, code windows and signal bots. Rings turn at different speeds and in
 * different directions; the icons counter-turn so they stay upright. Pure SVG
 * and CSS (no JavaScript), decorative, and still for people who prefer less motion.
 * Inspired by the orbit on old.robokalam.com, redrawn in vector.
 */

const C = 400; // centre of the 800 × 800 viewBox

/* ---------- Icons, each drawn around (0,0) ---------- */

/** The Robokalam mascot's head, riding the orbit. */
function RobotHead() {
  return <image href="/brand/mascot-head-96.webp" x="-22" y="-19" width="44" height="37" />;
}

function CodeWindow() {
  return (
    <g fill="none" stroke="#04202F" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="-22" y="-16" width="44" height="32" rx="5" fill="#FFFFFF" />
      <path d="M-22 -7h44" />
      <circle cx="-16" cy="-11.5" r="1.4" fill="#04202F" />
      <circle cx="-11" cy="-11.5" r="1.4" fill="#04202F" />
      <circle cx="-6" cy="-11.5" r="1.4" fill="#04202F" />
      <path d="M-7 0l-6 4.5 6 4.5M7 0l6 4.5-6 4.5M2.5 -1.5l-5 12" stroke="#0098D6" />
    </g>
  );
}

/** A round scout bot sending signals. */
function SignalBot({ body = "#0098D6" }: { body?: string }) {
  return (
    <g>
      <g fill="none" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" className="orb-signal">
        <path d="M18 -16a24 24 0 0 1 6 16" />
        <path d="M24 -22a32 32 0 0 1 8 22" opacity=".6" />
      </g>
      <circle r="17" fill={body} />
      <circle r="17" fill="url(#orb-shine)" />
      <rect x="-9" y="-3" width="18" height="6" rx="3" fill="#FFFFFF" transform="rotate(-35)" />
      <circle cx="-5" cy="3" r="2.6" fill="#04202F" />
      <path d="M-17 0h-6M17 0h6M0 -17v-6M0 17v6" stroke="#04202F" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  );
}

/** A little four-legged explorer bot with a dome. */
function ExplorerBot() {
  return (
    <g>
      <g fill="none" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" className="orb-signal">
        <path d="M-20 -18a26 26 0 0 0 -6 14" />
        <path d="M20 -18a26 26 0 0 1 6 14" />
      </g>
      <path d="M-10 10l-10 10M10 10l10 10M-4 13l-3 12M4 13l3 12" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
      <circle r="15" fill="#7C3AED" />
      <path d="M-15 0a15 15 0 0 1 30 0" fill="#A78BFA" />
      <path d="M-8 -9l16 18M8 -9l-16 18" stroke="#5B21B6" strokeWidth="1.6" opacity=".7" />
      <circle className="orb-blink" cx="0" cy="-3" r="3" fill="#FFD31D" />
    </g>
  );
}

function Arm() {
  return (
    <g fill="none" stroke="#04202F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-14" y="10" width="28" height="7" rx="2" fill="#FFFFFF" />
      <path d="M0 10V0l12 -12" stroke="#0098D6" strokeWidth="4" />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
      <path d="M12 -12l6 -2M12 -12l2 -6" />
    </g>
  );
}

/* ---------- Layout ---------- */

type Item = { angle: number; el: React.ReactNode };
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

function Ring({ r, cls, items, dash }: { r: number; cls: string; items: Item[]; dash?: boolean }) {
  return (
    <g className={`orb-ring ${cls}`}>
      <circle cx={C} cy={C} r={r} fill="none" stroke="url(#orb-stroke)" strokeWidth="2" strokeDasharray={dash ? "2 10" : undefined} />
      {items.map((it, i) => {
        const p = at(r, it.angle);
        return (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            {/* Counter-rotate so each icon stays upright as its ring turns. */}
            <g className={`orb-upright ${cls}`}><g transform="scale(1.5)">{it.el}</g></g>
          </g>
        );
      })}
    </g>
  );
}

export function OrbitSystem({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 800" className={`orbit ${className}`} aria-hidden focusable="false">
      <defs>
        <radialGradient id="orb-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#00CBD6" stopOpacity=".95" />
          <stop offset=".45" stopColor="#00CBD6" stopOpacity=".45" />
          <stop offset="1" stopColor="#0098D6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="orb-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00CBD6" stopOpacity=".9" />
          <stop offset="1" stopColor="#0098D6" stopOpacity=".35" />
        </linearGradient>
        <radialGradient id="orb-shine" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="orb-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
      </defs>

      {/* Soft glowing core that breathes */}
      <circle className="orb-core" cx={C} cy={C} r="190" fill="url(#orb-core)" />
      {/* Two drifting halos, like the old site's soft bubbles */}
      <g className="orb-drift">
        <circle cx="680" cy="250" r="44" fill="none" stroke="#6EA8FF" strokeWidth="26" opacity=".35" filter="url(#orb-blur)" />
        <circle cx="90" cy="520" r="46" fill="none" stroke="#00CBD6" strokeWidth="26" opacity=".35" filter="url(#orb-blur)" />
      </g>

      <Ring r={200} cls="orb-a" items={[{ angle: 205, el: <RobotHead /> }, { angle: 25, el: <Arm /> }]} />
      <Ring r={275} cls="orb-b" items={[{ angle: 275, el: <CodeWindow /> }, { angle: 165, el: <RobotHead /> }, { angle: 60, el: <CodeWindow /> }, { angle: 345, el: <Arm /> }]} />
      <Ring r={350} cls="orb-c" dash items={[{ angle: 225, el: <ExplorerBot /> }, { angle: 315, el: <SignalBot /> }, { angle: 45, el: <ExplorerBot /> }, { angle: 130, el: <SignalBot body="#00A7B5" /> }]} />
    </svg>
  );
}
