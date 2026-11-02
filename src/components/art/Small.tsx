import { LogoMark } from "../Logo";

/** Slowly rotating badge that sits beside the hero. */
export function RotatingBadge({ className = "" }: { className?: string }) {
  return (
    <div className={className || "relative"} data-anim-scope aria-hidden>
      <svg viewBox="0 0 200 200" className="h-full w-full motion-safe:animate-[spin_28s_linear_infinite]">
        <defs>
          <path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="var(--surface)" stroke="var(--line)" />
        <text fontFamily="var(--font-mono)" fontSize="13.2" letterSpacing="3.2" fill="var(--heading)">
          <textPath href="#badge-circle">LITERATURE OF TECHNOLOGIES • BUILD IT YOURSELF •</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <LogoMark className="h-1/3 w-1/3" />
      </div>
    </div>
  );
}

/** Kalam Bot: small original SVG robot that rides the line. */
export function KalamBot({ className = "", mood = "idle" }: { className?: string; mood?: "idle" | "wave" }) {
  return (
    <svg viewBox="0 0 64 72" className={`bot ${className}`} data-mood={mood} aria-hidden>
      <line x1="32" y1="4" x2="32" y2="14" stroke="#0A4060" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="5" r="4.5" fill="#FFD31D" />
      <rect x="10" y="13" width="44" height="32" rx="12" fill="#0A4060" />
      <rect x="15" y="19" width="34" height="19" rx="8" fill="#E6F4FA" />
      <rect className="bot-eye" x="22" y="24" width="6" height="9" rx="3" fill="#0098D6" />
      <rect className="bot-eye" x="36" y="24" width="6" height="9" rx="3" fill="#0098D6" />
      <rect x="18" y="46" width="28" height="18" rx="7" fill="#0098D6" />
      <circle cx="32" cy="55" r="4" fill="#98B844" />
      <rect className="bot-arm" x="48" y="44" width="7" height="16" rx="3.5" fill="#00CBD6" />
      <rect x="9" y="46" width="7" height="14" rx="3.5" fill="#00CBD6" />
      <rect x="20" y="64" width="9" height="6" rx="3" fill="#0B2B3D" />
      <rect x="35" y="64" width="9" height="6" rx="3" fill="#0B2B3D" />
    </svg>
  );
}

/** Educator door preview: an earnings card. Amounts withheld until rates are approved. */
export function EarningsPreview() {
  const bars = [38, 62, 30, 74, 52, 0, 44];
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-left shadow-[var(--shadow-soft)]" aria-hidden>
      <div className="flex items-center justify-between text-[0.7rem] font-mono uppercase tracking-wider text-muted">
        <span>This week</span><span>Payout · Weekly</span>
      </div>
      <div className="mt-2 flex h-9 items-end gap-1.5">
        {bars.map((b, i) => (
          <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-sky to-aqua transition-transform duration-500 group-hover:scale-y-110 origin-bottom" style={{ height: `${Math.max(b, 6)}%`, opacity: b ? 1 : 0.25 }} />
        ))}
      </div>
      <div className="mt-2 hidden justify-between text-xs text-muted md:group-hover:flex md:group-focus-within:flex"><span>3 sessions · 2 worlds</span><span>Exam Mode: off</span></div>
    </div>
  );
}

/** Learner door preview: a small robot on a grid. */
export function RobotPreview() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <line key={i} x1={i * 32} y1="0" x2={i * 32} y2="80" stroke="var(--line)" />
      ))}
      <path d="M8 64 H56 V24 H120" fill="none" stroke="#00CBD6" strokeWidth="3" strokeDasharray="5 6" strokeLinecap="round" />
      <g className="transition-transform duration-700 ease-out group-hover:translate-x-[64px] group-focus-within:translate-x-[64px]">
        <g transform="translate(40 8) scale(.42)"><KalamBotInner /></g>
      </g>
      <rect x="122" y="14" width="22" height="22" rx="5" fill="#98B844" />
    </svg>
  );
}

function KalamBotInner() {
  return (
    <>
      <rect x="10" y="13" width="44" height="32" rx="12" fill="#0A4060" />
      <rect x="15" y="19" width="34" height="19" rx="8" fill="#E6F4FA" />
      <rect x="22" y="24" width="6" height="9" rx="3" fill="#0098D6" />
      <rect x="36" y="24" width="6" height="9" rx="3" fill="#0098D6" />
      <rect x="18" y="46" width="28" height="18" rx="7" fill="#0098D6" />
    </>
  );
}

/** School door preview: lab benches whose screens light up on hover. */
export function LabPreview() {
  return (
    <svg viewBox="0 0 160 80" className="h-full w-full" aria-hidden>
      <rect x="4" y="60" width="152" height="6" rx="3" fill="var(--line)" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${10 + i * 37} 22)`}>
          <rect width="28" height="20" rx="3" fill="#0A4060" />
          <rect x="3" y="3" width="22" height="14" rx="2" className="fill-[#1B3A4F] transition-colors duration-300 group-hover:fill-[#00CBD6] group-focus-within:fill-[#00CBD6]" style={{ transitionDelay: `${i * 120}ms` }} />
          <rect x="11" y="20" width="6" height="18" fill="#0A4060" />
        </g>
      ))}
    </svg>
  );
}

/** Fellows hero: the earner app, gig board view. No amounts until rates are approved. */
export function GigPhone() {
  const gigs = [
    ["Live Batch", "Online · Robotics", "Sat 10:00"],
    ["Campus Session", "Partner school · IoT", "Mon 15:30"],
    ["Doubt Desk", "Online · Coding", "Wed 19:00"],
  ];
  return (
    <div className="mx-auto w-[280px] rounded-[2.4rem] border-[10px] border-navy bg-surface p-4 shadow-[var(--shadow-lift)] dark:border-[#1d3247]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">Gig board</span>
        <span className="rounded-full bg-leafmist px-2 py-0.5 text-[0.65rem] font-semibold text-navy">Exam Mode off</span>
      </div>
      <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-heading">Near you and online</p>
      <ul className="mt-3 grid gap-2">
        {gigs.map(([t, w, d], i) => (
          <li key={t} className="rounded-2xl border border-line p-3">
            <div className="flex items-center justify-between"><span className="font-semibold text-heading">{t}</span><span className="font-mono text-[0.65rem] text-muted">{d}</span></div>
            <p className="text-xs text-muted">{w}</p>
            <div className="mt-2 flex gap-2">
              <span className={`flex-1 rounded-full py-1 text-center text-xs font-semibold ${i === 0 ? "bg-navy text-white" : "bg-panel text-heading"}`}>{i === 0 ? "Accepted ✓" : "Accept"}</span>
              <span className="flex-1 rounded-full border border-line py-1 text-center text-xs text-muted">Decline</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[0.65rem] text-muted">Pay and deductions shown before you accept</p>
    </div>
  );
}

/** Learner hero: Kalam Bot on a build mat. */
export function LearnerArt() {
  return (
    <svg viewBox="0 0 360 300" className="h-auto w-full">
      <defs><linearGradient id="la-g" x1="0" x2="1"><stop offset="0" stopColor="#0098D6" /><stop offset=".5" stopColor="#00CBD6" /><stop offset="1" stopColor="#98B844" /></linearGradient></defs>
      <rect x="20" y="40" width="320" height="230" rx="28" fill="var(--panel)" />
      {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={20 + i * 53} y1="40" x2={20 + i * 53} y2="270" stroke="var(--line)" />)}
      {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1="20" y1={40 + i * 57} x2="340" y2={40 + i * 57} stroke="var(--line)" />)}
      <path d="M60 240 H150 V130 H290 V70" fill="none" stroke="url(#la-g)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="290" cy="70" r="14" fill="#98B844" />
      <circle cx="60" cy="240" r="9" fill="#00CBD6" />
      <g transform="translate(118 150) scale(1.15)">
        <line x1="32" y1="4" x2="32" y2="14" stroke="#0A4060" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="5" r="4.5" fill="#FFD31D" />
        <rect x="10" y="13" width="44" height="32" rx="12" fill="#0A4060" />
        <rect x="15" y="19" width="34" height="19" rx="8" fill="#E6F4FA" />
        <rect x="22" y="24" width="6" height="9" rx="3" fill="#0098D6" />
        <rect x="36" y="24" width="6" height="9" rx="3" fill="#0098D6" />
        <rect x="18" y="46" width="28" height="18" rx="7" fill="#0098D6" />
        <circle cx="32" cy="55" r="4" fill="#98B844" />
      </g>
      <rect x="250" y="190" width="70" height="44" rx="10" fill="#0B2B3D" />
      <text x="262" y="217" fontFamily="var(--font-mono)" fontSize="13" fill="#6fd7f0">.py</text>
    </svg>
  );
}
