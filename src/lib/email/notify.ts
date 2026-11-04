import { system, type Tx } from "../db";
import { inr } from "../money";
import { SITE } from "../site";
import { MISSIONS } from "@/content/missions";
import { enqueue, enqueueStaff } from "./outbox";
import { ticketClock } from "../schools/clock";

/**
 * Email at every step. Each helper looks up who should hear about an event
 * and queues the email inside the caller's transaction. Recipients are
 * adults only: parents, Kalamites, school staff and the Robokalam team.
 */

export const ist = (d: Date | string) => new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
const PURPOSE_LABEL: Record<string, string> = {
  account: "Your family account", live_classes: "Live classes and progress", class_recording: "Recording online classes for safety",
  ai_helper: "The AI helper", portfolio_sharing: "Sharing the project page by link", whatsapp: "WhatsApp reminders", follow_up: "One follow-up after the Free Build Session",
  one_to_one: "One-to-one online classes, with you informed before and after each one",
};

/* ---------------- Interest ---------------- */

export async function leadReceived(c: Tx, lead: { ref: string; door: string; queue: string; name: string; phone: string; email?: string | null; institution?: string; summary: string }) {
  if (lead.email) {
    const template = lead.door === "learner" ? "lead_ack_learner" : lead.door === "school" ? "lead_ack_school" : "lead_ack_educator";
    await enqueue(c, { to: lead.email, template, payload: { name: lead.name, ref: lead.ref, institution: lead.institution ?? "" }, dedupe: `lead:${lead.ref}` });
  }
  await enqueueStaff(c, lead.door === "school" ? "schools" : "ops", { template: "staff_new_lead", payload: { ref: lead.ref, door: lead.door, queue: lead.queue, name: lead.name, phone: lead.phone, summary: lead.summary }, dedupe: `staff-lead:${lead.ref}` });
}

/* ---------------- Families ---------------- */

export async function consentRecorded(c: Tx, learnerId: string, noticeId: string, decisions: Record<string, boolean>) {
  const l = (await c.query("SELECT first_name, guardian_account_id FROM learners WHERE id = $1", [learnerId])).rows[0];
  if (!l) return;
  const granted = Object.entries(decisions).filter(([, v]) => v).map(([k]) => PURPOSE_LABEL[k] ?? k);
  const declined = Object.entries(decisions).filter(([, v]) => !v).map(([k]) => PURPOSE_LABEL[k] ?? k);
  await enqueue(c, { accountId: l.guardian_account_id, template: "consent_receipt", payload: { child: l.first_name, granted, declined, notice: noticeId, when: ist(new Date()), oneToOne: !!decisions.one_to_one }, dedupe: `consent:${learnerId}:${Date.now()}` });
}

export async function consentWithdrawn(c: Tx, learnerId: string, purpose: string) {
  const l = (await c.query("SELECT first_name, guardian_account_id FROM learners WHERE id = $1", [learnerId])).rows[0];
  if (!l) return;
  await enqueue(c, { accountId: l.guardian_account_id, template: "consent_withdrawn", payload: { child: l.first_name, purpose: PURPOSE_LABEL[purpose] ?? purpose, when: ist(new Date()), oneToOne: purpose === "one_to_one" }, dedupe: `withdraw:${learnerId}:${purpose}:${Date.now()}` });
}

async function bookingInfo(c: Tx, bookingId: string) {
  return (await c.query(
    `SELECT bk.id, bk.guardian_account_id, bk.status, l.first_name AS child, co.title AS course, co.kind, co.format, co.fee_paise, b.starts_at, b.mode, b.location,
            COALESCE(f.display_name, b.educator_label) AS educator, b.educator_fellow_id, (SELECT JSON_UNQUOTE(JSON_EXTRACT(l.interests, '$[0]'))) AS interest
     FROM bookings bk JOIN learners l ON l.id = bk.learner_id JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id
     LEFT JOIN fellows f ON f.account_id = b.educator_fellow_id WHERE bk.id = $1`, [bookingId])).rows[0];
}

export async function bookingConfirmed(c: Tx, bookingId: string) {
  const b = await bookingInfo(c, bookingId);
  if (!b) return;
  await enqueue(c, { accountId: b.guardian_account_id, template: "booking_confirmed", dedupe: `booked:${bookingId}`, payload: {
    child: b.child, course: b.course, when: ist(b.starts_at), where: b.mode === "online" ? "Online, on Robokalam" : b.location, educator: b.educator ?? "Assigned soon",
    fee: b.fee_paise ? `${inr(b.fee_paise)} incl. GST` : "Free", mission: b.kind === "build_session" ? MISSIONS[b.interest] ?? MISSIONS.robotics : null,
    calendar: `${SITE.url}/api/app/bookings/${bookingId}/calendar`,
  } });
}

export async function paymentReceived(c: Tx, orderId: string) {
  const o = (await c.query("SELECT o.amount_paise, o.invoice_no, o.booking_id, o.account_id FROM orders o WHERE o.id = $1", [orderId])).rows[0];
  if (!o) return;
  const b = await bookingInfo(c, o.booking_id);
  await enqueue(c, { accountId: o.account_id, template: "payment_receipt", dedupe: `paid:${orderId}`, payload: { child: b?.child ?? "", course: b?.course ?? "", amount: inr(o.amount_paise), invoice: o.invoice_no } });
  await bookingConfirmed(c, o.booking_id);
}

/** After a session: summary to each parent. One-to-one goes as an oversight email, which can't be turned off. */
export async function sessionDelivered(c: Tx, gigId: string, records: { bookingId: string; attended: boolean; built?: string | null; feedback?: string | null }[]) {
  const g = (await c.query("SELECT kind, starts_at FROM gigs WHERE id = $1", [gigId])).rows[0];
  for (const r of records) {
    const b = await bookingInfo(c, r.bookingId);
    if (!b) continue;
    const oto = g?.kind === "one_to_one" || b.format === "one_to_one";
    const nextStep = (await c.query("SELECT next_step FROM bookings WHERE id = $1", [r.bookingId])).rows[0]?.next_step;
    await enqueue(c, { accountId: b.guardian_account_id, template: oto ? "oto_after" : "session_summary", dedupe: `summary:${gigId}:${r.bookingId}`, payload: {
      child: b.child, course: b.course, when: ist(g?.starts_at ?? b.starts_at), educator: b.educator ?? "", attended: r.attended,
      built: r.built ?? null, feedback: r.feedback ?? null, summary: r.feedback ?? "", nextStep: nextStep ?? null,
    } });
  }
}

export async function refundChanged(c: Tx, refundId: string) {
  const r = (await c.query("SELECT id, account_id, amount_paise, status, decision FROM refund_requests WHERE id = $1", [refundId])).rows[0];
  if (!r) return;
  const status = { requested: "requested", approved: "approved", rejected: "not approved", paid: "paid" }[r.status as string] ?? r.status;
  await enqueue(c, { accountId: r.account_id, template: "refund_update", dedupe: `refund:${refundId}:${r.status}`, payload: { amount: inr(r.amount_paise), status, note: (r.decision as { note?: string })?.note ?? null } });
}

export async function messageReceived(c: Tx, threadId: string, senderId: string) {
  const t = (await c.query("SELECT guardian_account_id, fellow_id FROM message_threads WHERE id = $1", [threadId])).rows[0];
  if (!t) return;
  const to = senderId === t.fellow_id ? t.guardian_account_id : t.fellow_id;
  const from = senderId === t.fellow_id ? ((await c.query("SELECT display_name FROM fellows WHERE account_id = $1", [senderId])).rows[0]?.display_name ?? "Your educator") : "A parent";
  // At most one email per thread per hour, so a conversation doesn't flood inboxes.
  await enqueue(c, { accountId: to, template: "message_notice", dedupe: `msg:${threadId}:${to}:${Math.floor(Date.now() / 3600_000)}`, payload: { from, link: `/app/messages/${threadId}` } });
}

export async function safetyReported(c: Tx, reportId: string) {
  const r = (await c.query("SELECT reporter_account_id, page, category, respond_by FROM safety_reports WHERE id = $1", [reportId])).rows[0];
  if (!r) return;
  if (r.reporter_account_id) await enqueue(c, { accountId: r.reporter_account_id, template: "safety_ack", dedupe: `safety-ack:${reportId}`, payload: { respondBy: ist(r.respond_by) } });
  await enqueueStaff(c, "safeguarding", { template: "safeguarding_alert", dedupe: `safety-alert:${reportId}`, payload: { category: r.category, page: r.page, respondBy: ist(r.respond_by) } });
}

export async function dataRequested(c: Tx, accountId: string, kind: "export" | "deletion", ref: string) {
  await enqueue(c, { accountId, template: "data_request", dedupe: `data:${ref}`, payload: { kind } });
}

/* ---------------- Kalamites ---------------- */

export async function fellowApplied(c: Tx, fellowId: string) {
  const f = (await c.query("SELECT full_name, status, city FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
  if (f) await enqueue(c, { accountId: fellowId, template: "fellow_application", dedupe: `applied:${fellowId}`, payload: { name: f.full_name.split(" ")[0], status: f.status, city: f.city } });
}

export async function fellowStep(c: Tx, fellowId: string, step: string, outcome: "passed" | "failed", note?: string | null) {
  await enqueue(c, { accountId: fellowId, template: "fellow_step", dedupe: `step:${fellowId}:${step}:${outcome}:${Date.now()}`, payload: { step, outcome, note: note ?? null } });
}

export async function fellowLive(c: Tx, fellowId: string) {
  const f = (await c.query("SELECT full_name FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
  await enqueue(c, { accountId: fellowId, template: "fellow_live", dedupe: `live:${fellowId}`, payload: { name: f?.full_name.split(" ")[0] ?? "" } });
}

export async function gigAccepted(c: Tx, gigId: string, fellowId: string) {
  const g = (await c.query("SELECT title, starts_at, mode, location, pay_paise, kind FROM gigs WHERE id = $1", [gigId])).rows[0];
  if (!g) return;
  await enqueue(c, { accountId: fellowId, template: "gig_confirmed", dedupe: `gig-ok:${gigId}:${fellowId}`, payload: {
    title: g.title, when: ist(g.starts_at), where: g.mode === "online" ? "Online" : g.location, pay: g.kind === "own_course" ? "Your share of fees" : inr(g.pay_paise), link: `/app/fellow/gigs/${gigId}` } });
  // A school that asked for this Kalamite hears that the session is confirmed.
  const fr = (await c.query("SELECT fr.id, fr.school_id, fr.starts_at FROM fellow_requests fr WHERE fr.gig_id = $1", [gigId])).rows[0];
  if (fr) await schoolRequestChanged(c, fr.id, "confirmed");
}

export async function earningAdded(c: Tx, fellowId: string, lineId: string) {
  const l = (await c.query("SELECT description, gross_paise, net_paise, deductions FROM earnings_lines WHERE id = $1", [lineId])).rows[0];
  if (!l) return;
  const ded = (l.deductions as { paise: number }[]).reduce((s, d) => s + d.paise, 0);
  await enqueue(c, { accountId: fellowId, template: "session_paid", dedupe: `earn:${lineId}`, payload: { title: l.description, gross: inr(l.gross_paise), deductions: ded ? inr(ded) : "None", net: inr(l.net_paise) } });
}

export async function payoutSent(c: Tx, payoutId: string) {
  const p = (await c.query("SELECT fellow_id, net_paise, provider_ref AS bank_ref FROM payouts WHERE id = $1", [payoutId])).rows[0];
  if (p) await enqueue(c, { accountId: p.fellow_id, template: "payout_paid", dedupe: `payout:${payoutId}`, payload: { amount: inr(p.net_paise), ref: p.bank_ref } });
}

export async function removalCaseOpened(c: Tx, caseId: string) {
  const r = (await c.query("SELECT fellow_id, notice_until, child_safety FROM removal_cases WHERE id = $1", [caseId])).rows[0];
  if (r) await enqueue(c, { accountId: r.fellow_id, template: "case_notice", dedupe: `case:${caseId}`, payload: { noticeUntil: r.notice_until ? ist(r.notice_until) : "", childSafety: !!r.child_safety } });
}

export async function courseReviewed(c: Tx, draftId: string) {
  const d = (await c.query("SELECT fellow_id, title, status, review_note FROM course_drafts WHERE id = $1", [draftId])).rows[0];
  if (!d) return;
  const decision = { approved: "approved", changes: "changes asked", rejected: "not approved", published: "published" }[d.status as string] ?? d.status;
  await enqueue(c, { accountId: d.fellow_id, template: "course_review", dedupe: `course:${draftId}:${d.status}:${Date.now()}`, payload: { title: d.title, decision, note: d.review_note } });
}

export async function courseSubmitted(c: Tx, draftId: string, flags: number) {
  const d = (await c.query("SELECT d.title, f.display_name FROM course_drafts d JOIN fellows f ON f.account_id = d.fellow_id WHERE d.id = $1", [draftId])).rows[0];
  if (d) await enqueueStaff(c, "ops", { template: "staff_course_submitted", dedupe: `course-sub:${draftId}:${Date.now()}`, payload: { title: d.title, fellow: d.display_name, flags: String(flags) } });
}

export async function ambassadorChanged(c: Tx, fellowId: string) {
  const a = (await c.query("SELECT am.status, am.decision_note, f.display_name, co.name AS college FROM ambassadors am JOIN fellows f ON f.account_id = am.fellow_id JOIN colleges co ON co.id = am.college_id WHERE am.fellow_id = $1", [fellowId])).rows[0];
  if (!a) return;
  if (a.status === "applied") await enqueueStaff(c, "ops", { template: "staff_ambassador_applied", dedupe: `amb-app:${fellowId}`, payload: { fellow: a.display_name, college: a.college } });
  else await enqueue(c, { accountId: fellowId, template: "ambassador_decision", dedupe: `amb:${fellowId}:${a.status}:${Date.now()}`, payload: { status: a.status === "active" ? "approved" : a.status, note: a.decision_note } });
}

export async function flagDecided(c: Tx, flagId: string) {
  const f = (await c.query("SELECT fellow_id, subject_type, message, status, decision_note FROM quality_flags WHERE id = $1", [flagId])).rows[0];
  // Course-draft flags reach the Kalamite through the course review email.
  if (f?.fellow_id && f.subject_type === "fellow") await enqueue(c, { accountId: f.fellow_id, template: "flag_decision", dedupe: `flag:${flagId}`, payload: { message: f.message, status: f.status, note: f.decision_note } });
}

/* ---------------- Schools ---------------- */

export async function staffAdded(c: Tx, accountId: string) {
  const s = (await c.query("SELECT st.display_name, st.role, sc.name FROM school_staff st JOIN schools sc ON sc.id = st.school_id WHERE st.account_id = $1", [accountId])).rows[0];
  if (s) await enqueue(c, { accountId, template: "school_welcome", dedupe: `welcome:${accountId}:${s.name}`, payload: { name: s.display_name, school: s.name, role: s.role === "trainer" ? "a trainer" : "a school admin" } });
}

async function schoolAdmins(c: Tx, schoolId: string, extra: (string | null)[] = []) {
  const ids = (await c.query("SELECT account_id FROM school_staff WHERE school_id = $1 AND role = 'school_admin' AND removed_at IS NULL", [schoolId])).rows.map((r) => r.account_id as string);
  return [...new Set([...ids, ...extra.filter(Boolean) as string[]])];
}

export async function ticketChanged(c: Tx, ticketId: string, note?: string | null) {
  const t = (await c.query("SELECT * FROM hardware_tickets WHERE id = $1", [ticketId])).rows[0];
  if (!t) return;
  const status = { open: "open", acknowledged: "seen by Robokalam", dispatched: "replacement on the way", resolved: "marked fixed, please confirm", closed: "closed" }[t.status as string] ?? t.status;
  for (const to of await schoolAdmins(c, t.school_id, [t.raised_by])) {
    await enqueue(c, { accountId: to, template: "ticket_update", dedupe: `ticket:${ticketId}:${t.status}:${to}:${Date.now()}`, payload: { ref: t.ref, summary: t.summary, status, due: ist(t.due_at), clock: ticketClock(t).label, note: note ?? t.resolution ?? null } });
  }
}

export async function schoolRequestChanged(c: Tx, requestId: string, event?: "confirmed") {
  const r = (await c.query(
    `SELECT fr.*, f.display_name AS fellow FROM fellow_requests fr LEFT JOIN gig_assignments ga ON ga.gig_id = fr.gig_id AND ga.status IN ('accepted','delivered') LEFT JOIN fellows f ON f.account_id = ga.fellow_id WHERE fr.id = $1`, [requestId])).rows[0];
  if (!r) return;
  const status = event === "confirmed" ? "confirmed" : ({ scheduled: "scheduled, finding a Kalamite", declined: "not possible", cancelled: "cancelled", requested: "received" }[r.status as string] ?? r.status);
  for (const to of await schoolAdmins(c, r.school_id, [r.requested_by])) {
    await enqueue(c, { accountId: to, template: "fellow_request_update", dedupe: `freq:${requestId}:${status}:${to}`, payload: { when: ist(r.starts_at), status, fellow: r.fellow ?? null, note: r.decision_note ?? null } });
  }
}

/* ---------------- Scheduled: reminders and notices ---------------- */

/**
 * Runs every few minutes. Queues reminders 24 hours before each session, and
 * terms-change notices to Kalamites. Dedupe keys make it safe to run often.
 */
export async function scheduleReminders() {
  return system(async (c) => {
    let n = 0;
    // Each session a family is booked into, starting in the next 25 hours.
    const sessions = (await c.query(
      `SELECT bk.id AS booking_id, bk.guardian_account_id, COALESCE(g.id, b.id) AS session_id, COALESCE(g.starts_at, b.starts_at) AS starts_at, g.kind, co.format
       FROM bookings bk JOIN batches b ON b.id = bk.batch_id JOIN courses co ON co.id = b.course_id
       LEFT JOIN gigs g ON g.batch_id = b.id AND g.status <> 'cancelled' AND g.kind NOT IN ('shadow','co_teach')
       WHERE bk.status = 'confirmed' AND COALESCE(g.starts_at, b.starts_at) BETWEEN UTC_TIMESTAMP(3) AND UTC_TIMESTAMP(3) + INTERVAL 25 HOUR`)).rows;
    for (const s of sessions) {
      const b = await bookingInfo(c, s.booking_id);
      if (!b) continue;
      const oto = s.kind === "one_to_one" || s.format === "one_to_one";
      const sendAfter = new Date(Math.max(Date.now(), new Date(s.starts_at).getTime() - 24 * 3600_000));
      if (await enqueue(c, { accountId: s.guardian_account_id, template: oto ? "oto_before" : "class_reminder", sendAfter, dedupe: `remind:${s.booking_id}:${s.session_id}`, payload: {
        child: b.child, course: b.course, when: ist(s.starts_at), educator: b.educator ?? "Assigned soon",
        profile: b.educator_fellow_id ? `/educators/${b.educator_fellow_id}` : "/app", classLink: "/app",
      } })) n++;
    }
    // Kalamites: their accepted gigs in the next 25 hours.
    const gigs = (await c.query(
      `SELECT ga.id, ga.fellow_id, g.id AS gig_id, g.title, g.starts_at, g.mode, g.location, g.kind FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id
       WHERE ga.status = 'accepted' AND g.starts_at BETWEEN UTC_TIMESTAMP(3) AND UTC_TIMESTAMP(3) + INTERVAL 25 HOUR`)).rows;
    for (const g of gigs) {
      const sendAfter = new Date(Math.max(Date.now(), new Date(g.starts_at).getTime() - 24 * 3600_000));
      if (await enqueue(c, { accountId: g.fellow_id, template: "gig_reminder", sendAfter, dedupe: `gig-remind:${g.id}`, payload: { title: g.title, when: ist(g.starts_at), where: g.mode === "online" ? "Online" : g.location, oneToOne: g.kind === "one_to_one", link: `/app/fellow/gigs/${g.gig_id}` } })) n++;
    }
    // Kalamite terms published but not yet in effect: tell every Kalamite once.
    const upcoming = (await c.query("SELECT id, effective_at FROM terms_versions WHERE language = 'en' AND initial = FALSE AND effective_at > UTC_TIMESTAMP(3)")).rows;
    for (const t of upcoming) {
      const fellows = (await c.query("SELECT account_id FROM fellows WHERE status IN ('vetting','live','paused')")).rows;
      for (const f of fellows) if (await enqueue(c, { accountId: f.account_id, template: "terms_notice", dedupe: `terms:${t.id}:${f.account_id}`, payload: { effective: ist(t.effective_at), summary: TERMS_SUMMARY[t.id] ?? "" } })) n++;
    }
    return n;
  });
}

export const TERMS_SUMMARY: Record<string, string> = {
  "kalamite-terms-2026-12-en": "What's new: Kalam Fellows are now Kalamites, and the levels are Junior Kalamite, Kalamite, Senior Kalamite and Lead Kalamite. Only the names change: your pay, rights and rules stay the same.",
  "kalamite-code-2026-12-en": "What's new: the code of conduct now uses the Kalamite name. The rules, including the one-to-one rules, stay the same.",
  "code-of-conduct-2026-12-en": "What's new: one-to-one online classes for under-18s, with the parent's specific consent, a notice to the parent before and a written summary after every session, and recording. Nothing else changes.",
};
