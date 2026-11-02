import { approvedClaim, claimText } from "@/lib/claims";

/**
 * Renders an approved claim, or the neutral fallback copy. If there is no
 * fallback, renders nothing. Unapproved claims never reach the HTML.
 */
export function Claim({ id, fallback, as: Tag = "span", className }: { id: string; fallback?: React.ReactNode; as?: React.ElementType; className?: string }) {
  const c = approvedClaim(id);
  if (!c) return fallback ? <Tag className={className}>{fallback}</Tag> : null;
  return (
    <Tag className={className} data-claim={c.id} title={`As of ${c.asOf}. ${c.definition}`}>
      {claimText(c)}
    </Tag>
  );
}

/** Big number for impact bands. True value is in the server HTML, never counts up from 0. */
export function Stat({ id, light = false }: { id: string; light?: boolean }) {
  const c = approvedClaim(id);
  if (!c) return null;
  return (
    <div data-stagger data-claim={c.id}>
      <div className={`font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight sm:text-6xl ${light ? "text-white" : "text-heading"}`}>{String(c.value)}</div>
      <div className={`mt-1 text-sm ${light ? "text-white/90" : "text-muted"}`}>{c.label}</div>
      <div className={`mt-0.5 font-mono text-[0.65rem] uppercase tracking-wider ${light ? "text-white/75" : "text-muted"}`}>As of {c.asOf}</div>
    </div>
  );
}
