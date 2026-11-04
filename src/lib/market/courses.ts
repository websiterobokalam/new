import { audit, system, uuid, type Tx } from "../db";
import { HttpError } from "../api";
import type { Account } from "../auth/session";
import { requireFellow } from "../fellows/core";
import { TIERS, tierLabel, weekMinutes } from "../fellows/gigs";
import { checkDraft, type Draft } from "../quality/flags";
import { requireMarketOpen } from "./gate";
import { courseReviewed, courseSubmitted } from "../email/notify";

/**
 * Kalamite's Own Course (brief §11): online, small groups, reviewed and
 * approved first. Opens only after reliable quality data exists, so authors
 * must meet a published bar, and courses go public only when the
 * marketplace is open.
 */

/** Published to Kalamites as-is. Drafts for ops to approve (see PHASE-5.md). */
export const AUTHOR_RULES = { minTier: "fellow", minSessions: 10, minObservation: 3, minRating: 4.3, minReviews: 3 } as const;

/** The Kalamite's share of the course fee, from your approved terms. Unset = courses can't go public. */
export const fellowSharePct = () => {
  const v = Number(process.env.OWN_COURSE_FELLOW_SHARE_PCT);
  return Number.isFinite(v) && v > 0 && v <= 100 ? v : null;
};

export type Check = { label: string; ok: boolean; detail: string };

export async function authorChecks(c: Tx, fellowId: string): Promise<{ ok: boolean; checks: Check[] }> {
  const f = (await c.query("SELECT status, tier FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
  const delivered = Number((await c.query("SELECT COUNT(*) AS n FROM gig_assignments WHERE fellow_id = $1 AND status = 'delivered'", [fellowId])).rows[0].n);
  const obs = (await c.query("SELECT qr.rubric FROM quality_reviews qr JOIN gig_assignments ga ON ga.id = qr.assignment_id WHERE ga.fellow_id = $1", [fellowId])).rows;
  const obsAvg = obs.length ? obs.reduce((s, r) => { const v = Object.values(r.rubric as Record<string, number>).map(Number); return s + v.reduce((a, b) => a + b, 0) / v.length; }, 0) / obs.length : null;
  const rev = (await c.query("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE fellow_id = $1 AND NOT hidden", [fellowId])).rows[0];
  const openCase = !!(await c.query("SELECT 1 FROM removal_cases WHERE fellow_id = $1 AND status = 'notice'", [fellowId])).rows[0];
  const highFlags = Number((await c.query("SELECT COUNT(*) AS n FROM quality_flags WHERE fellow_id = $1 AND subject_type = 'fellow' AND severity = 'high' AND status = 'open'", [fellowId])).rows[0].n);
  const tierOk = !!f && TIERS.indexOf(f.tier) >= TIERS.indexOf(AUTHOR_RULES.minTier);
  const checks: Check[] = [
    { label: "Live Kalamite", ok: f?.status === "live", detail: f ? `You are ${f.status}` : "Not a Kalamite" },
    { label: `${tierLabel(AUTHOR_RULES.minTier)} level or above`, ok: tierOk, detail: f ? `You are ${tierLabel(f.tier)}` : "" },
    { label: `${AUTHOR_RULES.minSessions} sessions delivered`, ok: delivered >= AUTHOR_RULES.minSessions, detail: `${delivered} so far` },
    { label: `Observation scores average ${AUTHOR_RULES.minObservation} of 4 or more`, ok: obsAvg != null && obsAvg >= AUTHOR_RULES.minObservation, detail: obsAvg == null ? "No observations yet" : `${obsAvg.toFixed(1)} from ${obs.length}` },
    { label: `Verified parent rating ${AUTHOR_RULES.minRating} or more, from ${AUTHOR_RULES.minReviews}+ reviews`, ok: Number(rev.n) >= AUTHOR_RULES.minReviews && Number(rev.avg) >= AUTHOR_RULES.minRating, detail: Number(rev.n) ? `${Number(rev.avg).toFixed(1)} from ${rev.n}` : "No reviews yet" },
    { label: "No open removal case or serious open flag", ok: !openCase && highFlags === 0, detail: openCase ? "A case is open" : highFlags ? "A serious flag is waiting for review" : "None" },
  ];
  return { ok: checks.every((x) => x.ok), checks };
}

export type DraftInput = { title: string; world: string; ageMin: number; ageMax: number; outcome: string; sessions: number; batchSizeMax: number; kit?: string; feePaise: number; syllabus: { title: string; build: string }[] };

const EDITABLE = ["draft", "changes"];

export async function saveDraft(a: Account, i: DraftInput, id?: string) {
  await requireFellow(a);
  return system(async (c) => {
    const vals = [i.title, i.world, i.ageMin, i.ageMax, i.outcome, i.sessions, i.batchSizeMax, i.kit ?? null, i.feePaise, i.syllabus];
    if (id) {
      const r = await c.query(
        `UPDATE course_drafts SET title=$3, world=$4, age_min=$5, age_max=$6, outcome=$7, sessions=$8, batch_size_max=$9, kit=$10, fee_paise=$11, syllabus=$12, updated_at=UTC_TIMESTAMP(3)
         WHERE id = $1 AND fellow_id = $2 AND status IN ('draft','changes')`, [id, a.id, ...vals]);
      if (!r.affectedRows) throw new HttpError(409, "This draft can't be edited now");
      return id;
    }
    const nid = uuid();
    await c.query(
      "INSERT INTO course_drafts (id, fellow_id, title, world, age_min, age_max, outcome, sessions, batch_size_max, kit, fee_paise, syllabus) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [nid, a.id, ...vals],
    ).catch((e) => { if (e.code === "23514") throw new HttpError(422, "Check ages (6 to 18), group size (2 to 8) and sessions (1 to 24)"); throw e; });
    return nid;
  });
}

async function loadDraft(c: Tx, id: string): Promise<Draft & { status: string; course_id: string | null }> {
  const d = (await c.query("SELECT * FROM course_drafts WHERE id = $1", [id])).rows[0];
  if (!d) throw new HttpError(404, "Draft not found");
  return d;
}

/** Submit for review. The bar applies here; checks run and their flags go to the reviewer. */
export async function submitDraft(a: Account, id: string) {
  const d = await system(async (c) => {
    const x = await loadDraft(c, id);
    if (x.fellow_id !== a.id) throw new HttpError(404, "Draft not found");
    if (!EDITABLE.includes(x.status)) throw new HttpError(409, "Already submitted");
    if (x.syllabus.length !== x.sessions) throw new HttpError(422, `Add a syllabus line for each of the ${x.sessions} sessions`);
    const elig = await authorChecks(c, a.id);
    if (!elig.ok) throw new HttpError(409, `Not yet: ${elig.checks.find((k) => !k.ok)!.label}`);
    // Each resubmission is checked afresh.
    await c.query("DELETE FROM quality_flags WHERE subject_type = 'course_draft' AND subject_id = $1 AND status = 'open'", [id]);
    await c.query("UPDATE course_drafts SET status = 'submitted', submitted_at = UTC_TIMESTAMP(3) WHERE id = $1", [id]);
    await audit(c, a.id, "course_submitted", "course_draft", id);
    return x;
  });
  const res = await checkDraft(d);
  await system(async (c) => {
    const n = Number((await c.query("SELECT COUNT(*) AS n FROM quality_flags WHERE subject_type = 'course_draft' AND subject_id = $1 AND status = 'open'", [id])).rows[0].n);
    await courseSubmitted(c, id, n);
  });
  return res;
}

export async function withdrawDraft(a: Account, id: string) {
  return system(async (c) => {
    const r = await c.query("UPDATE course_drafts SET status = 'withdrawn' WHERE id = $1 AND fellow_id = $2 AND status IN ('draft','changes','submitted')", [id, a.id]);
    if (!r.affectedRows) throw new HttpError(409, "Can't withdraw this draft now");
    await audit(c, a.id, "course_withdrawn", "course_draft", id);
  });
}

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").slice(0, 60);

/** A reviewer decides. Approval needs every flag on the draft decided by a person first. */
export async function reviewDraft(ops: Account, id: string, decision: "approve" | "changes" | "reject", note: string) {
  if (note.trim().length < 5) throw new HttpError(422, "Write a note the Kalamite will read", { fields: { note: "Required" } });
  return system(async (c) => {
    const d = await loadDraft(c, id);
    if (d.status !== "submitted") throw new HttpError(409, "Only a submitted draft can be reviewed");
    if (decision === "approve") {
      const open = Number((await c.query("SELECT COUNT(*) AS n FROM quality_flags WHERE subject_type = 'course_draft' AND subject_id = $1 AND status = 'open'", [id])).rows[0].n);
      if (open) throw new HttpError(409, `Decide the ${open} open flag${open > 1 ? "s" : ""} on this draft first`);
      const courseId = uuid();
      const f = (await c.query("SELECT display_name FROM fellows WHERE account_id = $1", [d.fellow_id])).rows[0];
      await c.query(
        `INSERT INTO courses (id, slug, title, world, programme, age_min, age_max, outcome, batch_size_max, sessions, kit, fee_paise, fee_approved, sample, published, kind, author_fellow_id, fellow_share_pct)
         VALUES ($1,$2,$3,$4,'Kalamite''s Own Course',$5,$6,$7,$8,$9,$10,$11, TRUE, FALSE, FALSE, 'course', $12, NULL)`,
        [courseId, `${slugify(d.title)}-${courseId.slice(0, 6)}`, d.title, d.world, d.age_min, d.age_max, d.outcome, d.batch_size_max, d.sessions, d.kit, d.fee_paise, d.fellow_id],
      );
      await c.query("UPDATE course_drafts SET status = 'approved', course_id = $2, reviewed_by = $3, reviewed_at = UTC_TIMESTAMP(3), review_note = $4 WHERE id = $1", [id, courseId, ops.id, note]);
      await audit(c, ops.id, "course_approved", "course_draft", id, { course: courseId, author: f?.display_name ?? null });
      await courseReviewed(c, id);
      return courseId;
    }
    await c.query("UPDATE course_drafts SET status = $2, reviewed_by = $3, reviewed_at = UTC_TIMESTAMP(3), review_note = $4 WHERE id = $1", [id, decision === "changes" ? "changes" : "rejected", ops.id, note]);
    await audit(c, ops.id, decision === "changes" ? "course_changes_requested" : "course_rejected", "course_draft", id);
    await courseReviewed(c, id);
    return null;
  });
}

/** Goes public only when the marketplace is open and the Kalamite's share is approved. */
export async function publishCourse(ops: Account, id: string) {
  await requireMarketOpen();
  const share = fellowSharePct();
  if (!share) throw new HttpError(409, "Set OWN_COURSE_FELLOW_SHARE_PCT from the approved Kalamite terms first");
  return system(async (c) => {
    const d = await loadDraft(c, id);
    if (d.status !== "approved" || !d.course_id) throw new HttpError(409, "Only an approved course can be published");
    await c.query("UPDATE courses SET published = TRUE, fellow_share_pct = $2 WHERE id = $1", [d.course_id, share]);
    await c.query("UPDATE course_drafts SET status = 'published' WHERE id = $1", [id]);
    await audit(c, ops.id, "course_published", "course_draft", id, { share });
    await courseReviewed(c, id);
  });
}

/** The author schedules a run: one online batch, one session a week, all on their own calendar. */
export async function scheduleRun(a: Account, draftId: string, i: { startsAt: string; language: string }) {
  const { fellow } = await requireFellow(a);
  const first = new Date(i.startsAt);
  if (first.getTime() < Date.now() + 72 * 3600_000) throw new HttpError(422, "Start at least 3 days ahead so families can book", { fields: { startsAt: "Too soon" } });
  if (!fellow.languages.includes(i.language)) throw new HttpError(422, "Pick a language you teach in");
  return system(async (c) => {
    const d = await loadDraft(c, draftId);
    if (d.fellow_id !== a.id) throw new HttpError(404, "Not your course");
    if (d.status !== "published" || !d.course_id) throw new HttpError(409, "Your course isn't published yet");
    const co = (await c.query("SELECT * FROM courses WHERE id = $1", [d.course_id])).rows[0];
    const dates = Array.from({ length: co.sessions }, (_, k) => new Date(first.getTime() + k * 7 * 86400_000));
    const minutes = 60;
    for (const at of dates) {
      if (fellow.exam_mode_until && at <= new Date(fellow.exam_mode_until)) throw new HttpError(409, "A session falls in your Exam Mode dates");
      if ((await weekMinutes(c, a.id, at)) + minutes > fellow.weekly_cap_hours * 60) throw new HttpError(409, `A week would go over your ${fellow.weekly_cap_hours}-hour cap`);
    }
    const batchId = uuid();
    await c.query("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode, educator_label, educator_fellow_id) VALUES ($1,$2,$3,$4,$5,$6,'online',$7,$8)",
      [batchId, co.id, first, minutes, co.batch_size_max, i.language, fellow.display_name, a.id]);
    for (const [k, at] of dates.entries()) {
      const gigId = uuid();
      // Pay is the Kalamite's share of fees released on delivery, so the per-session figure is a placeholder (1 paisa) never shown or paid.
      await c.query(
        `INSERT INTO gigs (id, kind, batch_id, title, world, language, starts_at, duration_min, mode, city, pay_paise, seats, status, created_by)
         VALUES ($1,'own_course',$2,$3,$4,$5,$6,$7,'online',$8,1,1,'filled',$9)`,
        [gigId, batchId, `${co.title} · Session ${k + 1}`, co.world, i.language, at, minutes, fellow.city, a.id]);
      await c.query("INSERT INTO gig_assignments (id, gig_id, fellow_id, status) VALUES ($1,$2,$3,'accepted')", [uuid(), gigId, a.id]);
    }
    await audit(c, a.id, "course_run_scheduled", "batch", batchId, { course: co.id, sessions: dates.length });
    return batchId;
  });
}
