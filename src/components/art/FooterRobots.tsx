/**
 * The footer's robot friends, after the silhouettes on old.robokalam.com: an
 * astronaut walking in from the left, and three robots on the right (a tall
 * square-headed one, a little round one, and one waving both arms). Eyes blink,
 * arms wave, antennas glow. Decorative, and still when motion is reduced.
 */

const INK = "#04202F";
const EYE = "#E6FBFF";
const GLOW = "#FFD31D";

export function Astronaut({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 300" className={`bot bot-astronaut ${className}`} aria-hidden focusable="false">
      <g className="bot-bob">
        {/* backpack */}
        <rect x="6" y="60" width="38" height="96" rx="18" fill={INK} />
        {/* helmet with visor */}
        <rect x="52" y="12" width="56" height="58" rx="22" fill={INK} />
        <path d="M80 30a14 14 0 0 1 14 14" stroke={EYE} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle className="bot-blink" cx="74" cy="44" r="4" fill={EYE} />
        {/* body */}
        <rect x="46" y="64" width="62" height="92" rx="20" fill={INK} />
        <path d="M60 86h32a6 6 0 0 1 6 6v10a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12V92a6 6 0 0 1 6-6Z" fill="none" stroke={EYE} strokeWidth="4" />
        <circle cx="78" cy="126" r="7" fill="none" stroke={EYE} strokeWidth="4" />
        {/* pointing arm */}
        <g className="bot-point">
          <path d="M92 124l22 18" stroke={INK} strokeWidth="16" strokeLinecap="round" />
          <path d="M114 142h20v-8" stroke={INK} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
        {/* legs, mid-stride */}
        <g className="bot-step">
          <path d="M66 156l-8 70" stroke={INK} strokeWidth="22" strokeLinecap="round" />
          <path d="M58 226l-6 46" stroke={INK} strokeWidth="16" strokeLinecap="round" />
          <path d="M40 280h26a8 8 0 0 0 8-8" stroke={INK} strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
        <path d="M88 156l6 60" stroke={INK} strokeWidth="18" strokeLinecap="round" opacity=".85" />
      </g>
    </svg>
  );
}

export function RobotTrio({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 200" className={`bot bot-trio ${className}`} aria-hidden focusable="false">
      {/* 1. Tall robot with a big square head */}
      <g className="bot-sway">
        <path d="M44 22c0-10 10-12 14-6" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle className="bot-antenna" cx="42" cy="18" r="6" fill={GLOW} />
        <rect x="8" y="30" width="72" height="62" rx="8" fill={INK} />
        <g className="bot-blink">
          <circle cx="28" cy="56" r="10" fill={EYE} /><circle cx="28" cy="56" r="4" fill={INK} />
          <circle cx="60" cy="56" r="10" fill={EYE} /><circle cx="60" cy="56" r="4" fill={INK} />
        </g>
        <rect x="34" y="76" width="20" height="5" rx="2" fill={EYE} />
        <rect x="22" y="96" width="44" height="44" rx="4" fill={INK} />
        <path d="M18 104v30M70 104v30" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M32 140v40M56 140v40" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <path d="M24 190h16M48 190h16" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* 2. Little round robot */}
      <g className="bot-hop">
        <path d="M128 92v-10" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <circle className="bot-antenna" cx="128" cy="78" r="5" fill={GLOW} />
        <circle cx="128" cy="122" r="30" fill={INK} />
        <circle className="bot-blink" cx="128" cy="118" r="15" fill={EYE} />
        <circle cx="128" cy="118" r="6" fill={INK} />
        <path d="M100 136l-12 10M156 136l12 10" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <rect x="110" y="148" width="36" height="28" rx="12" fill={INK} />
        <text x="128" y="167" textAnchor="middle" fontSize="11" fontWeight="700" fill={EYE} fontFamily="system-ui, sans-serif">RK</text>
        <path d="M118 176v14M138 176v14" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* 3. Robot waving both arms */}
      <g>
        <path d="M228 26c0-10 10-12 14-6" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle className="bot-antenna" cx="226" cy="20" r="5" fill={GLOW} />
        <rect x="200" y="30" width="56" height="44" rx="8" fill={INK} />
        <g className="bot-blink">
          <circle cx="216" cy="50" r="7" fill={EYE} /><circle cx="216" cy="50" r="3" fill={INK} />
          <circle cx="240" cy="50" r="7" fill={EYE} /><circle cx="240" cy="50" r="3" fill={INK} />
        </g>
        <rect x="220" y="62" width="16" height="4" rx="2" fill={EYE} />
        <rect x="196" y="80" width="64" height="62" rx="6" fill={INK} />
        <g className="bot-wave-l"><path d="M196 92l-20-30" stroke={INK} strokeWidth="9" strokeLinecap="round" /><path d="M172 58l-6-8M176 62l-10 2" stroke={INK} strokeWidth="6" strokeLinecap="round" /></g>
        <g className="bot-wave-r"><path d="M260 92l20-30" stroke={INK} strokeWidth="9" strokeLinecap="round" /><path d="M284 58l6-8M280 62l10 2" stroke={INK} strokeWidth="6" strokeLinecap="round" /></g>
        <path d="M212 142v40M244 142v40" stroke={INK} strokeWidth="10" strokeLinecap="round" />
        <path d="M204 190h16M236 190h16" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}
