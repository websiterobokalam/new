import { claims, type Claim } from "@/content/claims";

/** True only if a claim is complete enough to publish. */
export function isPublishable(c: Claim): boolean {
  return (
    c.approved &&
    !c.retired &&
    c.value !== null &&
    !!c.asOf &&
    !!c.evidence &&
    !!c.owner &&
    c.definition.length > 0
  );
}

export function getClaim(id: string): Claim | undefined {
  return claims.find((c) => c.id === id);
}

/** The approved, publishable claim, or null. Unknown ids throw in dev. */
export function approvedClaim(id: string): Claim | null {
  const c = getClaim(id);
  if (!c) {
    if (process.env.NODE_ENV !== "production") throw new Error(`Unknown claim id: ${id}`);
    return null;
  }
  return isPublishable(c) ? c : null;
}

export function claimText(c: Claim): string {
  return c.display.replace("{value}", String(c.value ?? ""));
}

export function approvedClaims(prefix: string): Claim[] {
  return claims.filter((c) => c.id.startsWith(prefix) && isPublishable(c));
}

export function claimsSummary() {
  const live = claims.filter((c) => !c.retired);
  return {
    total: live.length,
    approved: live.filter(isPublishable).length,
    pending: live.filter((c) => !isPublishable(c)).length,
    retired: claims.filter((c) => c.retired).length,
  };
}
