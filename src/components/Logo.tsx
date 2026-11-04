import { globeDigits } from "@/lib/globe";

/** The binary globe from the Robokalam logo. Decorative: the wordmark carries the name. */
export function LogoMark({ className = "h-9 w-9", spin = false }: { className?: string; spin?: boolean }) {
  const d = globeDigits(50);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs><clipPath id="globe-clip"><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g clipPath="url(#globe-clip)" className={spin ? "globe-spin" : undefined}>
        {d.map((g, i) => (
          <text key={i} x={0} y={0} transform={`translate(${(g.x + 50).toFixed(2)} ${(g.y + 50 + g.size * 0.36).toFixed(2)}) rotate(${g.rot.toFixed(1)}) scale(${g.sx.toFixed(2)} 1)`}
            textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={g.size.toFixed(1)} fill={g.color} fillOpacity={g.opacity.toFixed(2)}>{g.ch}</text>
        ))}
      </g>
    </svg>
  );
}

function GlobeDigits() {
  return (
    <>
      {globeDigits(50).map((g, i) => (
        <text key={i} x={0} y={0} transform={`translate(${(g.x + 50).toFixed(2)} ${(g.y + 50 + g.size * 0.36).toFixed(2)}) rotate(${g.rot.toFixed(1)}) scale(${g.sx.toFixed(2)} 1)`}
          textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={g.size.toFixed(1)} fill={g.color} fillOpacity={g.opacity.toFixed(2)}>{g.ch}</text>
      ))}
    </>
  );
}

/**
 * Full lockup as one SVG image, like the official logo: globe, ROBOKALAM
 * wordmark (navy) and tagline (brand green). Logos keep their exact brand
 * colours (WCAG 1.4.3 exempts logotypes); the image carries an accessible name.
 * On dark backgrounds the globe sits on a white disc and the wordmark turns light.
 */
export function Wordmark({ tone = "auto" }: { tone?: "auto" | "light" }) {
  const id = tone === "light" ? "wm-l" : "wm-a";
  return (
    <svg viewBox="0 0 312 64" className={`h-8 w-auto sm:h-11 lg:h-12 ${tone === "light" ? "text-white" : "text-navy dark:text-heading"}`} role="img" aria-label="Robokalam, literature of technologies">
      <defs><clipPath id={`${id}-clip`}><circle cx="50" cy="50" r="50" /></clipPath></defs>
      <g transform="translate(2 2) scale(0.6)">
        <circle cx="50" cy="50" r="53" className={tone === "light" ? "fill-white" : "fill-transparent dark:fill-white"} />
        <g clipPath={`url(#${id}-clip)`}><GlobeDigits /></g>
      </g>
      <text x="72" y="36" fontFamily="var(--font-brand), 'Times New Roman', serif" fontWeight={700} fontSize="31" letterSpacing="0.6" fill="currentColor">ROBOKALAM</text>
      <text x="73" y="56" fontFamily="var(--font-poppins), Arial, sans-serif" fontWeight={500} fontSize="15" fill="#97BC3D">literature of technologies</text>
    </svg>
  );
}
