import { randomBytes } from "node:crypto";
import { audit, insertOnce, system, uuid, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { requireFellow } from "../fellows/core";
import { addEarning } from "../fellows/pay";
import { requireMarketOpen } from "./gate";
import { ambassadorChanged } from "../email/notify";

/**
 * Campus Ambassadors: live Fellows who help classmates at their college apply.
 * They recruit Fellows only, never families or children (brief: no educator
 * incentives for converting a family). Any reward is per referred Fellow who
 * goes live, from an approved rate, and is never shown unless approved.
 */

export const AMBASSADOR_RULES = { minSessions: 5 } as const;

export const REFERRAL_RATE_KIND = "ambassador_referral";

export async function referralReward(c: Tx): Promise<number | null> {
  const r = (await c.query("SELECT per_session_paise AS p FROM rate_card WHERE gig_kind = $1 AND approved AND effective_at <= UTC_TIMESTAMP(3)", [REFERRAL_RATE_KIND])).rows[0];
  return r ? Number(r.p) : null;
}

export async function ambassadorChecks(c: Tx, fellowId: string) {
  const f = (await c.query("SELECT status FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
  const delivered = Number((await c.query("SELECT COUNT(*) AS n FROM gig_assignments WHERE fellow_id = $1 AND status = 'delivered'", [fellowId])).rows[0].n);
  const openCase = !!(await c.query("SELECT 1 FROM removal_cases WHERE fellow_id = $1 AND status = 'notice'", [fellowId])).rows[0];
  const checks = [
    { label: "Live Kalam Fellow", ok: f?.status === "live", detail: f ? `You are ${f.status}` : "" },
    { label: `${AMBASSADOR_RULES.minSessions} sessions delivered`, ok: delivered >= AMBASSADOR_RULES.minSessions, detail: `${delivered} so far` },
    { label: "No open removal case", ok: !openCase, detail: openCase ? "A case is open" : "None" },
  ];
  return { ok: checks.every((x) => x.ok), checks };
}

export async function applyAmbassador(a: Account, collegeId: string, pitch: string) {
  await requireFellow(a);
  return system(async (c) => {
    const elig = await ambassadorChecks(c, a.id);
    if (!elig.ok) throw new HttpError(409, `Not yet: ${elig.checks.find((k) => !k.ok)!.label}`);
    if (!(await c.query("SELECT 1 FROM colleges WHERE id = $1", [collegeId])).rows[0]) throw new HttpError(422, "Pick your college from the list");
    const code = randomBytes(5).toString("base64url").toUpperCase().replace(/[^A-Z0-9]/g, "X").slice(0, 8);
    const wrote = await insertOnce(c, "INSERT INTO ambassadors (fellow_id, college_id, code, pitch) VALUES ($1,$2,$3,$4)", [a.id, collegeId, code, pitch]);
    if (!wrote) throw new HttpError(409, "You have already applied");
    await audit(c, a.id, "ambassador_applied", "ambassador", a.id);
    await ambassadorChanged(c, a.id);
  });
}

/** Approving an ambassador is growth: only while the marketplace is open. Pausing or declining is always allowed. */
export async function decideAmbassador(ops: Account, fellowId: string, to: "active" | "declined" | "paused" | "ended", note: string) {
  if (note.trim().length < 5) throw new HttpError(422, "Write a note the Fellow will read", { fields: { note: "Required" } });
  if (to === "active") await requireMarketOpen();
  return system(async (c) => {
    const r = await c.query("UPDATE ambassadors SET status = $2, decided_by = $3, decided_at = UTC_TIMESTAMP(3), decision_note = $4 WHERE fellow_id = $1", [fellowId, to, ops.id, note]);
    if (!r.affectedRows) throw new HttpError(404, "Not found");
    await audit(c, ops.id, `ambassador_${to}`, "ambassador", fellowId);
    await ambassadorChanged(c, fellowId);
  });
}

/** Record a valid referral code on a new application. Self-referral and inactive codes are ignored. */
export async function recordReferral(c: Tx, fellowId: string, code: string | undefined) {
  if (!code) return;
  const amb = (await c.query("SELECT fellow_id FROM ambassadors WHERE code = $1 AND status = 'active'", [code.toUpperCase()])).rows[0];
  if (!amb || amb.fellow_id === fellowId) return;
  await c.query("UPDATE fellows SET referred_by = $2 WHERE account_id = $1 AND referred_by IS NULL", [fellowId, code.toUpperCase()]);
}

/** Called when a Fellow goes live: pay the referring ambassador, once, if a reward is approved. */
export async function rewardReferral(c: Tx, fellowId: string) {
  const f = (await c.query("SELECT f.referred_by, a.fellow_id AS amb FROM fellows f JOIN ambassadors a ON a.code = f.referred_by WHERE f.account_id = $1", [fellowId])).rows[0];
  if (!f) return;
  const reward = await referralReward(c);
  if (!reward) return;
  await addEarning(c, f.amb, { kind: "referral", description: `Referral ${f.referred_by} · Fellow ${fellowId.slice(0, 8)} went live`, gross: reward });
}

/** The ambassador's own view: counts by stage only. No applicant names or contact details. */
export async function ambassadorView(a: Account) {
  return system(async (c) => {
    const amb = (await c.query("SELECT am.*, co.name AS college FROM ambassadors am JOIN colleges co ON co.id = am.college_id WHERE am.fellow_id = $1", [a.id])).rows[0] ?? null;
    const stages = amb ? (await c.query("SELECT status, COUNT(*) AS n FROM fellows WHERE referred_by = $1 GROUP BY status", [amb.code])).rows : [];
    const events = amb ? (await c.query("SELECT * FROM ambassador_events WHERE fellow_id = $1 ORDER BY planned_at DESC", [a.id])).rows : [];
    return { amb, stages, events, checks: await ambassadorChecks(c, a.id), reward: await referralReward(c) };
  });
}

export async function proposeEvent(a: Account, i: { title: string; plannedAt: string; venue: string }) {
  return system(async (c) => {
    const amb = (await c.query("SELECT status FROM ambassadors WHERE fellow_id = $1", [a.id])).rows[0];
    if (amb?.status !== "active") throw new HttpError(409, "Only active ambassadors can propose events");
    if (new Date(i.plannedAt).getTime() < Date.now() + 3 * 86400_000) throw new HttpError(422, "Propose events at least 3 days ahead", { fields: { plannedAt: "Too soon" } });
    const id = uuid();
    await c.query("INSERT INTO ambassador_events (id, fellow_id, title, planned_at, venue) VALUES ($1,$2,$3,$4,$5)", [id, a.id, i.title, new Date(i.plannedAt), i.venue]);
    await audit(c, a.id, "ambassador_event_proposed", "ambassador_event", id);
    return id;
  });
}

export async function decideEvent(ops: Account, id: string, to: "approved" | "declined", note: string) {
  return system(async (c) => {
    const r = await c.query("UPDATE ambassador_events SET status = $2, decided_by = $3, note = $4 WHERE id = $1 AND status = 'proposed'", [id, to, ops.id, note || null]);
    if (!r.affectedRows) throw new HttpError(409, "Already decided");
    await audit(c, ops.id, `ambassador_event_${to}`, "ambassador_event", id);
  });
}

export async function markEventHeld(a: Account, id: string, attendees: number) {
  return system(async (c) => {
    const r = await c.query("UPDATE ambassador_events SET status = 'held', attendees = $3 WHERE id = $1 AND fellow_id = $2 AND status = 'approved' AND planned_at <= UTC_TIMESTAMP(3) + INTERVAL 1 DAY", [id, a.id, attendees]);
    if (!r.affectedRows) throw new HttpError(409, "You can mark an approved event as held on or after its day");
    await audit(c, a.id, "ambassador_event_held", "ambassador_event", id, { attendees });
  });
}
