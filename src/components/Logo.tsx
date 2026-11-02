/**
 * Placeholder wordmark: a pen nib whose slit becomes a circuit trace.
 * Replace with the official Robokalam logo files before launch.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0098D6" />
          <stop offset=".55" stopColor="#00CBD6" />
          <stop offset="1" stopColor="#98B844" />
        </linearGradient>
      </defs>
      <path d="M20 3 L33 17 L24 35 H16 L7 17 Z" fill="var(--color-navy)" />
      <path d="M20 9 V22 H25 V28" stroke="url(#lm-g)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="9" r="2.4" fill="#00CBD6" />
      <circle cx="25" cy="29" r="2" fill="#98B844" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="leading-none">
        <span className="block font-[family-name:var(--font-display)] text-[1.35rem] font-bold tracking-tight text-heading">Robokalam</span>
        <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted sm:block">Literature of Technologies</span>
      </span>
    </span>
  );
}
