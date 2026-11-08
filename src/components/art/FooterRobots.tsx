/**
 * The footer's robot friends, after the silhouettes on old.robokalam.com: an
 * astronaut walking in from the left, and three robots on the right (a tall
 * square-headed one, a little round one, and one waving both arms). Eyes blink,
 * arms wave, antennas glow, hearts beat; soft shading and rosy cheeks make them
 * friendly. Decorative, and still when motion is reduced.
 */

const INK = "#04202F";
const EYE = "#E6FBFF";
const GLOW = "#FFD31D";
const CHEEK = "#FF8FB1";

export function Astronaut({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 300" className={`bot bot-astronaut ${className}`} aria-hidden focusable="false">
      <defs>
        <linearGradient id="fr-shade-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#24607A" /><stop offset=".45" stopColor="#0A3347" /><stop offset="1" stopColor="#04202F" /></linearGradient>
      </defs>
      <g className="bot-bob">
        {/* backpack */}
        <rect x="6" y="60" width="38" height="96" rx="18" fill="url(#fr-shade-a)" />
        {/* helmet with visor */}
        <rect x="52" y="12" width="56" height="58" rx="22" fill="url(#fr-shade-a)" />
        <path d="M80 30a14 14 0 0 1 14 14" stroke={EYE} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle className="bot-blink" cx="74" cy="44" r="5" fill="#5FF3FF" />
        <ellipse cx="96" cy="58" rx="6" ry="3.5" fill={CHEEK} />
        {/* body */}
        <rect x="46" y="64" width="62" height="92" rx="20" fill="url(#fr-shade-a)" />
        <path d="M60 86h32a6 6 0 0 1 6 6v10a12 12 0 0 1-12 12h-8a12 12 0 0 1-12-12V92a6 6 0 0 1 6-6Z" fill="none" stroke={EYE} strokeWidth="4" />
        <path className="bot-heart" d="M78 132l-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z" fill={CHEEK} />
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
      <defs>
        <linearGradient id="fr-shade-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#24607A" /><stop offset=".45" stopColor="#0A3347" /><stop offset="1" stopColor="#04202F" /></linearGradient>
      </defs>
      {/* 1. Tall robot with a big square head */}
      <g className="bot-sway">
        <path d="M44 22c0-10 10-12 14-6" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle className="bot-antenna" cx="42" cy="18" r="6" fill={GLOW} />
        <rect x="8" y="30" width="72" height="62" rx="16" fill="url(#fr-shade-t)" />
        <g className="bot-blink">
          <circle cx="28" cy="56" r="11" fill={EYE} /><circle cx="29" cy="57" r="6" fill={INK} /><circle cx="31" cy="54" r="2.2" fill="#fff" />
          <circle cx="60" cy="56" r="11" fill={EYE} /><circle cx="61" cy="57" r="6" fill={INK} /><circle cx="63" cy="54" r="2.2" fill="#fff" />
        </g>
        <path d="M36 76q8 7 16 0" stroke={EYE} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <ellipse cx="18" cy="74" rx="6" ry="3.5" fill={CHEEK} /><ellipse cx="70" cy="74" rx="6" ry="3.5" fill={CHEEK} />
        <rect x="22" y="96" width="44" height="44" rx="10" fill="url(#fr-shade-t)" />
        <path className="bot-heart" d="M44 124l-7-7a4.5 4.5 0 0 1 7-5.5 4.5 4.5 0 0 1 7 5.5Z" fill={CHEEK} />
        <path d="M18 104v30M70 104v30" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d="M32 140v40M56 140v40" stroke={INK} strokeWidth="9" strokeLinecap="round" />
        <path d="M24 190h16M48 190h16" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* 2. Little round robot */}
      <g className="bot-hop">
        <path d="M128 92v-10" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <circle className="bot-antenna" cx="128" cy="78" r="5" fill={GLOW} />
        <circle cx="128" cy="122" r="30" fill="url(#fr-shade-t)" />
        <circle className="bot-blink" cx="128" cy="118" r="15" fill={EYE} />
        <circle cx="129" cy="119" r="7" fill={INK} /><circle cx="132" cy="115" r="2.5" fill="#fff" />
        <ellipse cx="108" cy="134" rx="5" ry="3" fill={CHEEK} /><ellipse cx="148" cy="134" rx="5" ry="3" fill={CHEEK} />
        <path d="M100 136l-12 10M156 136l12 10" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <rect x="110" y="148" width="36" height="28" rx="12" fill="url(#fr-shade-t)" />
        <text x="128" y="167" textAnchor="middle" fontSize="11" fontWeight="700" fill={EYE} fontFamily="system-ui, sans-serif">RK</text>
        <path d="M118 176v14M138 176v14" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
      {/* 3. Robot waving both arms */}
      <g>
        <path d="M228 26c0-10 10-12 14-6" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle className="bot-antenna" cx="226" cy="20" r="5" fill={GLOW} />
        <rect x="200" y="30" width="56" height="44" rx="14" fill="url(#fr-shade-t)" />
        <g className="bot-blink">
          <circle cx="216" cy="50" r="8" fill={EYE} /><circle cx="217" cy="51" r="4" fill={INK} /><circle cx="218.5" cy="48.5" r="1.6" fill="#fff" />
          <circle cx="240" cy="50" r="8" fill={EYE} /><circle cx="241" cy="51" r="4" fill={INK} /><circle cx="242.5" cy="48.5" r="1.6" fill="#fff" />
        </g>
        <path d="M220 62q8 7 16 0" stroke={EYE} strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="207" cy="64" rx="4.5" ry="2.8" fill={CHEEK} /><ellipse cx="249" cy="64" rx="4.5" ry="2.8" fill={CHEEK} />
        <rect x="196" y="80" width="64" height="62" rx="12" fill="url(#fr-shade-t)" />
        <path className="bot-heart" d="M228 116l-8-8a5 5 0 0 1 8-6 5 5 0 0 1 8 6Z" fill={CHEEK} />
        <g className="bot-wave-l"><path d="M196 92l-20-30" stroke={INK} strokeWidth="9" strokeLinecap="round" /><path d="M172 58l-6-8M176 62l-10 2" stroke={INK} strokeWidth="6" strokeLinecap="round" /></g>
        <g className="bot-wave-r"><path d="M260 92l20-30" stroke={INK} strokeWidth="9" strokeLinecap="round" /><path d="M284 58l6-8M280 62l10 2" stroke={INK} strokeWidth="6" strokeLinecap="round" /></g>
        <path d="M212 142v40M244 142v40" stroke={INK} strokeWidth="10" strokeLinecap="round" />
        <path d="M204 190h16M236 190h16" stroke={INK} strokeWidth="8" strokeLinecap="round" />
      </g>
    </svg>
  );
}
