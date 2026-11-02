import { system } from "../db";
import { asAccount, type Account } from "../auth/session";
import { FellowError } from "./core";

/** Same patterns the database trigger uses; checked here first so the sender gets a clear message. */
export const CONTACT_PATTERN = /(\+?\d[\d\s().-]{7,}\d)|([\w.%+-]+@[\w.-]+\.[a-z]{2,})|(https?:\/\/|www\.)|\b(whats ?app|wa\.me|insta(gram)?|snap(chat)?|telegram|t\.me|facebook|fb\.com|discord)\b|(^|\s)@[\w.]{3,}/i;
export const hasContactDetails = (s: string) => CONTACT_PATTERN.test(s);

/** Threads: one per (batch, parent, Fellow). Created when either side opens it. */
export async function threadsFor(a: Account) {
  return asAccount(a, async (c) => (await c.query(
    `SELECT t.id, co.title, b.starts_at, f.display_name AS fellow_name, (a.id = t.guardian_account_id) AS i_am_parent,
            (SELECT body FROM messages m WHERE m.thread_id = t.id ORDER BY m.id DESC LIMIT 1) AS last
     FROM message_threads t JOIN batches b ON b.id = t.batch_id JOIN courses co ON co.id = b.course_id JOIN fellow_profiles f ON f.id = t.fellow_id JOIN accounts a ON a.id = $1
     ORDER BY t.created_at DESC`,
    [a.id],
  )).rows);
}

export async function openThread(a: Account, bookingId: string) {
  // Parent side: the booking must be theirs and the batch must have a Fellow.
  const b = await asAccount(a, async (c) => (await c.query("SELECT bk.batch_id, bt.educator_fellow_id FROM bookings bk JOIN batches bt ON bt.id = bk.batch_id WHERE bk.id = $1", [bookingId])).rows[0]);
  if (!b?.educator_fellow_id) throw new FellowError(404, "No educator assigned to this class yet");
  return system(async (c) => (await c.query(
    `INSERT INTO message_threads (batch_id, guardian_account_id, fellow_id) VALUES ($1,$2,$3)
     ON CONFLICT (batch_id, guardian_account_id, fellow_id) DO UPDATE SET batch_id = EXCLUDED.batch_id RETURNING id`,
    [b.batch_id, a.id, b.educator_fellow_id],
  )).rows[0].id as string);
}

export async function thread(a: Account, threadId: string) {
  return asAccount(a, async (c) => {
    const t = (await c.query("SELECT t.id, f.display_name AS fellow_name, co.title FROM message_threads t JOIN fellow_profiles f ON f.id = t.fellow_id JOIN batches b ON b.id = t.batch_id JOIN courses co ON co.id = b.course_id WHERE t.id = $1", [threadId])).rows[0];
    if (!t) return null;
    const msgs = (await c.query("SELECT id, body, blocked, created_at, sender_account_id = $2 AS mine FROM messages WHERE thread_id = $1 ORDER BY id", [threadId, a.id])).rows;
    return { ...t, messages: msgs };
  });
}

/** Send. Contact details are blocked (never delivered) and flagged to Safeguarding.
 * The app check and the database trigger can each only switch blocking on, never off. */
export async function send(a: Account, threadId: string, body: string) {
  const flagged = hasContactDetails(body);
  const row = await asAccount(a, async (c) => (await c.query("INSERT INTO messages (thread_id, sender_account_id, body, blocked) VALUES ($1,$2,$3,$4) RETURNING id, blocked", [threadId, a.id, body, flagged])).rows[0]);
  if (row.blocked) {
    await system((c) => c.query("INSERT INTO safety_reports (reporter_account_id, page, category, details, respond_by) VALUES (NULL, $1, 'contact_details', $2, now() + interval '24 hours')", [`/messages/${threadId}`, `Message ${row.id} blocked automatically: it looked like it contained contact details.`]));
    return { delivered: false };
  }
  return { delivered: true };
}

/** Reviews: only a verified parent, for an attended session the Fellow delivered (enforced by RLS too). */
export async function review(a: Account, bookingId: string, rating: number, body: string | null) {
  // The parent can see their booking (RLS); which Fellow taught it is looked up as a server task.
  const own = await asAccount(a, async (c) => (await c.query("SELECT batch_id FROM bookings WHERE id = $1 AND status = 'attended'", [bookingId])).rows[0]);
  if (!own) throw new FellowError(403, "Reviews are for sessions your child attended");
  const f = await system(async (c) => (await c.query("SELECT ga.fellow_id FROM gigs g JOIN gig_assignments ga ON ga.gig_id = g.id AND ga.status = 'delivered' WHERE g.batch_id = $1 LIMIT 1", [own.batch_id])).rows[0]);
  if (!f) throw new FellowError(403, "Reviews are for sessions a Fellow delivered");
  return asAccount(a, async (c) => {
    await c.query("INSERT INTO reviews (booking_id, fellow_id, guardian_account_id, rating, body) VALUES ($1,$2,$3,$4,$5)", [bookingId, f.fellow_id, a.id, rating, body]).catch((e) => {
      if (e.code === "23505") throw new FellowError(409, "You already reviewed this session");
      throw e;
    });
  });
}

export async function raiseDispute(a: Account, role: "fellow" | "parent", subject: string, details: string, ref?: string) {
  return asAccount(a, async (c) => (await c.query("INSERT INTO disputes (raised_by, raised_role, subject, details, ref) VALUES ($1,$2,$3,$4,$5) RETURNING id", [a.id, role, subject, details, ref ?? null])).rows[0].id as string);
}

/**
 * Removal case. Written reasons and 7 days' notice, with an enquiry and the
 * Fellow's response, before any removal. Only the Safeguarding role can mark
 * a case as child safety, which suspends access at once.
 */
export async function openRemovalCase(staff: Account, fellowId: string, reasons: string, childSafety: boolean) {
  if (childSafety && staff.role !== "safeguarding") throw new FellowError(403, "Only the Safeguarding Lead can open a child-safety case");
  return system(async (c) => {
    const { rows } = await c.query(
      "INSERT INTO removal_cases (fellow_id, reasons, child_safety, opened_by, notice_until) VALUES ($1,$2,$3,$4, now() + CASE WHEN $3 THEN interval '0' ELSE interval '7 days' END) RETURNING id, notice_until",
      [fellowId, reasons, childSafety, staff.id],
    );
    if (childSafety) await suspend(c, fellowId);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'removal_case_opened','fellow',$2,$3)", [staff.id, fellowId, { childSafety }]);
    return rows[0];
  });
}

async function suspend(c: import("../db").Tx, fellowId: string) {
  await c.query("UPDATE fellows SET status = 'suspended' WHERE account_id = $1", [fellowId]);
  // Hand back every upcoming gig and unassign batches.
  await c.query("UPDATE gig_assignments ga SET status = 'cancelled' FROM gigs g WHERE g.id = ga.gig_id AND ga.fellow_id = $1 AND ga.status = 'accepted' AND g.starts_at > now()", [fellowId]);
  await c.query("UPDATE gigs SET status = 'open' WHERE status = 'filled' AND starts_at > now() AND id IN (SELECT gig_id FROM gig_assignments WHERE fellow_id = $1 AND status = 'cancelled')", [fellowId]);
  await c.query("UPDATE batches SET educator_fellow_id = NULL WHERE educator_fellow_id = $1 AND starts_at > now()", [fellowId]);
  await c.query("UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL", [fellowId]);
}

export async function decideRemovalCase(staff: Account, caseId: string, decision: "removed" | "reinstated", enquiryNotes: string) {
  return system(async (c) => {
    const k = (await c.query("SELECT fellow_id, child_safety, notice_until > now() AS in_notice FROM removal_cases WHERE id = $1 AND status = 'notice'", [caseId])).rows[0];
    if (!k) throw new FellowError(404, "Open case not found");
    if (decision === "removed" && k.in_notice && !k.child_safety) throw new FellowError(409, "The 7-day notice period has not ended");
    await c.query("UPDATE removal_cases SET status = $2, enquiry_notes = $3, decided_at = now() WHERE id = $1", [caseId, decision, enquiryNotes]);
    if (decision === "removed") { await suspend(c, k.fellow_id); await c.query("UPDATE fellows SET status = 'removed' WHERE account_id = $1", [k.fellow_id]); }
    if (decision === "reinstated") await c.query("UPDATE fellows SET status = 'live' WHERE account_id = $1 AND status = 'suspended'", [k.fellow_id]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'removal_case_decided','fellow',$2,$3)", [staff.id, k.fellow_id, { decision }]);
  });
}
