/**
 * The Robokalam orbit: a glowing core inside three rings, each carrying little
 * robots, code windows and signal bots. Rings turn at different speeds and in
 * different directions; the icons counter-turn so they stay upright. Pure SVG
 * and CSS (no JavaScript), decorative, and still for people who prefer less motion.
 * Inspired by the orbit on old.robokalam.com, redrawn in vector. Icons: robot
 * heads, code windows, a robotic arm, a satellite and a chip.
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

function Satellite() {
  return (
    <g fill="none" stroke="#04202F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-7" y="-7" width="14" height="14" rx="2.5" fill="#FFFFFF" transform="rotate(45)" />
      <rect x="-24" y="-5" width="12" height="10" rx="1.5" fill="#E6F6FB" stroke="#0098D6" />
      <rect x="12" y="-5" width="12" height="10" rx="1.5" fill="#E6F6FB" stroke="#0098D6" />
      <path d="M-12 0h-0M12 0h0M0 -10v-6M-3 -18a4 4 0 0 1 6 0" />
    </g>
  );
}

function Chip() {
  return (
    <g fill="none" stroke="#04202F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#FFFFFF" />
      <rect x="-5" y="-5" width="10" height="10" rx="1.5" fill="#7DC242" stroke="#4d7f1e" />
      <path d="M-6 -12v-5M0 -12v-5M6 -12v-5M-6 12v5M0 12v5M6 12v5M-12 -6h-5M-12 0h-5M-12 6h-5M12 -6h5M12 0h5M12 6h5" />
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

/** With `centre`, a robot floats in the glowing core (the home hero); without it, a background ornament. */
export function OrbitSystem({ className = "", centre = false }: { className?: string; centre?: boolean }) {
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

      <Ring r={200} cls="orb-a" items={[{ angle: 205, el: <CodeWindow /> }, { angle: 25, el: <Arm /> }]} />
      <Ring r={275} cls="orb-b" items={[{ angle: 275, el: <Satellite /> }, { angle: 165, el: <RobotHead /> }, { angle: 60, el: <CodeWindow /> }, { angle: 345, el: <Chip /> }]} />
      <Ring r={350} cls="orb-c" dash items={[{ angle: 225, el: <RobotHead /> }, { angle: 315, el: <Arm /> }, { angle: 45, el: <Satellite /> }, { angle: 130, el: <Chip /> }]} />

      {centre && (
        <g className="orb-bot">
          <circle cx={C} cy={C} r="118" fill="#FFFFFF" opacity=".55" />
          <circle cx={C} cy={C} r="118" fill="url(#orb-shine)" />
          <image href="/brand/mascot-600.webp" x={C - 74} y={C - 96} width="148" height="184" />
        </g>
      )}
    </svg>
  );
}
