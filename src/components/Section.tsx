/** A section that powers on when the Kalam Line arrives. */
export function Section({ id, className = "", children, label, ...rest }: { id?: string; className?: string; children: React.ReactNode; label?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section id={id} aria-label={label} className={`relative py-20 sm:py-28 ${className}`} {...rest}>
      <div data-power>{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede, center = false }: { eyebrow?: string; title: React.ReactNode; lede?: React.ReactNode; center?: boolean }) {
  return (
    <div className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow" data-stagger>{eyebrow}</p>}
      <h2 className="display-lg mt-3" data-stagger>{title}</h2>
      {lede && <p className="lede mt-4" data-stagger>{lede}</p>}
    </div>
  );
}
