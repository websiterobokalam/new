/**
 * Kalam-bot, illustrated: the same friendly robot as the 3D mascot, drawn in
 * SVG so it shows instantly (before the 3D scene loads), on phones, and when
 * motion is reduced. Floats gently and blinks; decorative.
 */
export function CuteBot({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 420" className={`cutebot ${className}`} aria-hidden focusable="false">
      <defs>
        <linearGradient id="cb-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#CDE8F3" /></linearGradient>
        <linearGradient id="cb-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0B2A3D" /><stop offset="1" stopColor="#04202F" /></linearGradient>
        <radialGradient id="cb-glow"><stop offset="0" stopColor="#FFE680" /><stop offset="1" stopColor="#FFD31D" stopOpacity="0" /></radialGradient>
        <filter id="cb-eye"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <ellipse cx="200" cy="400" rx="90" ry="12" fill="#000" opacity=".25" className="cutebot-shadow" />
      <g className="cutebot-float">
        {/* antenna */}
        <g className="cutebot-antenna">
          <path d="M200 70V38" stroke="#0098D6" strokeWidth="8" strokeLinecap="round" />
          <circle cx="200" cy="30" r="26" fill="url(#cb-glow)" className="cutebot-pulse" />
          <circle cx="200" cy="30" r="13" fill="#FFD31D" />
        </g>
        {/* ears */}
        <rect x="58" y="128" width="26" height="54" rx="12" fill="#00CBD6" />
        <rect x="316" y="128" width="26" height="54" rx="12" fill="#00CBD6" />
        {/* head */}
        <rect x="76" y="70" width="248" height="182" rx="58" fill="url(#cb-shell)" stroke="#04202F" strokeWidth="5" />
        <rect x="104" y="100" width="192" height="122" rx="40" fill="url(#cb-screen)" />
        <g filter="url(#cb-eye)" fill="#5FF3FF" className="cutebot-eyes">
          <rect x="140" y="128" width="36" height="52" rx="18" />
          <rect x="224" y="128" width="36" height="52" rx="18" />
        </g>
        <circle cx="166" cy="140" r="6" fill="#fff" /><circle cx="250" cy="140" r="6" fill="#fff" />
        <path d="M184 198q16 14 32 0" stroke="#5FF3FF" strokeWidth="7" strokeLinecap="round" fill="none" />
        <ellipse cx="118" cy="232" rx="14" ry="8" fill="#FF8FB1" opacity=".8" />
        <ellipse cx="282" cy="232" rx="14" ry="8" fill="#FF8FB1" opacity=".8" />
        {/* body */}
        <rect x="124" y="262" width="152" height="112" rx="42" fill="url(#cb-shell)" stroke="#04202F" strokeWidth="5" />
        <rect x="160" y="296" width="80" height="44" rx="14" fill="#00CBD6" />
        <circle cx="200" cy="318" r="9" fill="#FFD31D" className="cutebot-pulse" />
        {/* arms: left rests, right waves */}
        <path d="M128 290q-36 18-40 56" stroke="#04202F" strokeWidth="5" fill="none" />
        <path d="M128 290q-36 18-40 56" stroke="url(#cb-shell)" strokeWidth="22" strokeLinecap="round" fill="none" />
        <circle cx="86" cy="352" r="16" fill="#00CBD6" />
        <g className="cutebot-wave">
          <path d="M272 290q40-14 52-58" stroke="url(#cb-shell)" strokeWidth="22" strokeLinecap="round" fill="none" />
          <circle cx="326" cy="226" r="16" fill="#00CBD6" />
        </g>
        {/* jet */}
        <ellipse cx="200" cy="382" rx="34" ry="8" fill="#00CBD6" opacity=".6" className="cutebot-pulse" />
      </g>
    </svg>
  );
}
