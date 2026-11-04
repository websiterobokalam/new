import { test, expect, type Page } from "@playwright/test";
import { applyAsFellow, accountId, passSteps, ALL_STEPS, PRE_CONTACT, staffPage, ownerQuery, login, addLearner, newId } from "../helpers";
import { rosterFor } from "../../src/lib/fellows/gigs";
import { academy } from "../../src/content/fellows/academy";
import { subjectTests } from "../../src/content/fellows/subject-tests";

test.describe.configure({ mode: "parallel", timeout: 90_000 });

/** Answer a quiz rendered with shuffled options by clicking the correct option text. */
async function answerQuiz(page: Page, quiz: { options: string[]; answer: number }[], wrongAt?: number) {
  const sets = page.locator("form fieldset");
  for (let i = 0; i < quiz.length; i++) {
    const want = i === wrongAt ? quiz[i].options.find((_, j) => j !== quiz[i].answer)! : quiz[i].options[quiz[i].answer];
    await sets.nth(i).getByLabel(want, { exact: true }).check();
  }
}

/** A gig owned by this test, so parallel tests never share one. */
async function makeGig(kind: string, opts: { batchId?: string; startsInHours?: number; minutes?: number; title?: string } = {}) {
  const rate = (await ownerQuery<{ per_session_paise: number }>("SELECT per_session_paise FROM rate_card WHERE gig_kind = $1", [kind]))[0];
  const title = opts.title ?? `${kind} ${Math.random().toString(36).slice(2, 8)}`;
  const id = newId();
  await ownerQuery(
    `INSERT INTO gigs (id, kind, batch_id, title, world, language, starts_at, duration_min, mode, city, pay_paise, rate_sample)
     VALUES ($7,$1,$2,$3,'robotics','en', $4, $5, 'online', 'Hyderabad', $6, true)`,
    [kind, opts.batchId ?? null, title, new Date(Date.now() + (opts.startsInHours ?? 30) * 3600_000), opts.minutes ?? 60, rate.per_session_paise, id],
  );
  return { id, title };
}

test("apply: pilot city goes to vetting, other cities to the waitlist", async ({ page, browser }) => {
  await applyAsFellow(page);
  await expect(page.getByRole("heading", { name: /Your path to teaching/ })).toBeVisible();
  await expect(page.getByText("Subject test", { exact: true })).toBeVisible();
  const other = await (await browser.newContext()).newPage();
  await applyAsFellow(other, { city: "Pune" });
  await expect(other.getByText("You're on the waitlist.")).toBeVisible();
});

test("subject test and Academy: safety modules need every answer right; passing is paid training", async ({ page }) => {
  await applyAsFellow(page);
  await page.goto("/app/fellow/test?world=robotics");
  await answerQuiz(page, subjectTests.robotics);
  await page.getByRole("button", { name: "Submit test" }).click();
  await expect(page.getByText("Passed. Nice work.")).toBeVisible();

  const safety = academy.find((m) => m.id === "child-safety")!;
  await page.goto("/app/fellow/academy/child-safety");
  await answerQuiz(page, safety.quiz, 0);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText(/Not this time/)).toBeVisible();
  await page.reload();
  await answerQuiz(page, safety.quiz);
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("Passed. Nice work.")).toBeVisible();
  await page.goto("/app/fellow/earnings");
  await expect(page.getByText("Kalam Academy: Child safety and safeguarding")).toBeVisible();
});

test("terms: plain terms in three languages; accepting passes the step", async ({ page }) => {
  await applyAsFellow(page);
  await page.goto("/app/fellow/terms?lang=te");
  await expect(page.getByRole("heading", { name: "కలాం ఫెలో నిబంధనలు (సరళ రూపం)" }) /* the signed version stays in force until the Kalamite version takes effect, 14 days after publication */).toBeVisible();
  await page.goto("/app/fellow/terms");
  await expect(page.getByText("We give you 14 days' notice").first()).toBeVisible();
  await page.getByRole("button", { name: "I accept the terms and the code of conduct" }).click();
  await expect(page).toHaveURL(/\/app\/fellow$/);
  await expect(page.locator("li", { hasText: "Terms and code of conduct" }).getByText("passed")).toBeVisible();
});

test("no contact with children before checks: shadow gigs unlock only after every pre-contact step", async ({ page }) => {
  const phone = await applyAsFellow(page);
  const gig = await makeGig("shadow");
  await page.goto("/app/fellow/gigs");
  const card = page.locator("li", { hasText: gig.title });
  await expect(card.getByText("Finish your checks, Academy and terms first")).toBeVisible();
  await expect(card.getByRole("button", { name: "Accept" })).toBeDisabled();
  await passSteps(phone, PRE_CONTACT);
  await page.reload();
  await card.getByRole("button", { name: "Accept" }).click();
  await expect(card.getByRole("link", { name: "Teach mode" })).toBeVisible();
});

test("gig board: pay shown first, decline has no penalty, weekly cap and Exam Mode are enforced", async ({ page }) => {
  const phone = await applyAsFellow(page);
  const id = await passSteps(phone, ALL_STEPS, true);
  await ownerQuery("UPDATE fellows SET weekly_cap_hours = 1 WHERE account_id = $1", [id]);
  const a = await makeGig("doubt_desk", { startsInHours: 26, minutes: 30 });
  const b = await makeGig("live_batch", { startsInHours: 28 });
  const c = await makeGig("live_batch", { startsInHours: 32 });
  await page.goto("/app/fellow/gigs");
  await expect(page.locator("li", { hasText: a.title }).getByText(/no deductions/)).toBeVisible();
  await page.locator("li", { hasText: c.title }).getByRole("button", { name: "Decline" }).click();
  await expect(page.locator("li", { hasText: c.title }).getByText("Declined · no penalty")).toBeVisible();
  await page.locator("li", { hasText: a.title }).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator("li", { hasText: a.title }).getByRole("link", { name: "Teach mode" })).toBeVisible();
  await expect(page.locator("li", { hasText: b.title }).getByText("Over your 1-hour weekly cap")).toBeVisible();
  // Declines never count in tier metrics.
  const m = await ownerQuery<{ n: number }>("SELECT COUNT(*) AS n FROM gig_assignments WHERE fellow_id = $1 AND status IN ('delivered','no_show')", [id]);
  expect(m[0].n).toBe(0);
  await page.goto("/app/fellow");
  const until = new Date(Date.now() + 5 * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel("Pause until").fill(until);
  await page.getByRole("button", { name: "Turn on Exam Mode" }).click();
  await expect(page.getByText(/^On until/)).toBeVisible();
  await page.goto("/app/fellow/gigs");
  await expect(page.locator("li", { hasText: b.title }).getByText("Exam Mode is on")).toBeVisible();
});

test("teach mode: minimal roster, attendance and builds, pay line, escrow release, parent review", async ({ page, browser }) => {
  // A parent books and pays for a course batch.
  const parent = await (await browser.newContext()).newPage();
  await login(parent);
  const learnerId = await addLearner(parent, "Kavya", "9-11");
  const batch = { id: newId() };
  await ownerQuery("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode) SELECT $1, id, now() + INTERVAL 3 DAY, 60, 6, 'en', 'online' FROM courses WHERE slug = 'robo-ashaers-junior-l1'", [batch.id]);
  await parent.goto(`/app/book/${batch.id}`);
  await parent.locator("label.chip", { hasText: "Kavya" }).click();
  await parent.getByRole("button", { name: /^Pay ₹/ }).click();
  await parent.getByRole("button", { name: "Pay (test)" }).click();
  await expect(parent).toHaveURL(/orders/);

  // A live Kalamite accepts the batch gig.
  const phone = await applyAsFellow(page, { name: "Sana Iqbal" });
  const fid = await passSteps(phone, ALL_STEPS, true);
  const gig = await makeGig("live_batch", { batchId: batch.id, startsInHours: 70 });
  await page.goto("/app/fellow/gigs");
  await page.locator("li", { hasText: gig.title }).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator("li", { hasText: gig.title }).getByRole("link", { name: "Teach mode" })).toBeVisible();
  // The parent now sees the educator.
  await parent.goto("/app");
  await expect(parent.getByRole("link", { name: "Sana I." })).toBeVisible();

  // Session time arrives.
  await ownerQuery("UPDATE gigs SET starts_at = now() - INTERVAL 5 MINUTE WHERE id = $1", [gig.id]);
  await ownerQuery("UPDATE batches SET starts_at = now() - INTERVAL 5 HOUR WHERE id = $1", [batch.id]);
  await page.goto(`/app/fellow/gigs/${gig.id}`);
  const fs = page.locator("fieldset", { hasText: "Kavya · 9-11" });
  await expect(fs).toBeVisible();
  // Kalamites never get child data beyond first name, age band and progress.
  // Run the app's own roster query: exactly these fields, nothing else about the child or parent.
  const roster = await rosterFor({ query: async (sql: string, params?: unknown[]) => ({ rows: await ownerQuery(sql, params), affectedRows: 0, insertId: 0 }) }, gig.id, fid);
  expect(roster.length).toBe(1);
  expect(Object.keys(roster[0]).sort()).toEqual(["age_band", "booking_id", "built", "first_name", "status"]);
  // ...and nothing for a Kalamite who has not accepted this class.
  expect(await rosterFor({ query: async (sql: string, params?: unknown[]) => ({ rows: await ownerQuery(sql, params), affectedRows: 0, insertId: 0 }) }, gig.id, newId())).toEqual([]);
  await fs.getByLabel("Built today").selectOption({ label: "First light" });
  await fs.getByLabel("One line for the parent").fill("Kavya wired her first circuit and fixed a reversed LED herself.");
  await page.getByRole("button", { name: "Mark session delivered" }).click();
  await expect(page.getByText("Session recorded.")).toBeVisible();

  const prog = await ownerQuery("SELECT 1 FROM learner_progress WHERE learner_id = $1 AND project_id = 'robotics-1-light' AND status = 'built'", [learnerId]);
  expect(prog.length).toBe(1);
  const lines = await ownerQuery<{ kind: string }>("SELECT kind FROM earnings_lines WHERE fellow_id = $1", [fid]);
  expect(lines.map((l) => l.kind)).toContain("session");
  const rel = await ownerQuery<{ n: number }>("SELECT COUNT(*) AS n FROM ledger_journals WHERE kind = 'escrow_release' AND ref LIKE $1", [`%`]);
  expect(rel[0].n).toBeGreaterThan(0);
  const bal = await ownerQuery<{ s: string }>("SELECT coalesce(sum(amount_paise),0) AS s FROM ledger_postings");
  expect(Number(bal[0].s)).toBe(0);

  // Verified parent review.
  await parent.goto("/app");
  await expect(parent.getByText("Kavya wired her first circuit")).toBeVisible();
  await parent.getByLabel("5 of 5").check({ force: true });
  await parent.getByPlaceholder("Optional comment").fill("Patient and clear.");
  await parent.getByRole("button", { name: "Submit review" }).click();
  // The confirmation can unmount when the page refreshes; check the saved review instead.
  await expect.poll(async () => (await ownerQuery("SELECT COUNT(*) AS n FROM reviews WHERE fellow_id = $1 AND body = 'Patient and clear.'", [fid]))[0].n).toBe(1);
  await parent.goto(`/educators/${fid}`);
  await expect(parent.getByText("Patient and clear.")).toBeVisible();
  await expect(parent.getByText("✓ Background checked")).toBeVisible();
});

test("messages: contact details are blocked and flagged; normal messages flow both ways", async ({ page, browser }) => {
  const parent = await (await browser.newContext()).newPage();
  await login(parent);
  const lid = await addLearner(parent, "Rohan", "9-11");
  const batch = { id: newId() };
  await ownerQuery("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode) SELECT $1, id, now() + INTERVAL 4 DAY, 60, 6, 'en', 'online' FROM courses WHERE slug = 'free-build-session'", [batch.id]);
  await parent.request.post("/api/app/bookings", { data: { learnerId: lid, batchId: batch.id } });
  const phone = await applyAsFellow(page, { name: "Meghana Rao" });
  await passSteps(phone, ALL_STEPS, true);
  const fid = await accountId(phone);
  await ownerQuery("UPDATE batches SET educator_fellow_id = $2 WHERE id = $1", [batch.id, fid]);

  await parent.goto("/app");
  await parent.locator("li", { hasText: "Rohan" }).getByRole("button", { name: "Message educator" }).click();
  await expect(parent).toHaveURL(/\/app\/messages\//);
  await parent.getByPlaceholder("Write a message").fill("Hi! Rohan is excited for Saturday.");
  await parent.getByRole("button", { name: "Send" }).click();
  await expect(parent.getByText("Rohan is excited for Saturday.")).toBeVisible();
  await parent.getByPlaceholder("Write a message").fill("Please WhatsApp me on 98765 43210");
  await parent.getByRole("button", { name: "Send" }).click();
  await expect(parent.getByText(/Not sent: it looked like it had contact details/)).toBeVisible();

  await page.goto("/app/messages");
  await page.getByRole("link", { name: /Free Build Session/ }).click();
  await expect(page.getByText("Rohan is excited for Saturday.")).toBeVisible();
  await expect(page.getByText("98765")).toHaveCount(0);
  const flagged = await ownerQuery("SELECT 1 FROM safety_reports WHERE category = 'contact_details' AND details LIKE 'Message % blocked automatically%'");
  expect(flagged.length).toBeGreaterThan(0);
});

test("payouts: weekly run, bank reference, balanced ledger, visible to the Kalamite", async ({ page, browser }) => {
  const name = `Payout Tester ${Math.random().toString(36).slice(2, 7)}`;
  const phone = await applyAsFellow(page, { name });
  const fid = await passSteps(phone, ALL_STEPS, true);
  const gig = await makeGig("doubt_desk", { startsInHours: 25, minutes: 30 });
  await page.goto("/app/fellow/gigs");
  await page.locator("li", { hasText: gig.title }).getByRole("button", { name: "Accept" }).click();
  await expect(page.locator("li", { hasText: gig.title }).getByRole("link", { name: "Teach mode" })).toBeVisible();
  await ownerQuery("UPDATE gigs SET starts_at = now() - INTERVAL 1 HOUR WHERE id = $1", [gig.id]);
  await page.goto(`/app/fellow/gigs/${gig.id}`);
  await page.getByRole("button", { name: "Mark session delivered" }).click();
  await expect(page.getByText("Session recorded.")).toBeVisible();

  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/payouts");
  await ops.getByLabel("Week ending (inclusive)").fill(new Date(Date.now() + 86400_000).toISOString().slice(0, 10));
  await ops.getByRole("button", { name: "Create this week's payouts" }).click();
  await expect(ops.getByText("Payouts created")).toBeVisible();
  const row = ops.locator("li", { hasText: name });
  await row.getByLabel("Bank / UTR reference").fill("UTR123TEST");
  await row.getByRole("button", { name: "Mark paid" }).click();
  await expect(row.getByText(/paid · UTR123TEST/)).toBeVisible();
  const j = await ownerQuery("SELECT 1 FROM ledger_journals j JOIN payouts p ON p.id = j.ref WHERE j.kind = 'payout_paid' AND p.fellow_id = $1", [fid]);
  expect(j.length).toBe(1);
  const bal = await ownerQuery<{ s: string }>("SELECT coalesce(sum(amount_paise),0) AS s FROM ledger_postings");
  expect(Number(bal[0].s)).toBe(0);
  await page.goto("/app/fellow/earnings");
  await expect(page.getByText(/paid · ref UTR123TEST/)).toBeVisible();
  const csv = await (await page.request.get("/api/fellow/statement")).text();
  expect(csv).toContain(gig.title);
});

test("fair removal: 7 days' notice with a response; child safety suspends at once", async ({ page, browser }) => {
  const phone = await applyAsFellow(page, { name: "Case Tester" });
  const fid = await passSteps(phone, ALL_STEPS, true);
  const ops = await staffPage(browser, "ops");
  const r = await ops.request.post("/api/ops/cases", { data: { fellowId: fid, reasons: "Missed two sessions without notice in October.", childSafety: false } });
  expect(r.ok()).toBe(true);
  const caseId = (await ownerQuery<{ id: string }>("SELECT id FROM removal_cases WHERE fellow_id = $1", [fid]))[0].id;
  const early = await ops.request.post(`/api/ops/cases/${caseId}/decide`, { data: { decision: "removed", enquiryNotes: "Trying to remove early." } });
  expect(early.status()).toBe(409);
  // Ops cannot mark child safety; only the Safeguarding Lead can.
  const notSg = await ops.request.post("/api/ops/cases", { data: { fellowId: fid, reasons: "Attempting an immediate suspension as ops.", childSafety: true } });
  expect(notSg.status()).toBe(403);
  await page.goto("/app/fellow/support");
  await expect(page.getByText("Missed two sessions without notice in October.")).toBeVisible();
  await page.getByLabel("Your response").fill("My exams clashed; I should have used Exam Mode.");
  await page.getByRole("button", { name: "Send my response" }).click();
  await expect(page.getByText("Response recorded")).toBeVisible();

  const sg = await staffPage(browser, "safeguarding");
  const s = await sg.request.post("/api/ops/cases", { data: { fellowId: fid, reasons: "Credible child-safety concern reported by a partner school.", childSafety: true } });
  expect(s.ok()).toBe(true);
  const st = await ownerQuery<{ status: string }>("SELECT status FROM fellows WHERE account_id = $1", [fid]);
  expect(st[0].status).toBe("suspended");
  await page.goto("/app/fellow");
  await expect(page).toHaveURL(/\/login\/educator/); // sessions revoked at once
});

test("fellow cannot change their own status, and sees no family data", async ({ page, browser }) => {
  const phone = await applyAsFellow(page);
  const fid = await accountId(phone);
  // Database guard (installed where the host allows triggers): a Kalamite's
  // transaction cannot change staff-only fields.
  const mysql = (await import("mysql2/promise")).default;
  const { readFileSync } = await import("node:fs");
  const url = readFileSync("scripts/test.env", "utf8").match(/^DATABASE_URL=(.*)$/m)![1];
  const c = await mysql.createConnection(url);
  try {
    await c.query("SET @rk_role = 'fellow', @rk_account = ?", [fid]);
    await expect(c.query("UPDATE fellows SET status = 'live' WHERE account_id = ?", [fid])).rejects.toThrow(/only Robokalam staff/);
    await c.query("UPDATE fellows SET exam_mode_until = CURDATE() WHERE account_id = ?", [fid]); // availability is theirs
  } finally { await c.end(); }
  // App level: a parent's child exists, but the Kalamite's account sees none of it.
  const parent = await (await browser.newContext()).newPage();
  await login(parent);
  const lid = await addLearner(parent, "Nikhil", "9-11");
  const exp = await (await page.request.get("/api/app/export")).json();
  expect(exp.learners).toEqual([]);
  expect(exp.consentHistory).toEqual([]);
  const me = await (await page.request.get("/api/app/me")).json();
  expect(me.learners).toEqual([]);
  await page.goto(`/app/learners/${lid}`);
  await expect(page.getByText("Nikhil")).toHaveCount(0);
});
