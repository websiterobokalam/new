import { audit, system, uuid, insertOnce, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { weekStartIST } from "../fellows/pay";
import { createGig } from "../fellows/gigs";
import { PILOT } from "../fellows/core";
import { schoolRequestChanged, staffAdded, ticketChanged } from "../email/notify";
import { sendVerification } from "../email/verify";

/**
 * Schools, staff, timetable, hardware tickets and Kalamite requests.
 * Every query is scoped to the caller's school. Student names never enter
 * this database: rosters are read live from 21cschool, attendance is a count.
 */

export type Staff = { accountId: string; schoolId: string; role: "school_admin" | "trainer"; displayName: string; schoolName: string; city: string; slaHours: number; aadhyaTenant: string | null; erpRef: string | null };

export const DEFAULT_SLA_HOURS = Number(process.env.HARDWARE_SLA_HOURS ?? 72);
/** Lead time so ops can schedule and a Kalamite can plan (decision, see PHASE-4.md). */
export const REQUEST_LEAD_HOURS = 48;

export async function staffFor(a: Account): Promise<Staff | null> {
  if (a.role !== "school_admin" && a.role !== "trainer") return null;
  return system(async (c) => {
    const r = (await c.query(
      `SELECT st.account_id, st.school_id, st.role, st.display_name, s.name, s.city, s.sla_hours, s.aadhya_tenant, s.erp_school_ref
       FROM school_staff st JOIN schools s ON s.id = st.school_id
       WHERE st.account_id = $1 AND st.removed_at IS NULL AND s.status <> 'ended'`,
      [a.id],
    )).rows[0];
    return r ? { accountId: r.account_id, schoolId: r.school_id, role: r.role, displayName: r.display_name, schoolName: r.name, city: r.city, slaHours: r.sla_hours, aadhyaTenant: r.aadhya_tenant, erpRef: r.erp_school_ref } : null;
  });
}

export async function requireStaff(a: Account, ...roles: Staff["role"][]) {
  const s = await staffFor(a);
  if (!s || (roles.length && !roles.includes(s.role))) throw new HttpError(403, "Not allowed");
  return s;
}

const schoolAudit = (c: Tx, actor: string, action: string, entity: string, id: string, schoolId: string, meta: Record<string, unknown> = {}) =>
  audit(c, actor, action, entity, id, { school: schoolId, ...meta });

/* ------------------------------ Ops setup ------------------------------ */

export async function createSchool(ops: Account, i: { name: string; city: string; board?: string; slaHours: number; aadhyaTenant?: string; erpRef?: string; adminPhone: string; adminName: string; adminEmail?: string }) {
  return system(async (c) => {
    const id = uuid();
    await c.query("INSERT INTO schools (id, name, city, board, sla_hours, aadhya_tenant, erp_school_ref, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [id, i.name, i.city, i.board ?? null, i.slaHours, i.aadhyaTenant ?? null, i.erpRef ?? null, ops.id]);
    await addStaffIn(c, ops.id, id, { phone: i.adminPhone, name: i.adminName, role: "school_admin", email: i.adminEmail });
    await schoolAudit(c, ops.id, "school_created", "school", id, id);
    return id;
  });
}

export async function addLab(ops: Account, schoolId: string, i: { name: string; room?: string; installedOn?: string }) {
  return system(async (c) => {
    const id = uuid();
    await c.query("INSERT INTO labs (id, school_id, name, room, installed_on) VALUES ($1,$2,$3,$4,$5)", [id, schoolId, i.name, i.room ?? null, i.installedOn ?? null]);
    await schoolAudit(c, ops.id, "lab_added", "lab", id, schoolId);
    return id;
  });
}

export async function addAsset(ops: Account, labId: string, i: { kind: string; label: string; serial?: string; count?: number }) {
  return system(async (c) => {
    const lab = (await c.query("SELECT school_id FROM labs WHERE id = $1", [labId])).rows[0];
    if (!lab) throw new HttpError(404, "Lab not found");
    for (let n = 1; n <= (i.count ?? 1); n++) {
      await c.query("INSERT INTO lab_assets (id, lab_id, kind, label, serial) VALUES ($1,$2,$3,$4,$5)",
        [uuid(), labId, i.kind, (i.count ?? 1) > 1 ? `${i.label} #${n}` : i.label, i.serial ?? null]);
    }
    await schoolAudit(c, ops.id, "assets_added", "lab", labId, lab.school_id, { count: i.count ?? 1, kind: i.kind });
  });
}

/* ------------------------------ Staff ------------------------------ */

async function addStaffIn(c: Tx, actorId: string, schoolId: string, i: { phone: string; name: string; role: Staff["role"]; email?: string }) {
  const existing = (await c.query("SELECT id, role FROM accounts WHERE phone_e164 = $1", [i.phone])).rows[0];
  let accountId: string;
  if (existing) {
    const staffRow = (await c.query("SELECT school_id, removed_at FROM school_staff WHERE account_id = $1", [existing.id])).rows[0];
    const reusable = (existing.role === "trainer" || existing.role === "school_admin") && (!staffRow || staffRow.removed_at);
    if (!reusable) {
      throw new HttpError(409, staffRow && !staffRow.removed_at
        ? "This number is already on a school's staff list."
        : "This number already has a different Robokalam account (for example a parent or Kalamite). Use another number for school work.");
    }
    accountId = existing.id;
    await c.query("UPDATE accounts SET role = $2, display_name = $3 WHERE id = $1", [accountId, i.role, i.name]);
    await c.query("DELETE FROM school_staff WHERE account_id = $1", [accountId]);
  } else {
    accountId = uuid();
    await c.query("INSERT INTO accounts (id, phone_e164, role, display_name, adult_declared_at) VALUES ($1,$2,$3,$4, UTC_TIMESTAMP(3))", [accountId, i.phone, i.role, i.name]);
  }
  await c.query("INSERT INTO school_staff (account_id, school_id, role, display_name, added_by) VALUES ($1,$2,$3,$4,$5)", [accountId, schoolId, i.role, i.name, actorId]);
  await schoolAudit(c, actorId, "staff_added", "account", accountId, schoolId, { role: i.role });
  // New staff confirm their email by link; staff whose email is already confirmed get a welcome now.
  if (i.email) await sendVerification(c, accountId, i.email, i.name);
  await staffAdded(c, accountId);
  return accountId;
}

export async function addStaff(admin: Account, i: { phone: string; name: string; role: Staff["role"]; email?: string }) {
  const s = await requireStaff(admin, "school_admin");
  return system((c) => addStaffIn(c, admin.id, s.schoolId, i));
}

export async function removeStaff(admin: Account, accountId: string) {
  const s = await requireStaff(admin, "school_admin");
  if (accountId === admin.id) throw new HttpError(409, "You can't remove yourself. Ask another admin or Robokalam.");
  return system(async (c) => {
    const r = (await c.query("SELECT role FROM school_staff WHERE account_id = $1 AND school_id = $2 AND removed_at IS NULL", [accountId, s.schoolId])).rows[0];
    if (!r) throw new HttpError(404, "Not on your staff list");
    await c.query("UPDATE school_staff SET removed_at = UTC_TIMESTAMP(3) WHERE account_id = $1", [accountId]);
    await c.query("UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE account_id = $1 AND revoked_at IS NULL", [accountId]);
    await c.query("UPDATE school_classes SET trainer_account_id = NULL WHERE trainer_account_id = $1", [accountId]);
    await schoolAudit(c, admin.id, "staff_removed", "account", accountId, s.schoolId);
  });
}

/* ------------------------------ Timetable ------------------------------ */

export async function addClass(admin: Account, i: { labId: string; label: string; grade: number; world: string; weekday: number; startTime: string; durationMin: number; students: number; trainerId?: string; erpClassRef?: string }) {
  const s = await requireStaff(admin, "school_admin");
  return system(async (c) => {
    await assertLab(c, i.labId, s.schoolId);
    if (i.trainerId) await assertTrainer(c, i.trainerId, s.schoolId);
    const id = uuid();
    await c.query(
      "INSERT INTO school_classes (id, school_id, lab_id, label, grade, world, weekday, start_time, duration_min, students, trainer_account_id, erp_class_ref) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [id, s.schoolId, i.labId, i.label, i.grade, i.world, i.weekday, i.startTime, i.durationMin, i.students, i.trainerId ?? null, i.erpClassRef ?? null],
    );
    await schoolAudit(c, admin.id, "class_added", "class", id, s.schoolId);
    return id;
  });
}

export async function assignTrainer(admin: Account, classId: string, trainerId: string | null) {
  const s = await requireStaff(admin, "school_admin");
  return system(async (c) => {
    if (trainerId) await assertTrainer(c, trainerId, s.schoolId);
    const r = await c.query("UPDATE school_classes SET trainer_account_id = $3 WHERE id = $1 AND school_id = $2", [classId, s.schoolId, trainerId]);
    if (!r.affectedRows) throw new HttpError(404, "Class not found");
    await schoolAudit(c, admin.id, "trainer_assigned", "class", classId, s.schoolId, { trainer: trainerId });
  });
}

async function assertLab(c: Tx, labId: string, schoolId: string) {
  if (!(await c.query("SELECT 1 FROM labs WHERE id = $1 AND school_id = $2", [labId, schoolId])).rows[0]) throw new HttpError(404, "Lab not found");
}
async function assertTrainer(c: Tx, id: string, schoolId: string) {
  if (!(await c.query("SELECT 1 FROM school_staff WHERE account_id = $1 AND school_id = $2 AND removed_at IS NULL", [id, schoolId])).rows[0]) throw new HttpError(422, "Pick someone on your staff list");
}

/** IST wall-clock date (YYYY-MM-DD) + HH:MM[:SS] → UTC Date. */
export function istToUtc(date: string, time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(`${date}T00:00:00Z`);
  return new Date(d.getTime() + (h * 60 + m) * 60_000 - 5.5 * 3600_000);
}
/** IST calendar date of a UTC instant. */
export const istDate = (d: Date) => new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

export type SessionRow = {
  id: string; class_id: string; starts_at: Date; status: string; lesson_title: string | null; present: number | null; total: number | null;
  label: string; grade: number; world: string; duration_min: number; students: number; lab: string; trainer: string | null; trainer_account_id: string | null; erp_class_ref: string | null;
};

/** Make sure this week's sessions exist for every active class, then list them. */
export async function weekSessions(schoolId: string, opts: { trainerId?: string; weekOf?: Date } = {}): Promise<SessionRow[]> {
  const start = weekStartIST(opts.weekOf);
  const monday = istDate(start);
  return system(async (c) => {
    const classes = (await c.query("SELECT id, weekday, start_time FROM school_classes WHERE school_id = $1 AND active", [schoolId])).rows;
    for (const k of classes) {
      const day = new Date(`${monday}T00:00:00Z`);
      day.setUTCDate(day.getUTCDate() + (k.weekday - 1));
      const at = istToUtc(day.toISOString().slice(0, 10), String(k.start_time));
      await insertOnce(c, "INSERT INTO class_sessions (id, class_id, starts_at) VALUES ($1,$2,$3)", [uuid(), k.id, at]);
    }
    return (await c.query(
      `SELECT cs.id, cs.class_id, cs.starts_at, cs.status, cs.lesson_title, cs.present, cs.total,
              k.label, k.grade, k.world, k.duration_min, k.students, k.trainer_account_id, k.erp_class_ref, l.name AS lab, st.display_name AS trainer
       FROM class_sessions cs JOIN school_classes k ON k.id = cs.class_id JOIN labs l ON l.id = k.lab_id
       LEFT JOIN school_staff st ON st.account_id = k.trainer_account_id
       WHERE k.school_id = $1 AND cs.starts_at >= $2 AND cs.starts_at < $3 ${opts.trainerId ? "AND k.trainer_account_id = $4" : ""}
       ORDER BY cs.starts_at`,
      opts.trainerId ? [schoolId, start, new Date(start.getTime() + 7 * 86400_000), opts.trainerId] : [schoolId, start, new Date(start.getTime() + 7 * 86400_000)],
    )).rows;
  });
}

/** A trainer's own session (only classes assigned to them). */
export async function trainerSession(a: Account, sessionId: string) {
  const s = await requireStaff(a, "trainer", "school_admin");
  return system(async (c) => (await c.query(
    `SELECT cs.*, k.label, k.grade, k.world, k.duration_min, k.students, k.erp_class_ref, k.trainer_account_id, l.name AS lab
     FROM class_sessions cs JOIN school_classes k ON k.id = cs.class_id JOIN labs l ON l.id = k.lab_id
     WHERE cs.id = $1 AND k.school_id = $2 AND (k.trainer_account_id = $3 OR $4 = 'school_admin')`,
    [sessionId, s.schoolId, a.id, s.role],
  )).rows[0] ?? null);
}

export async function recordSession(a: Account, sessionId: string, i: { status: "held" | "cancelled"; present?: number; total?: number; lessonTitle?: string; notes?: string; erpReceipt?: string }) {
  const s = await requireStaff(a, "trainer", "school_admin");
  const row = await trainerSession(a, sessionId);
  if (!row) throw new HttpError(404, "Not your class");
  if (new Date(row.starts_at).getTime() > Date.now() + 15 * 60_000) throw new HttpError(409, "You can record a class once it has started");
  if (i.status === "held" && (i.present == null || i.total == null)) throw new HttpError(422, "Enter how many students were present");
  if (i.present != null && i.total != null && i.present > i.total) throw new HttpError(422, "Present can't be more than the class size", { fields: { present: "Too many" } });
  return system(async (c) => {
    await c.query(
      `UPDATE class_sessions SET status = $2, present = $3, total = $4, lesson_title = COALESCE($5, lesson_title), notes = $6, erp_receipt = $7, recorded_by = $8, recorded_at = UTC_TIMESTAMP(3) WHERE id = $1`,
      [sessionId, i.status, i.status === "held" ? i.present : null, i.status === "held" ? i.total : null, i.lessonTitle ?? null, i.notes ?? null, i.erpReceipt ?? null, a.id],
    );
    await schoolAudit(c, a.id, i.status === "held" ? "class_held" : "class_cancelled", "class_session", sessionId, s.schoolId, { present: i.present ?? null, total: i.total ?? null });
  });
}

/* ------------------------------ Hardware tickets ------------------------------ */

export { ticketClock, type Clock } from "./clock";
import { ticketClock } from "./clock";

export async function raiseTicket(a: Account, i: { labId: string; assetId?: string; category: string; summary: string; details?: string }) {
  const s = await requireStaff(a);
  return system(async (c) => {
    await assertLab(c, i.labId, s.schoolId);
    if (i.assetId && !(await c.query("SELECT 1 FROM lab_assets WHERE id = $1 AND lab_id = $2", [i.assetId, i.labId])).rows[0]) throw new HttpError(422, "That item isn't in this lab");
    await c.query("UPDATE counters SET value = value + 1 WHERE name = 'hw_ticket'");
    const seq = Number((await c.query("SELECT value AS n FROM counters WHERE name = 'hw_ticket'")).rows[0].n);
    const id = uuid();
    const ref = `HW-${String(seq).padStart(5, "0")}`;
    const raised = new Date(Math.floor(Date.now() / 1000) * 1000);
    await c.query(
      `INSERT INTO hardware_tickets (id, ref, school_id, lab_id, asset_id, raised_by, category, summary, details, sla_hours, raised_at, due_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, $11 + INTERVAL $10 HOUR)`,
      [id, ref, s.schoolId, i.labId, i.assetId ?? null, a.id, i.category, i.summary, i.details ?? null, s.slaHours, raised],
    );
    if (i.assetId) await c.query("UPDATE lab_assets SET status = 'faulty', updated_at = UTC_TIMESTAMP(3) WHERE id = $1", [i.assetId]);
    await c.query("INSERT INTO hardware_ticket_events (ticket_id, actor_account_id, status, note) VALUES ($1,$2,'open',$3)", [id, a.id, i.summary]);
    await schoolAudit(c, a.id, "ticket_raised", "hardware_ticket", id, s.schoolId, { ref });
    await ticketChanged(c, id);
    return { id, ref };
  });
}

const OPS_NEXT: Record<string, string[]> = { open: ["acknowledged", "dispatched", "resolved"], acknowledged: ["dispatched", "resolved"], dispatched: ["resolved"] };

export async function opsTicketAction(ops: Account, id: string, to: "acknowledged" | "dispatched" | "resolved", note: string) {
  return system(async (c) => {
    const t = (await c.query("SELECT * FROM hardware_tickets WHERE id = $1 FOR UPDATE", [id])).rows[0];
    if (!t) throw new HttpError(404, "Ticket not found");
    if (!OPS_NEXT[t.status]?.includes(to)) throw new HttpError(409, `A ${t.status} ticket can't move to ${to}`);
    if (to === "resolved" && note.trim().length < 5) throw new HttpError(422, "Say what was fixed or replaced", { fields: { note: "Required" } });
    await c.query(
      `UPDATE hardware_tickets SET status = $2,
         acknowledged_at = COALESCE(acknowledged_at, UTC_TIMESTAMP(3)),
         resolved_at = IF($2 = 'resolved', UTC_TIMESTAMP(3), resolved_at),
         resolution = IF($2 = 'resolved', $3, resolution)
       WHERE id = $1`,
      [id, to, note],
    );
    if (to === "resolved" && t.asset_id) await c.query("UPDATE lab_assets SET status = 'working', updated_at = UTC_TIMESTAMP(3) WHERE id = $1", [t.asset_id]);
    await c.query("INSERT INTO hardware_ticket_events (ticket_id, actor_account_id, status, note) VALUES ($1,$2,$3,$4)", [id, ops.id, to, note || null]);
    await schoolAudit(c, ops.id, `ticket_${to}`, "hardware_ticket", id, t.school_id, { ref: t.ref });
    await ticketChanged(c, id, note || null);
  });
}

/** The school confirms the fix (closed) or says it's still broken (reopened; the clock is not reset). */
export async function confirmTicket(a: Account, id: string, fixed: boolean, note?: string) {
  const s = await requireStaff(a);
  return system(async (c) => {
    const t = (await c.query("SELECT * FROM hardware_tickets WHERE id = $1 AND school_id = $2 FOR UPDATE", [id, s.schoolId])).rows[0];
    if (!t) throw new HttpError(404, "Ticket not found");
    if (t.status !== "resolved") throw new HttpError(409, "Only a ticket marked fixed can be confirmed");
    if (fixed) await c.query("UPDATE hardware_tickets SET status = 'closed' WHERE id = $1", [id]);
    else {
      if (!note || note.trim().length < 5) throw new HttpError(422, "Tell us what's still wrong", { fields: { note: "Required" } });
      await c.query("UPDATE hardware_tickets SET status = 'open', resolved_at = NULL, resolution = NULL WHERE id = $1", [id]);
      if (t.asset_id) await c.query("UPDATE lab_assets SET status = 'faulty', updated_at = UTC_TIMESTAMP(3) WHERE id = $1", [t.asset_id]);
    }
    await c.query("INSERT INTO hardware_ticket_events (ticket_id, actor_account_id, status, note) VALUES ($1,$2,$3,$4)", [id, a.id, fixed ? "closed" : "open", note ?? null]);
    await schoolAudit(c, a.id, fixed ? "ticket_closed" : "ticket_reopened", "hardware_ticket", id, s.schoolId, { ref: t.ref });
    await ticketChanged(c, id, note ?? null);
  });
}

/* ------------------------------ Kalamite requests ------------------------------ */

export async function requestFellow(a: Account, i: { labId: string; world: string; language: string; startsAt: string; durationMin: number; gradeBand: string; students: number; responsibleStaffId: string; notes?: string }) {
  const s = await requireStaff(a, "school_admin");
  const at = new Date(i.startsAt);
  if (at.getTime() < Date.now() + REQUEST_LEAD_HOURS * 3600_000) throw new HttpError(422, `Please ask at least ${REQUEST_LEAD_HOURS} hours ahead so we can schedule a vetted Kalamite`, { fields: { startsAt: "Too soon" } });
  return system(async (c) => {
    await assertLab(c, i.labId, s.schoolId);
    await assertTrainer(c, i.responsibleStaffId, s.schoolId);
    const id = uuid();
    await c.query(
      `INSERT INTO fellow_requests (id, school_id, lab_id, world, language, starts_at, duration_min, grade_band, students, responsible_staff_id, notes, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [id, s.schoolId, i.labId, i.world, i.language, at, i.durationMin, i.gradeBand, i.students, i.responsibleStaffId, i.notes ?? null, a.id],
    );
    await schoolAudit(c, a.id, "fellow_requested", "fellow_request", id, s.schoolId);
    return id;
  });
}

export async function cancelRequest(a: Account, id: string) {
  const s = await requireStaff(a, "school_admin");
  return system(async (c) => {
    const r = await c.query("UPDATE fellow_requests SET status = 'cancelled' WHERE id = $1 AND school_id = $2 AND status = 'requested'", [id, s.schoolId]);
    if (!r.affectedRows) throw new HttpError(409, "Only a request that isn't scheduled yet can be cancelled here. For scheduled sessions, message Robokalam.");
    await schoolAudit(c, a.id, "fellow_request_cancelled", "fellow_request", id, s.schoolId);
  });
}

/** Ops turns a school's request into a Campus Session gig. Pay comes from the rate card. */
export async function scheduleRequest(ops: Account, id: string, i: { minTier?: string; lessonPlan?: string; kitList?: string }) {
  const r = await system(async (c) => (await c.query(
    `SELECT fr.*, s.name AS school, s.city, l.name AS lab, st.display_name AS adult, st.role AS adult_role
     FROM fellow_requests fr JOIN schools s ON s.id = fr.school_id JOIN labs l ON l.id = fr.lab_id JOIN school_staff st ON st.account_id = fr.responsible_staff_id
     WHERE fr.id = $1`, [id])).rows[0]);
  if (!r) throw new HttpError(404, "Request not found");
  if (r.status !== "requested") throw new HttpError(409, "Already decided");
  const gigId = await createGig(ops, {
    kind: "campus_session", title: `Campus Session · ${r.school} · ${r.grade_band}`, world: r.world, language: r.language, startsAt: new Date(r.starts_at).toISOString(),
    durationMin: r.duration_min, mode: "offline", city: r.city ?? PILOT.city, location: `${r.school}, ${r.lab}`, responsibleAdult: `${r.adult} (${r.adult_role === "trainer" ? "trainer" : "school admin"})`,
    minTier: i.minTier, lessonPlan: i.lessonPlan ?? r.notes ?? undefined, kitList: i.kitList,
  });
  await system(async (c) => {
    await c.query("UPDATE fellow_requests SET status = 'scheduled', gig_id = $2, decided_by = $3 WHERE id = $1 AND status = 'requested'", [id, gigId, ops.id]);
    await schoolAudit(c, ops.id, "fellow_request_scheduled", "fellow_request", id, r.school_id, { gig: gigId });
    await schoolRequestChanged(c, id);
  });
  return gigId;
}

export async function declineRequest(ops: Account, id: string, note: string) {
  return system(async (c) => {
    const r = (await c.query("SELECT school_id FROM fellow_requests WHERE id = $1 AND status = 'requested'", [id])).rows[0];
    if (!r) throw new HttpError(409, "Already decided");
    await c.query("UPDATE fellow_requests SET status = 'declined', decision_note = $2, decided_by = $3 WHERE id = $1", [id, note, ops.id]);
    await schoolAudit(c, ops.id, "fellow_request_declined", "fellow_request", id, r.school_id);
    await schoolRequestChanged(c, id);
  });
}

/** Kalamite sessions at this school, with only the Kalamite's public name. */
export async function schoolFellowSessions(schoolId: string) {
  return system(async (c) => (await c.query(
    `SELECT fr.id, fr.starts_at, fr.duration_min, fr.world, fr.grade_band, fr.students, fr.status, fr.decision_note, fr.gig_id,
            st.display_name AS responsible, l.name AS lab, g.status AS gig_status,
            ga.id AS assignment_id, ga.status AS assignment_status, f.account_id AS fellow_id, f.display_name AS fellow
     FROM fellow_requests fr JOIN labs l ON l.id = fr.lab_id JOIN school_staff st ON st.account_id = fr.responsible_staff_id
     LEFT JOIN gigs g ON g.id = fr.gig_id
     LEFT JOIN gig_assignments ga ON ga.gig_id = g.id AND ga.status IN ('accepted','delivered')
     LEFT JOIN fellows f ON f.account_id = ga.fellow_id
     WHERE fr.school_id = $1 ORDER BY fr.starts_at DESC`,
    [schoolId],
  )).rows);
}

/** May this trainer score this Kalamite assignment? Only for sessions at their own school. */
export async function canObserve(a: Account, assignmentId: string) {
  const s = await staffFor(a);
  if (!s) return false;
  return system(async (c) => !!(await c.query(
    "SELECT 1 FROM gig_assignments ga JOIN fellow_requests fr ON fr.gig_id = ga.gig_id WHERE ga.id = $1 AND fr.school_id = $2 AND ga.status = 'delivered'",
    [assignmentId, s.schoolId],
  )).rows[0]);
}

/* ------------------------------ Overview and reports ------------------------------ */

export async function schoolOverview(schoolId: string) {
  return system(async (c) => {
    const labs = (await c.query(
      `SELECT l.id, l.name, l.room, l.status,
         (SELECT COUNT(*) FROM lab_assets a WHERE a.lab_id = l.id AND a.status <> 'retired') AS assets,
         (SELECT COUNT(*) FROM lab_assets a WHERE a.lab_id = l.id AND a.status IN ('faulty','in_repair')) AS faulty,
         (SELECT COUNT(*) FROM hardware_tickets t WHERE t.lab_id = l.id AND t.status NOT IN ('resolved','closed')) AS open_tickets,
         (SELECT COUNT(*) FROM hardware_tickets t WHERE t.lab_id = l.id AND t.status NOT IN ('resolved','closed') AND t.due_at < UTC_TIMESTAMP(3)) AS overdue,
         (SELECT MAX(cs.starts_at) FROM class_sessions cs JOIN school_classes k ON k.id = cs.class_id WHERE k.lab_id = l.id AND cs.status = 'held') AS last_held
       FROM labs l WHERE l.school_id = $1 ORDER BY l.name`, [schoolId])).rows;
    const cov = (await c.query(
      `SELECT SUM(cs.status = 'held') AS held, SUM(cs.status = 'cancelled') AS cancelled, SUM(cs.status = 'planned') AS unrecorded,
              SUM(cs.present) AS present, SUM(cs.total) AS total
       FROM class_sessions cs JOIN school_classes k ON k.id = cs.class_id
       WHERE k.school_id = $1 AND cs.starts_at < UTC_TIMESTAMP(3) AND cs.starts_at >= UTC_TIMESTAMP(3) - INTERVAL 30 DAY`, [schoolId])).rows[0];
    const uncovered = (await c.query("SELECT COUNT(*) AS n FROM school_classes WHERE school_id = $1 AND active AND trainer_account_id IS NULL", [schoolId])).rows[0].n;
    const sla = (await c.query(
      `SELECT COUNT(*) AS n, SUM(resolved_at <= due_at) AS met FROM hardware_tickets WHERE school_id = $1 AND resolved_at IS NOT NULL AND raised_at >= UTC_TIMESTAMP(3) - INTERVAL 90 DAY`, [schoolId])).rows[0];
    return { labs, coverage: { held: Number(cov.held ?? 0), cancelled: Number(cov.cancelled ?? 0), unrecorded: Number(cov.unrecorded ?? 0), present: Number(cov.present ?? 0), total: Number(cov.total ?? 0), uncovered: Number(uncovered) }, sla: { resolved: Number(sla.n), met: Number(sla.met ?? 0) } };
  });
}

export async function tickets(schoolId: string | null, opts: { open?: boolean } = {}) {
  return system(async (c) => (await c.query(
    `SELECT t.*, s.name AS school, l.name AS lab, a.label AS asset, st.display_name AS raised_by_name
     FROM hardware_tickets t JOIN schools s ON s.id = t.school_id JOIN labs l ON l.id = t.lab_id
     LEFT JOIN lab_assets a ON a.id = t.asset_id LEFT JOIN school_staff st ON st.account_id = t.raised_by
     WHERE ($1 IS NULL OR t.school_id = $1) ${opts.open ? "AND t.status NOT IN ('closed')" : ""}
     ORDER BY t.status IN ('resolved','closed'), t.due_at`,
    [schoolId],
  )).rows);
}

const csvCell = (v: unknown) => {
  const s = v == null ? "" : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";

/** Audit report for a school: every recorded action, plus ticket clocks. No student data. */
export async function auditReport(schoolId: string) {
  return system(async (c) => {
    const log = (await c.query(
      `SELECT al.at, al.action, al.entity, al.entity_id, COALESCE(st.display_name, CONCAT(a.role)) AS actor, al.meta
       FROM audit_log al LEFT JOIN accounts a ON a.id = al.actor_account_id LEFT JOIN school_staff st ON st.account_id = al.actor_account_id
       WHERE JSON_UNQUOTE(JSON_EXTRACT(al.meta, '$.school')) = $1 ORDER BY al.at`, [schoolId])).rows;
    const t = (await c.query("SELECT ref, category, summary, status, raised_at, due_at, resolved_at, resolution FROM hardware_tickets WHERE school_id = $1 ORDER BY raised_at", [schoolId])).rows;
    return toCsv([
      ["section", "when", "action", "entity", "entity_id", "by", "details"],
      ...log.map((r) => ["audit", r.at, r.action, r.entity, r.entity_id, r.actor, r.meta]),
      ...t.map((r) => ["ticket", r.raised_at, r.status, r.ref, r.category, r.summary, `due ${new Date(r.due_at).toISOString()}; ${ticketClock(r).label}${r.resolution ? `; ${r.resolution}` : ""}`]),
    ]);
  });
}
