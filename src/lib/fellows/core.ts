import { insertOnce, system, type Tx } from "../db";
import { asAccount, type Account } from "../auth/session";
import { academy, gradeModule, mandatoryModules } from "@/content/fellows/academy";
import { gradeSubject, subjectTests } from "@/content/fellows/subject-tests";
import { addEarning, rateFor } from "./pay";

export const STEPS = ["subject_test", "demo", "identity", "background", "references", "academy", "terms", "shadow", "co_teach"] as const;
export type Step = (typeof STEPS)[number];
export const STEP_LABEL: Record<Step, string> = {
  subject_test: "Subject test", demo: "Recorded demo", identity: "Identity check", background: "Background check", references: "References",
  academy: "Kalam Academy", terms: "Terms and code of conduct", shadow: "Shadow a class", co_teach: "Co-teach a class",
};

/** Pilot: one city, about 25 live Fellows. Both are settings, not code. */
export const PILOT = { city: process.env.PILOT_CITY ?? "Hyderabad", maxLive: Number(process.env.PILOT_MAX_LIVE ?? 25) };

export class FellowError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

export type Fellow = {
  account_id: string; full_name: string; display_name: string; college: string; course: string; year: string; worlds: string[]; languages: string[];
  hours_per_week: number; city: string; status: string; tier: string; weekly_cap_hours: number; exam_mode_until: string | null; point_of_contact: string | null; went_live_at: string | null;
};

export async function getFellow(a: Account): Promise<{ fellow: Fellow; steps: Record<Step, { status: string; detail: Record<string, unknown> }> } | null> {
  return asAccount(a, async (c) => {
    const f = (await c.query("SELECT * FROM fellows WHERE account_id = $1", [a.id])).rows[0];
    if (!f) return null;
    const rows = (await c.query("SELECT step, status, detail FROM vetting_steps WHERE fellow_id = $1", [a.id])).rows;
    const steps = Object.fromEntries(STEPS.map((s) => [s, { status: "pending", detail: {} }])) as Record<Step, { status: string; detail: Record<string, unknown> }>;
    for (const r of rows) steps[r.step as Step] = { status: r.status, detail: r.detail };
    return { fellow: f, steps };
  });
}

export async function requireFellow(a: Account) {
  const f = await getFellow(a);
  if (!f) throw new FellowError(404, "Apply to Kalam Fellows first");
  return f;
}

const displayName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

export type Application = { fullName: string; college: string; course: string; year: string; collegeEmail?: string; worlds: string[]; languages: string[]; hoursPerWeek: number; city: string };

/** Step 1-2 of the journey: phone OTP is done; record the profile, worlds and hours. */
export async function apply(a: Account, app: Application) {
  return system(async (c) => {
    const acc = (await c.query("SELECT role, (SELECT count(*) FROM learners l WHERE l.guardian_account_id = a.id AND l.erased_at IS NULL) AS kids FROM accounts a WHERE id = $1", [a.id])).rows[0];
    if (acc.role !== "parent" && acc.role !== "fellow") throw new FellowError(409, "This number belongs to a staff account");
    if (acc.kids > 0) throw new FellowError(409, "This number manages a learner account. Please apply with your own number.");
    const inPilot = app.city.trim().toLowerCase() === PILOT.city.toLowerCase();
    await c.query("UPDATE accounts SET role = 'fellow', display_name = $2 WHERE id = $1", [a.id, displayName(app.fullName)]);
    await c.query(
      `INSERT INTO fellows (account_id, full_name, display_name, college, course, year, college_email, worlds, languages, hours_per_week, city, status, age_confirmed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
       ON DUPLICATE KEY UPDATE college = VALUES(college), course = VALUES(course), year = VALUES(year), worlds = VALUES(worlds),
         languages = VALUES(languages), hours_per_week = VALUES(hours_per_week)`,
      [a.id, app.fullName.trim(), displayName(app.fullName), app.college.trim(), app.course.trim(), app.year, app.collegeEmail || null, app.worlds, app.languages, app.hoursPerWeek, app.city.trim(), inPilot ? "vetting" : "waitlisted"],
    );
    for (const s of STEPS) await insertOnce(c, "INSERT INTO vetting_steps (fellow_id, step, detail) VALUES ($1,$2,'{}')", [a.id, s]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'fellow_applied','fellow',$2,$3)", [a.id, a.id, { city: app.city, inPilot }]);
    return { status: inPilot ? "vetting" : "waitlisted" };
  });
}

async function setStep(c: Tx, fellowId: string, step: Step, status: string, detail: Record<string, unknown>, reviewer?: string) {
  await c.query("UPDATE vetting_steps SET status = $3, detail = JSON_MERGE_PATCH(detail, $4), reviewed_by = $5, updated_at = now() WHERE fellow_id = $1 AND step = $2", [fellowId, step, status, detail, reviewer ?? null]);
}

/** Step 3: subject test. Two attempts, then a person reviews. */
export async function takeSubjectTest(a: Account, world: string, answers: number[]) {
  const { fellow, steps } = await requireFellow(a);
  if (!subjectTests[world] || !fellow.worlds.includes(world)) throw new FellowError(422, "Pick one of your worlds");
  const st = steps.subject_test;
  if (st.status === "passed") return { passed: true, correct: null, total: null, attemptsLeft: 0 };
  const attempts = Number(st.detail.attempts ?? 0);
  if (attempts >= 2) throw new FellowError(409, "You have used both attempts. Our team will review and contact you.");
  const g = gradeSubject(world, answers);
  await system((c) => setStep(c, a.id, "subject_test", g.passed ? "passed" : attempts + 1 >= 2 ? "failed" : "pending", { attempts: attempts + 1, world, last: `${g.correct}/${g.total}` }));
  return { ...g, attemptsLeft: g.passed ? 0 : 1 - attempts };
}

/** Step 4: recorded demo, submitted as a private link and reviewed by a person. Paid once accepted. */
export async function submitDemo(a: Account, url: string, topic: string) {
  await requireFellow(a);
  await system((c) => setStep(c, a.id, "demo", "submitted", { url, topic, submitted_at: new Date().toISOString() }));
}

/** Step 5 (part): references. Identity and background go through a licensed vendor; ops records only the outcome and the vendor reference. */
export async function submitReferences(a: Account, refs: { name: string; relation: string; contact: string }[]) {
  await requireFellow(a);
  await system((c) => setStep(c, a.id, "references", "submitted", { refs }));
}

/** Step 6: Kalam Academy. Each passed module is paid training time. */
export async function completeModule(a: Account, moduleId: string, answers: number[]) {
  const { fellow } = await requireFellow(a);
  const m = academy.find((x) => x.id === moduleId);
  if (!m) throw new FellowError(404, "Module not found");
  const g = gradeModule(m, answers);
  if (!g.passed) return { ...g, academyDone: false };
  return system(async (c) => {
    await insertOnce(c, "INSERT INTO academy_progress (fellow_id, module_id, score) VALUES ($1,$2,$3)", [a.id, m.id, g.score]);
    const rate = await rateFor(c, "training_hour");
    if (rate) await addEarning(c, fellow.account_id, { kind: "training", description: `Kalam Academy: ${m.title}`, gross: Math.round((rate.per_session_paise * m.minutes) / 60) });
    const done = (await c.query("SELECT module_id FROM academy_progress WHERE fellow_id = $1", [a.id])).rows.map((r) => r.module_id);
    const academyDone = mandatoryModules.every((id) => done.includes(id));
    if (academyDone) await setStep(c, a.id, "academy", "passed", { completed: done.length });
    return { ...g, academyDone };
  });
}

/** Step 7: accept the current terms and code of conduct (in the Fellow's chosen language). */
export async function acceptTerms(a: Account, termIds: string[]) {
  await requireFellow(a);
  return system(async (c) => {
    const current = (await c.query(
      // Latest effective version of each kind among those the Fellow was shown.
      `SELECT id, kind FROM (SELECT id, kind, ROW_NUMBER() OVER (PARTITION BY kind ORDER BY effective_at DESC) AS rn
         FROM terms_versions WHERE id IN ($1) AND effective_at <= now()) t WHERE rn = 1`,
      [termIds],
    )).rows;
    if (current.length !== 2) throw new FellowError(422, "Please accept both the Fellow terms and the code of conduct");
    for (const t of current) await insertOnce(c, "INSERT INTO terms_acceptances (fellow_id, terms_id) VALUES ($1,$2)", [a.id, t.id]);
    await setStep(c, a.id, "terms", "passed", { accepted: current.map((t) => t.id) });
  });
}

/** Ops review of a step (demo, identity, background, references, or a manual retest). */
export async function reviewStep(staff: Account, fellowId: string, step: Step, outcome: "passed" | "failed", note: string, vendorRef?: string) {
  return system(async (c) => {
    const f = (await c.query("SELECT account_id FROM fellows WHERE account_id = $1", [fellowId])).rows[0];
    if (!f) throw new FellowError(404, "Fellow not found");
    await setStep(c, fellowId, step, outcome, { note, vendor_ref: vendorRef ?? null, reviewed_at: new Date().toISOString() }, staff.id);
    if (step === "demo" && outcome === "passed") {
      const rate = await rateFor(c, "demo");
      if (rate) await addEarning(c, fellowId, { kind: "demo", description: "Recorded demo", gross: rate.per_session_paise });
    }
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'vetting_review','fellow',$2,$3)", [staff.id, fellowId, { step, outcome, note }]);
  });
}

export function readyToGoLive(steps: Record<Step, { status: string }>) {
  return STEPS.every((s) => steps[s].status === "passed");
}

/** Step 9: go live. Every step passed, pilot city, under the pilot cap. */
export async function goLive(staff: Account, fellowId: string) {
  return system(async (c) => {
    const f = (await c.query("SELECT status, city FROM fellows WHERE account_id = $1 FOR UPDATE", [fellowId])).rows[0];
    if (!f) throw new FellowError(404, "Fellow not found");
    const steps = (await c.query("SELECT step, status FROM vetting_steps WHERE fellow_id = $1", [fellowId])).rows;
    const missing = STEPS.filter((s) => steps.find((x) => x.step === s)?.status !== "passed");
    if (missing.length) throw new FellowError(409, `Not ready: ${missing.map((m) => STEP_LABEL[m]).join(", ")}`);
    const live = (await c.query("SELECT count(*) AS n FROM fellows WHERE status = 'live'")).rows[0].n;
    if (live >= PILOT.maxLive) throw new FellowError(409, `The pilot is full (${PILOT.maxLive} live Fellows)`);
    await c.query("UPDATE fellows SET status = 'live', went_live_at = now() WHERE account_id = $1", [fellowId]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'fellow_live','fellow',$2)", [staff.id, fellowId]);
  });
}

/** Exam Mode: pauses the gig board. Never affects tier (tiers ignore activity volume). */
export async function setExamMode(a: Account, until: string | null) {
  await requireFellow(a);
  await asAccount(a, (c) => c.query("UPDATE fellows SET exam_mode_until = $2 WHERE account_id = $1", [a.id, until]));
}
