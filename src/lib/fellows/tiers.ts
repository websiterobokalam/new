import type { Tx } from "../db";

/**
 * TIER FORMULA (published to Kalamites). DRAFT thresholds for ops to approve.
 * Inputs: reliability, learner progress and verified parent feedback.
 * Not inputs: popularity, hours volume, declines, Exam Mode, or any personal
 * characteristic. Tiers are suggested by this formula and confirmed by a
 * person. They are never lowered automatically.
 */
export const TIER_RULES = [
  { tier: "fellow", delivered: 10, reliability: 0.9, rating: null, reviews: 0, progress: 0 },
  { tier: "senior", delivered: 40, reliability: 0.95, rating: 4.3, reviews: 10, progress: 0.3 },
  { tier: "lead", delivered: 100, reliability: 0.97, rating: 4.5, reviews: 25, progress: 0.5 },
] as const;

export type Metrics = { delivered: number; noShows: number; reliability: number | null; progress: number | null; rating: number | null; reviews: number };

export function suggestTier(m: Metrics): string {
  let tier = "apprentice";
  for (const r of TIER_RULES) {
    const ok = m.delivered >= r.delivered && (m.reliability ?? 0) >= r.reliability && (r.rating === null || (m.reviews >= r.reviews && (m.rating ?? 0) >= r.rating)) && (m.progress ?? 0) >= r.progress;
    if (ok) tier = r.tier;
  }
  return tier;
}

export async function metrics(c: Tx, fellowId: string): Promise<Metrics> {
  const a = (await c.query(
    `SELECT COALESCE(SUM(status = 'delivered'), 0) AS delivered, COALESCE(SUM(status = 'no_show'), 0) AS no_shows
     FROM gig_assignments WHERE fellow_id = $1 AND status IN ('delivered','no_show')`,
    [fellowId],
  )).rows[0];
  const p = (await c.query(
    `SELECT count(*) AS builds FROM learner_progress lp WHERE lp.reviewed_by = CONCAT('fellow:', $1)`,
    [fellowId],
  )).rows[0];
  const r = (await c.query("SELECT avg(rating) AS rating, count(*) AS n FROM reviews WHERE fellow_id = $1 AND NOT hidden", [fellowId])).rows[0];
  const committed = a.delivered + a.no_shows;
  return {
    delivered: a.delivered, noShows: a.no_shows,
    reliability: committed ? a.delivered / committed : null,
    progress: a.delivered ? p.builds / a.delivered : null,
    rating: r.n ? Math.round(r.rating * 10) / 10 : null, reviews: r.n,
  };
}
