import { expect, type Page } from "@playwright/test";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { toMysql, typeCast } from "../src/lib/db";

const env = Object.fromEntries(readFileSync("scripts/test.env", "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split(/=(.*)/s).slice(0, 2)));

/** Direct database access for test setup and assertions (bypasses app-level checks on purpose). */
export async function ownerQuery<T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const c = await mysql.createConnection({ uri: env.DATABASE_URL, timezone: "Z", decimalNumbers: true, supportBigNumbers: true, typeCast: typeCast as never });
  try {
    await c.query("SET time_zone = '+00:00'");
    const q = toMysql(sql, params);
    const [rows] = await c.query(q.sql, q.params);
    return (Array.isArray(rows) ? rows : []) as T[];
  } finally { await c.end(); }
}

export const newId = () => randomUUID();

export const randomPhone = () => "9" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");

export async function login(page: Page, phone = randomPhone(), next = "/app") {
  await page.goto(`/login/learner?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Parent's mobile number").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByText("I am 18 or older, and I am the parent").click();
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(new RegExp(next.replace(/\//g, "\\/") + "$"));
  return phone;
}

/** Add a child through the real consent form. */
export async function addLearner(page: Page, name: string, age = "9-11") {
  await page.goto("/app/learners/new");
  await page.getByLabel("Child's first name").fill(name);
  await page.locator("label.chip", { hasText: new RegExp(`^${age}$`) }).click();
  await page.getByText("I am this child's parent or lawful guardian").click();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: name })).toBeVisible();
  return page.url().split("/").pop()!;
}

/** Apply as a Fellow through the real flow. Returns the phone (without +91). */
export async function applyAsFellow(page: Page, opts: { city?: string; name?: string; worlds?: string[]; ref?: string } = {}) {
  const phone = randomPhone();
  await page.goto(opts.ref ? `/fellows/apply?ref=${opts.ref}` : "/fellows/apply");
  await page.getByLabel("Your mobile number").fill(phone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.getByLabel("Full name (as on your ID)").fill(opts.name ?? "Ravi Teja Kumar");
  await page.getByLabel("City").fill(opts.city ?? "Hyderabad");
  await page.getByLabel("College", { exact: true }).fill("Sample Engineering College");
  await page.getByLabel("Course or branch").fill("B.Tech ECE");
  for (const w of opts.worlds ?? ["Robotics", "Coding"]) await page.locator("label.chip", { hasText: new RegExp(`^${w}$`) }).click();
  await page.getByText("I am 18 or older.").click();
  await page.getByRole("button", { name: "Start my application" }).click();
  await expect(page).toHaveURL(/\/app\/fellow$/);
  return phone;
}

export async function accountId(phone: string) {
  return (await ownerQuery<{ id: string }>("SELECT id FROM accounts WHERE phone_e164 = $1", ["+91" + phone]))[0].id;
}

/** Test shortcut for steps a person reviews: mark checks passed, optionally go live. */
export async function passSteps(phone: string, steps: string[], live = false) {
  const id = await accountId(phone);
  await ownerQuery("UPDATE vetting_steps SET status = 'passed' WHERE fellow_id = $1 AND step IN ($2)", [id, steps]);
  if (live) await ownerQuery("UPDATE fellows SET status = 'live', went_live_at = now() WHERE account_id = $1", [id]);
  return id;
}

export const ALL_STEPS = ["subject_test", "demo", "identity", "background", "references", "academy", "terms", "shadow", "co_teach"];
export const PRE_CONTACT = ALL_STEPS.filter((s) => s !== "shadow" && s !== "co_teach");

export async function staffPage(browser: import("@playwright/test").Browser, role: "ops" | "safeguarding") {
  const p = await (await browser.newContext()).newPage();
  const phone = await login(p);
  await ownerQuery("UPDATE accounts SET role = $2 WHERE phone_e164 = $1", ["+91" + phone, role]);
  return p;
}

/** Sign in at the school door (staff only). */
export async function loginSchool(page: Page, phone: string, landing = /\/app\/(school|trainer)$/) {
  await page.goto("/login/school");
  await page.getByLabel("Staff mobile number").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page).toHaveURL(landing);
}

/** Test setup: a school with an admin, a trainer, a lab, equipment and one ERP-linked class. */
export async function makeSchool(opts: { slaHours?: number; erp?: boolean } = {}) {
  const tag = randomUUID().slice(0, 6);
  const s = { schoolId: newId(), labId: newId(), adminId: newId(), trainerId: newId(), classId: newId(), assetId: newId(), adminPhone: randomPhone(), trainerPhone: randomPhone(), name: `Test School ${tag}` };
  await ownerQuery("INSERT INTO schools (id, name, city, sla_hours, aadhya_tenant, erp_school_ref) VALUES ($1,$2,'Hyderabad',$3,$4,$5)",
    [s.schoolId, s.name, opts.slaHours ?? 72, opts.erp === false ? null : `t-${tag}`, opts.erp === false ? null : `erp-${tag}`]);
  for (const [id, phone, role, name] of [[s.adminId, s.adminPhone, "school_admin", `Asha ${tag}`], [s.trainerId, s.trainerPhone, "trainer", `Tarun ${tag}`]]) {
    await ownerQuery("INSERT INTO accounts (id, phone_e164, role, display_name) VALUES ($1,$2,$3,$4)", [id, "+91" + phone, role, name]);
    await ownerQuery("INSERT INTO school_staff (account_id, school_id, role, display_name) VALUES ($1,$2,$3,$4)", [id, s.schoolId, role, name]);
  }
  await ownerQuery("INSERT INTO labs (id, school_id, name) VALUES ($1,$2,$3)", [s.labId, s.schoolId, `Lab ${tag}`]);
  await ownerQuery("INSERT INTO lab_assets (id, lab_id, kind, label) VALUES ($1,$2,'robot',$3)", [s.assetId, s.labId, `Rover ${tag}`]);
  await ownerQuery("INSERT INTO school_classes (id, school_id, lab_id, label, grade, world, weekday, start_time, duration_min, students, trainer_account_id, erp_class_ref) VALUES ($1,$2,$3,$4,6,'robotics',1,'10:00',45,30,$5,$6)",
    [s.classId, s.schoolId, s.labId, `Grade 6 ${tag}`, s.trainerId, opts.erp === false ? null : `c-${tag}`]);
  return s;
}

/** A class session that started a few minutes ago, so it can be recorded. */
export async function startedSession(classId: string) {
  const id = newId();
  await ownerQuery("INSERT INTO class_sessions (id, class_id, starts_at) VALUES ($1,$2, UTC_TIMESTAMP(3) - INTERVAL 10 MINUTE)", [id, classId]);
  return id;
}

/** A sample batch to hang test bookings on. */
export async function anyBatch() {
  return (await ownerQuery<{ id: string }>("SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.sample LIMIT 1"))[0].id;
}

/** A parent, a child and an attended booking on a batch. Returns ids. */
export async function attendedBooking(batchId: string, opts: { paid?: number; status?: string } = {}) {
  const parent = newId(), learner = newId(), booking = newId();
  await ownerQuery("INSERT INTO accounts (id, phone_e164, adult_declared_at) VALUES ($1,$2, now())", [parent, "+91" + randomPhone()]);
  await ownerQuery("INSERT INTO learners (id, guardian_account_id, first_name, age_band, interests) VALUES ($1,$2,$3,'9-11','[]')", [learner, parent, `Kid${learner.slice(0, 4)}`]);
  await ownerQuery("INSERT INTO bookings (id, batch_id, learner_id, guardian_account_id, status) VALUES ($1,$2,$3,$4,$5)", [booking, batchId, learner, parent, opts.status ?? "attended"]);
  if (opts.paid) {
    await ownerQuery("INSERT INTO orders (id, booking_id, account_id, amount_paise, gst_paise, status, provider, paid_at) VALUES ($1,$2,$3,$4,$5,'paid','mock', now())",
      [newId(), booking, parent, opts.paid, Math.round(opts.paid - opts.paid / 1.18)]);
  }
  return { parent, learner, booking };
}

/**
 * Give a live Fellow a teaching record: delivered sessions, observations and
 * verified 5-star reviews, so they clear the Phase 5 bars.
 */
export async function teachingHistory(fellowId: string, opts: { sessions?: number; observation?: number; reviews?: number; tier?: string } = {}) {
  const batch = await anyBatch();
  for (let i = 0; i < (opts.sessions ?? 10); i++) {
    const gig = newId(), asg = newId();
    await ownerQuery("INSERT INTO gigs (id, kind, title, world, starts_at, duration_min, mode, city, pay_paise, status) VALUES ($1,'doubt_desk',$2,'coding', now() - INTERVAL $3 DAY, 30, 'online', 'Hyderabad', 30000, 'completed')", [gig, `History ${gig.slice(0, 6)}`, i + 1]);
    await ownerQuery("INSERT INTO gig_assignments (id, gig_id, fellow_id, status, delivered_at) VALUES ($1,$2,$3,'delivered', now() - INTERVAL $4 DAY)", [asg, gig, fellowId, i + 1]);
    if (i < 2 && opts.observation) {
      const v = opts.observation;
      await ownerQuery("INSERT INTO quality_reviews (id, assignment_id, reviewer_account_id, kind, rubric) VALUES ($1,$2,$3,'observation',$4)", [newId(), asg, fellowId, { prep: v, clarity: v, engagement: v, safety: v, outcome: v }]);
    }
  }
  for (let i = 0; i < (opts.reviews ?? 0); i++) {
    const b = await attendedBooking(batch);
    await ownerQuery("INSERT INTO reviews (id, booking_id, fellow_id, guardian_account_id, rating) VALUES ($1,$2,$3,$4,5)", [newId(), b.booking, fellowId, b.parent]);
  }
  if (opts.tier) await ownerQuery("UPDATE fellows SET tier = $2 WHERE account_id = $1", [fellowId, opts.tier]);
}
