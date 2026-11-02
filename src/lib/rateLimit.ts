/**
 * Fixed-window rate limiter. In-memory, per server instance: fine for a single
 * Node server in Phase 1. Swap for a shared store (Redis) before scaling out.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return { ok: true, retryAfter: 0 };
  }
  h.n++;
  return h.n > limit ? { ok: false, retryAfter: Math.ceil((h.reset - now) / 1000) } : { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
