/** Door page hero. Carries the view-transition name the tapped door expands into. */
export function PageHero({ eyebrow, title, lede, children, tone = "sky", art }: { eyebrow: string; title: React.ReactNode; lede?: React.ReactNode; children?: React.ReactNode; tone?: "sky" | "aqua" | "leaf"; art?: React.ReactNode }) {
  const glow = { sky: "rgba(26,176,226,.16)", aqua: "rgba(0,203,214,.18)", leaf: "rgba(0,152,214,.2)" }[tone];
  return (
    <section className="relative overflow-hidden pb-14 pt-12 sm:pb-20 sm:pt-20" style={{ viewTransitionName: "door-hero" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(50% 70% at 80% 10%, ${glow}, transparent 70%)` }} />
      <div className={`wrap relative ${art ? "grid items-center gap-10 lg:grid-cols-[1.25fr_1fr]" : ""}`}>
        <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display-xl mt-4 max-w-4xl">{title}</h1>
        {lede && <p className="lede mt-5 max-w-2xl">{lede}</p>}
        {children && <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div>}
        </div>
        {art && <div aria-hidden className="mx-auto w-full max-w-[520px] motion-safe:animate-[float_7s_ease-in-out_infinite]" data-anim-scope>{art}</div>}
      </div>
    </section>
  );
}

export function StickyCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line p-3 glass md:hidden" data-noprint>
      <a href={href} className="btn btn-primary w-full">{label}</a>
    </div>
  );
}
