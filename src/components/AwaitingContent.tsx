/**
 * Placeholder for sections that need real, consented or approved content.
 * In production it renders nothing. In review builds
 * (NEXT_PUBLIC_REVIEW_MODE=1) it shows a dashed panel naming what is needed.
 */
export function AwaitingContent({ title, need, children }: { title: string; need: string; children?: React.ReactNode }) {
  if (children) return <>{children}</>;
  if (process.env.NEXT_PUBLIC_REVIEW_MODE !== "1") return null;
  return (
    <section aria-label={`${title} (awaiting content)`} className="py-10" data-review-only>
      <div className="wrap">
        <div className="rounded-[var(--radius-card)] border-2 border-dashed border-line p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wider text-muted">Review build only · hidden in production</p>
          <p className="mt-2 text-xl font-bold text-heading">{title}: awaiting real content</p>
          <p className="mx-auto mt-1 max-w-2xl text-muted">{need}</p>
        </div>
      </div>
    </section>
  );
}
