import { audit, system, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";

/**
 * The open marketplace starts only when fill rate, safety and parent
 * satisfaction meet agreed targets (brief, Phase 5), and a rising safety,
 * refund or complaint rate blocks growth. Targets are set by a person; until
 * a target is set, that measure counts as not met.
 */

export const WINDOW_DAYS = 60;

export type MetricId = "fill_rate" | "satisfaction" | "safety_rate" | "refund_rate" | "complaint_rate" | "min_sessions";
export const METRICS: { id: MetricId; label: string; better: "higher" | "lower"; unit: string; how: string }[] = [
  { id: "min_sessions", label: "Sessions delivered", better: "higher", unit: "sessions", how: "Delivered sessions in the window. Enough data to trust the other numbers." },
  { id: "fill_rate", label: "Gig fill rate", better: "higher", unit: "%", how: "Share of gigs that started in the window with a Kalamite confirmed. Onboarding gigs are left out." },
  { id: "satisfaction", label: "Parent satisfaction", better: "higher", unit: "/ 5", how: "Average verified parent rating (only parents whose child attended can rate)." },
  { id: "safety_rate", label: "Safety reports", better: "lower", unit: "per 100 sessions", how: "Safety, contact-detail, inappropriate-behaviour and bullying reports per 100 delivered sessions." },
  { id: "refund_rate", label: "Refund requests", better: "lower", unit: "%", how: "Refund requests as a share of paid orders." },
  { id: "complaint_rate", label: "Parent complaints", better: "lower", unit: "per 100 sessions", how: "Disputes raised by parents per 100 delivered sessions." },
];
const RISING_BLOCKS: MetricId[] = ["safety_rate", "refund_rate", "complaint_rate"];
/** "Rising" is judged only with enough sessions in both windows; tiny samples are noise (decision, PHASE-5.md). */
export const RISING_MIN_SESSIONS = 20;

type Values = Record<MetricId, { value: number | null; n: number }>;

async function measure(c: Tx, from: Date, to: Date): Promise<Values> {
  const one = async (sql: string, p: unknown[] = []) => (await c.query(sql, [from, to, ...p])).rows[0];
  const sessions = Number((await one("SELECT COUNT(*) AS n FROM gig_assignments WHERE status = 'delivered' AND delivered_at >= $1 AND delivered_at < $2")).n);
  const fill = await one(
    `SELECT COUNT(*) AS n, SUM(EXISTS (SELECT 1 FROM gig_assignments ga WHERE ga.gig_id = g.id AND ga.status IN ('accepted','delivered','no_show'))) AS filled
     FROM gigs g WHERE g.starts_at >= $1 AND g.starts_at < $2 AND g.starts_at < UTC_TIMESTAMP(3) AND g.status <> 'cancelled' AND g.kind NOT IN ('shadow','co_teach','own_course')`);
  const sat = await one("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE NOT hidden AND created_at >= $1 AND created_at < $2");
  const safety = Number((await one("SELECT COUNT(*) AS n FROM safety_reports WHERE category IN ('safety','contact_details','inappropriate','bullying') AND created_at >= $1 AND created_at < $2")).n);
  const orders = Number((await one("SELECT COUNT(*) AS n FROM orders WHERE status IN ('paid','refunded','partially_refunded') AND created_at >= $1 AND created_at < $2")).n);
  const refunds = Number((await one("SELECT COUNT(*) AS n FROM refund_requests WHERE created_at >= $1 AND created_at < $2")).n);
  const complaints = Number((await one("SELECT COUNT(*) AS n FROM disputes WHERE raised_role = 'parent' AND created_at >= $1 AND created_at < $2")).n);
  const per100 = (x: number) => (sessions ? (x * 100) / sessions : null);
  return {
    min_sessions: { value: sessions, n: sessions },
    fill_rate: { value: Number(fill.n) ? (Number(fill.filled) * 100) / Number(fill.n) : null, n: Number(fill.n) },
    satisfaction: { value: Number(sat.n) ? Number(sat.avg) : null, n: Number(sat.n) },
    safety_rate: { value: per100(safety), n: sessions },
    refund_rate: { value: orders ? (refunds * 100) / orders : null, n: orders },
    complaint_rate: { value: per100(complaints), n: sessions },
  };
}

export type Readiness = {
  window: { from: Date; to: Date };
  rows: { id: MetricId; label: string; unit: string; how: string; better: "higher" | "lower"; value: number | null; n: number; previous: number | null; target: number | null; setBy: string | null; setAt: Date | null; met: boolean; rising: boolean }[];
  overdueSafety: number;
  blockers: string[];
  ready: boolean;
  gate: { isOpen: boolean; changedAt: Date | null; note: string | null };
  /** Open for growth right now: a person opened it, and every condition still holds. */
  open: boolean;
};

export function evaluate(m: { better: "higher" | "lower"; value: number | null; target: number | null }) {
  if (m.target == null || m.value == null) return false;
  return m.better === "higher" ? m.value >= m.target : m.value <= m.target;
}

export async function readiness(now = new Date()): Promise<Readiness> {
  return system(async (c) => {
    const to = now;
    const from = new Date(to.getTime() - WINDOW_DAYS * 86400_000);
    const before = new Date(from.getTime() - WINDOW_DAYS * 86400_000);
    const [cur, prev] = [await measure(c, from, to), await measure(c, before, from)];
    const targets = Object.fromEntries((await c.query(
      "SELECT t.metric, t.target, t.set_at, a.display_name FROM market_targets t LEFT JOIN accounts a ON a.id = t.set_by")).rows.map((r) => [r.metric, r]));
    const overdueSafety = Number((await c.query("SELECT COUNT(*) AS n FROM safety_reports WHERE status = 'open' AND respond_by < UTC_TIMESTAMP(3)")).rows[0].n);
    const g = (await c.query("SELECT is_open, changed_at, note FROM market_gate WHERE id = 1")).rows[0] ?? { is_open: false };
    const rows = METRICS.map((m) => {
      const t = targets[m.id];
      const value = cur[m.id].value;
      const previous = prev[m.id].value;
      const target = t ? Number(t.target) : null;
      const rising = RISING_BLOCKS.includes(m.id) && value != null && previous != null && value > previous && cur.min_sessions.n >= RISING_MIN_SESSIONS && prev.min_sessions.n >= RISING_MIN_SESSIONS;
      return { ...m, value, n: cur[m.id].n, previous, target, setBy: t?.display_name ?? null, setAt: t?.set_at ?? null, met: evaluate({ better: m.better, value, target }), rising };
    });
    const blockers: string[] = [];
    for (const r of rows) {
      if (r.target == null) blockers.push(`No agreed target for ${r.label.toLowerCase()} yet`);
      else if (r.value == null) blockers.push(`No data yet for ${r.label.toLowerCase()}`);
      else if (!r.met) blockers.push(`${r.label} is ${fmt(r.value)} ${r.unit}; the target is ${r.better === "higher" ? "at least" : "at most"} ${fmt(r.target)}`);
      if (r.rising) blockers.push(`${r.label} is rising (${fmt(r.previous!)} → ${fmt(r.value!)} ${r.unit}), which blocks growth`);
    }
    if (overdueSafety) blockers.push(`${overdueSafety} safety report${overdueSafety > 1 ? "s are" : " is"} past the response time`);
    const ready = blockers.length === 0;
    return { window: { from, to }, rows, overdueSafety, blockers, ready, gate: { isOpen: !!g.is_open, changedAt: g.changed_at ?? null, note: g.note ?? null }, open: !!g.is_open && ready };
  });
}

export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1));

/** For growth actions (publishing Kalamite courses, opening cities, approving ambassadors). */
export async function requireMarketOpen() {
  const r = await readiness();
  if (!r.gate.isOpen) throw new HttpError(409, "The open marketplace isn't switched on yet. See Marketplace readiness.");
  if (!r.ready) throw new HttpError(409, `Growth is paused: ${r.blockers[0]}`);
  return r;
}

export async function setTarget(ops: Account, metric: MetricId, target: number, note?: string) {
  if (!METRICS.some((m) => m.id === metric)) throw new HttpError(422, "Unknown measure");
  return system(async (c) => {
    await c.query(
      `INSERT INTO market_targets (metric, target, set_by, note) VALUES ($1,$2,$3,$4)
       ON DUPLICATE KEY UPDATE target = VALUES(target), set_by = VALUES(set_by), set_at = CURRENT_TIMESTAMP(3), note = VALUES(note)`,
      [metric, target, ops.id, note ?? null],
    );
    await audit(c, ops.id, "market_target_set", "market", metric, { target, note: note ?? null });
  });
}

/** A person opens or closes the marketplace. Opening needs every condition met. Closing is always allowed. */
export async function setGate(ops: Account, open: boolean, note: string) {
  if (note.trim().length < 5) throw new HttpError(422, "Write down why", { fields: { note: "Required" } });
  if (open) {
    const r = await readiness();
    if (!r.ready) throw new HttpError(409, `Not ready: ${r.blockers[0]}`);
  }
  return system(async (c) => {
    await c.query("UPDATE market_gate SET is_open = $1, changed_by = $2, changed_at = UTC_TIMESTAMP(3), note = $3 WHERE id = 1", [open, ops.id, note]);
    await audit(c, ops.id, open ? "market_opened" : "market_closed", "market", "gate", { note });
  });
}
