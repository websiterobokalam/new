/**
 * Kiko, the little Robokalam robot (flat style). Drawn as vectors so it stays
 * crisp and can move: the eyes look left and right (CSS var --look, -1..1),
 * the antenna bobs. Sunny yellow with a dark outline so it stands out on the
 * teal footer. Decorative unless given a title.
 */
export function Kiko({ className = "", title }: { className?: string; title?: string }) {
  const ink = "#04202F";
  const line = { stroke: ink, strokeWidth: 10, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="40 0 402 550" className={`kiko ${className}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g className="kiko-antenna">
        <rect x="226" y="52" width="18" height="58" rx="6" fill={ink} />
        <circle cx="235" cy="42" r="22" fill="#FF7A45" {...line} />
      </g>
      <rect x="58" y="188" width="40" height="82" rx="20" fill="#A3E635" {...line} />
      <rect x="372" y="188" width="40" height="82" rx="20" fill="#A3E635" {...line} />
      <rect x="88" y="100" width="294" height="250" rx="92" fill="#FFD31D" {...line} />
      <rect x="122" y="140" width="226" height="170" rx="56" fill="#FFFFFF" {...line} strokeWidth={6} />
      <g className="kiko-eyes">
        <circle cx="186" cy="218" r="28" fill={ink} />
        <circle cx="196" cy="208" r="9" fill="#fff" />
        <circle cx="284" cy="218" r="28" fill={ink} />
        <circle cx="294" cy="208" r="9" fill="#fff" />
      </g>
      <circle cx="146" cy="272" r="17" fill="#FF9EB0" />
      <circle cx="324" cy="272" r="17" fill="#FF9EB0" />
      <path d="M180 280 Q235 316 290 280" fill="none" stroke={ink} strokeWidth="14" strokeLinecap="round" />
      <rect x="144" y="366" width="182" height="124" rx="40" fill="#FFD31D" {...line} />
      <circle cx="235" cy="428" r="29" fill="#FF7A45" {...line} strokeWidth={6} />
      <circle cx="235" cy="428" r="10" fill="#fff" />
      <rect x="158" y="494" width="48" height="44" rx="12" fill={ink} />
      <rect x="264" y="494" width="48" height="44" rx="12" fill={ink} />
    </svg>
  );
}
