import { test, expect } from "@playwright/test";
import { login, addLearner, applyAsFellow, passSteps, ALL_STEPS, ownerQuery, newId, emailsTo, verifyEmail, accountId, staffPage, randomPhone, loginSchoolByEmail } from "../helpers";

const sent = (rows: { status: string }[]) => rows.filter((r) => r.status === "sent").length;

test("interest: the enquiry is stored, the parent gets an acknowledgement and the team is alerted", async ({ request }) => {
  const email = `lead.${newId().slice(0, 8)}@example.test`;
  const r = await request.post("/api/leads", { data: { door: "learner", parentName: "Anita Rao", phone: randomPhone(), email, childAgeBand: "9-11", interest: "robotics", contactOptIn: true } });
  expect(r.ok()).toBe(true);
  const { ref } = await r.json();
  expect((await ownerQuery("SELECT door, email FROM leads WHERE ref = $1", [ref]))[0]).toEqual({ door: "learner", email });
  await expect.poll(async () => sent(await emailsTo({ to: email }, "lead_ack_learner"))).toBe(1);
  const [ack] = await emailsTo({ to: email }, "lead_ack_learner");
  expect(ack.subject).toContain(ref);
  expect(ack.body_text).toContain("Book a Free Build Session");
  await expect.poll(async () => (await ownerQuery("SELECT COUNT(*) AS n FROM email_outbox WHERE to_email = 'ops@example.test' AND dedupe_key = $1", [`staff-lead:${ref}`]))[0].n).toBe(1);
});

test("email settings: confirm by link; reminders can be turned off; one-click unsubscribe works", async ({ page }) => {
  const phone = await login(page);
  const email = await verifyEmail(page);
  const id = await accountId(phone);
  const acc = (await ownerQuery("SELECT email, email_verified_at FROM accounts WHERE id = $1", [id]))[0];
  expect(acc.email).toBe(email);
  expect(acc.email_verified_at).not.toBeNull();
  await page.getByRole("button", { name: "Turn off reminders and summaries" }).click();
  await expect.poll(async () => (await ownerQuery("SELECT email_updates FROM accounts WHERE id = $1", [id]))[0].email_updates).toBe(false);
  // The unsubscribe link in update emails needs a valid signature.
  const bad = await page.request.get(`/api/email/prefs?a=${id}&t=wrong-token-wrong-token-wrong-tok&updates=0`);
  expect(bad.status()).toBe(400);
});

test("a booking confirmation and consent receipt reach a parent with a confirmed email", async ({ page }) => {
  const phone = await login(page);
  await verifyEmail(page);
  const id = await accountId(phone);
  await addLearner(page, "Ravi", "9-11");
  await expect.poll(async () => sent(await emailsTo({ accountId: id }, "consent_receipt"))).toBe(1);
  const [receipt] = await emailsTo({ accountId: id }, "consent_receipt");
  expect(receipt.body_text).toContain("Recording online classes for safety");
  expect(receipt.body_text).not.toContain("One-to-one classes are on");
});

test("one-to-one: needs email, specific consent and the parent's checklist; oversight emails before and after; withdrawal stops it", async ({ page, browser }, ti) => {
  test.skip(ti.project.name !== "desktop", "Uses the sample one-to-one batches and global terms dates; run once");
  test.setTimeout(90_000);
  const phone = await login(page);
  const parentId = await accountId(phone);
  const learnerId = await addLearner(page, "Asha", "12-14");
  const [batch] = await ownerQuery<{ id: string }>("SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.slug = 'robotics-project-mentoring-1-1' AND b.starts_at > now() AND NOT EXISTS (SELECT 1 FROM bookings x WHERE x.batch_id = b.id) ORDER BY b.starts_at LIMIT 1");

  // 1. Without email and one-to-one consent, the child can't be picked.
  await page.goto(`/app/book/${batch.id}`);
  await expect(page.getByRole("heading", { name: "One-to-one, with you in the loop" })).toBeVisible();
  await expect(page.getByText("Add and confirm your email first.")).toBeVisible();
  await expect(page.locator("label.chip", { hasText: "Asha" })).toContainText("turn on one-to-one in the Consent centre");

  // 2. One-to-one consent itself needs a confirmed email.
  await page.goto("/app/consent");
  const toggle = page.getByRole("switch", { name: /Asha: So your child can learn one-to-one/ });
  await toggle.click();
  await expect(page.getByText(/One-to-one classes need a confirmed email/)).toBeVisible();
  const email = await verifyEmail(page);
  await page.goto("/app/consent");
  await page.getByRole("switch", { name: /Asha: So your child can learn one-to-one/ }).click();
  await expect(page.getByRole("switch", { name: /Asha: So your child can learn one-to-one/ })).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => (await emailsTo({ accountId: parentId }, "consent_receipt")).some((r) => r.payload.oneToOne)).toBe(true);

  // 3. Book: the checklist must be confirmed, and is stored with the booking.
  await page.goto(`/app/book/${batch.id}`);
  await page.locator("label.chip", { hasText: "Asha" }).click();
  const pay = page.getByRole("button", { name: /^Pay ₹/ });
  await expect(pay).toBeDisabled();
  for (const box of await page.getByRole("group", { name: /Before you book a one-to-one class/ }).getByRole("checkbox").all()) await box.check();
  await pay.click();
  await page.getByRole("button", { name: "Pay (test)" }).click();
  await expect(page).toHaveURL(/\/app\/orders$/);
  const [booking] = await ownerQuery<{ id: string }>("SELECT id FROM bookings WHERE learner_id = $1 AND batch_id = $2", [learnerId, batch.id]);
  expect((await ownerQuery("SELECT text_sha256 FROM one_to_one_acks WHERE booking_id = $1", [booking.id])).length).toBe(1);
  await expect.poll(async () => sent(await emailsTo({ to: email }, "payment_receipt"))).toBe(1);

  // 4. Only an experienced Kalamite under the updated code of conduct can take it.
  const fp = await (await browser.newContext()).newPage();
  const fphone = await applyAsFellow(fp, { name: "Kiran Mentor" });
  const fid = await passSteps(fphone, ALL_STEPS, true);
  const gig = newId();
  await ownerQuery("INSERT INTO gigs (id, kind, batch_id, title, world, starts_at, duration_min, mode, city, pay_paise) VALUES ($1,'one_to_one',$2,$3,'robotics', now() + INTERVAL 20 HOUR, 60, 'online', 'Hyderabad', 50000)", [gig, batch.id, `One-to-one ${gig.slice(0, 6)}`]);
  await fp.goto("/app/fellow/gigs");
  const card = fp.locator("li", { hasText: `One-to-one ${gig.slice(0, 6)}` });
  await expect(card.getByText("One-to-one classes need the Kalamite level or above")).toBeVisible();
  await ownerQuery("UPDATE fellows SET tier = 'fellow' WHERE account_id = $1", [fid]);
  await fp.reload();
  await expect(card.getByText(/Accept the updated code of conduct/)).toBeVisible();
  // The new code of conduct was announced 14 days ago and is now in effect (time travel for the test).
  await ownerQuery("UPDATE terms_versions SET published_at = now() - INTERVAL 15 DAY, effective_at = now() - INTERVAL 1 SECOND WHERE id LIKE 'code-of-conduct-2026-12-%'");
  await fp.goto("/app/fellow/terms");
  await expect(fp.getByText("One-to-one classes").first()).toBeVisible();
  await fp.getByRole("button", { name: "I accept the terms and the code of conduct" }).click();
  await expect(fp).toHaveURL(/\/app\/fellow$/);
  await fp.goto("/app/fellow/gigs");
  await card.getByRole("button", { name: "Accept" }).click();
  await expect(card.getByRole("link", { name: "Teach mode" })).toBeVisible();

  // 5. The parent gets the notice before the session (oversight: sent even with reminders off).
  await ownerQuery("UPDATE accounts SET email_updates = FALSE WHERE id = $1", [parentId]);
  const cron = await page.request.get("/api/cron/email?key=test-cron-secret");
  expect(cron.ok()).toBe(true);
  await expect.poll(async () => sent(await emailsTo({ to: email }, "oto_before"))).toBe(1);
  const [before] = await emailsTo({ to: email }, "oto_before");
  expect(before.category).toBe("oversight");
  expect(before.body_text).toContain("You can join this session from your account at any time");

  // 6. The session: no summary, no record. With a summary, the parent gets it.
  await ownerQuery("UPDATE gigs SET starts_at = now() - INTERVAL 5 MINUTE WHERE id = $1", [gig]);
  await fp.goto(`/app/fellow/gigs/${gig}`);
  await expect(fp.getByRole("heading", { name: "One-to-one session: the parent is in the loop" })).toBeVisible();
  await fp.getByRole("button", { name: "Mark session delivered" }).click();
  await expect(fp.getByText(/before recording a one-to-one session/)).toBeVisible();
  await fp.getByLabel("One line for the parent").fill("Asha wired the motor driver and got her rover turning both ways.");
  await fp.getByRole("button", { name: "Mark session delivered" }).click();
  await expect(fp.getByText("Session recorded.")).toBeVisible();
  await expect.poll(async () => sent(await emailsTo({ to: email }, "oto_after"))).toBe(1);
  expect((await emailsTo({ to: email }, "oto_after"))[0].body_text).toContain("Asha wired the motor driver");

  // 7. The parent withdraws: the next one-to-one session can't be recorded.
  await page.goto("/app/consent");
  await page.getByRole("switch", { name: /Asha: So your child can learn one-to-one/ }).click();
  await expect(page.getByRole("switch", { name: /Asha: So your child can learn one-to-one/ })).toHaveAttribute("aria-checked", "false");
  await expect.poll(async () => (await emailsTo({ accountId: parentId }, "consent_withdrawn")).length).toBe(1);
  const gig2 = newId();
  await ownerQuery("INSERT INTO gigs (id, kind, batch_id, title, world, starts_at, duration_min, mode, city, pay_paise, status) VALUES ($1,'one_to_one',$2,'One-to-one follow-up','robotics', now() - INTERVAL 5 MINUTE, 60, 'online', 'Hyderabad', 50000, 'filled')", [gig2, batch.id]);
  await ownerQuery("INSERT INTO gig_assignments (id, gig_id, fellow_id, status) VALUES ($1,$2,$3,'accepted')", [newId(), gig2, fid]);
  const r = await fp.request.post(`/api/fellow/gigs/${gig2}/deliver`, { data: { records: [{ bookingId: booking.id, attended: true, feedback: "This should be refused because consent was withdrawn." }] } });
  expect(r.status()).toBe(409);
  expect((await r.json()).error).toMatch(/withdrawn consent/);
});

test("one-to-one is online only (database check)", async () => {
  await expect(ownerQuery("INSERT INTO gigs (id, kind, title, world, starts_at, duration_min, mode, location, responsible_adult, city, pay_paise) VALUES ($1,'one_to_one','x','robotics', now(), 60, 'offline', 'Somewhere', 'Someone', 'Hyderabad', 100)", [newId()])).rejects.toThrow();
});

test("safety report: the reporter is acknowledged and the Safeguarding Lead is alerted, without details in email", async ({ page }) => {
  const phone = await login(page);
  await verifyEmail(page);
  const id = await accountId(phone);
  const r = await page.request.post("/api/app/reports", { data: { page: "/app", category: "safety", details: "Something private that must never appear in email." } });
  expect(r.ok()).toBe(true);
  await expect.poll(async () => sent(await emailsTo({ accountId: id }, "safety_ack"))).toBe(1);
  await expect.poll(async () => (await ownerQuery("SELECT COUNT(*) AS n FROM email_outbox WHERE template = 'safeguarding_alert' AND status = 'sent' AND to_email = 'safeguarding@example.test'"))[0].n).toBeGreaterThan(0);
  const alerts = await ownerQuery<{ body_text: string }>("SELECT body_text FROM email_outbox WHERE template = 'safeguarding_alert' AND status = 'sent'");
  for (const a of alerts) expect(a.body_text).not.toContain("must never appear");
});

test("no email goes to an unconfirmed address, except the confirmation link", async ({ page }) => {
  const phone = await login(page);
  const id = await accountId(phone);
  await page.goto("/app/email");
  await page.getByLabel("Email address").fill(`unconfirmed.${newId().slice(0, 6)}@example.test`);
  await page.getByRole("button", { name: "Add email" }).click();
  await expect(page.getByText("Check your inbox for a confirmation link.")).toBeVisible();
  await addLearner(page, "Neel", "9-11");
  const templates = (await emailsTo({ accountId: id })).map((e) => e.template);
  expect(templates).toEqual(["verify_email"]);
});

test("a school admin added by email is told how to sign in, and signs in with an email code", async ({ browser, page }) => {
  const ops = await staffPage(browser, "ops");
  const email = `admin.${newId().slice(0, 6)}@example.test`;
  const school = `Email School ${newId().slice(0, 5)}`;
  await ops.goto("/app/ops/schools");
  await ops.getByLabel("School name").fill(school);
  await ops.getByLabel("School admin's name").fill("Priya Admin");
  await ops.getByLabel("School admin's email").fill(email);
  await ops.getByRole("button", { name: "Add school" }).click();
  await expect(ops.getByText("School added. Their admin can sign in now.")).toBeVisible();
  await expect.poll(async () => sent(await emailsTo({ to: email }, "login_created"))).toBe(1);
  await loginSchoolByEmail(page, email, /\/app\/school$/);
  await expect(page.getByText(school)).toBeVisible();
});

test("parents see one-to-one explained plainly, with the full terms one tap away", async ({ page }) => {
  await page.goto("/one-to-one");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("One-to-one classes, with you in the loop.");
  await expect(page.getByRole("heading", { name: "Before every session" })).toBeVisible();
  await page.getByText("Read the full terms for one-to-one classes").click();
  await expect(page.getByText("Online only", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("One-to-one, with you in the loop").first()).toBeVisible();
});
