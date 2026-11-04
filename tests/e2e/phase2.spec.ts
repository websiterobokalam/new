import { test, expect } from "@playwright/test";
import { login, addLearner, ownerQuery, randomPhone, newId } from "../helpers";

test.describe.configure({ mode: "parallel" });

test("Free Build Session: age, OTP, consent, slot, booked", async ({ page }) => {
  // Each run gets its own roomy slot, scheduled earliest so it is listed first.
  await ownerQuery("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode) SELECT $1, id, $2, 60, 30, 'en', 'online' FROM courses WHERE slug = 'free-build-session'", [newId(), new Date(Date.now() + (65 + Math.random() * 5) * 60_000)]);
  await page.goto("/learn/build-session");
  await page.locator("label.chip", { hasText: /^9-11$/ }).click();
  await page.locator("label.chip", { hasText: "IoT" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const parentPhone = randomPhone();
  await page.getByLabel("Parent's mobile number").fill(parentPhone);
  await page.getByRole("button", { name: "Send code" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByText("I am 18 or older, and I am the parent").click();
  await page.getByRole("button", { name: "Verify and continue" }).click();
  // New family: straight to the consent form, with an itemised notice
  await expect(page.getByRole("heading", { name: /How Robokalam uses your child's information/ })).toBeVisible();
  await page.getByLabel("Child's first name").fill("Meera");
  await expect(page.getByRole("button", { name: "Save and continue" })).toBeDisabled(); // guardian declaration required
  await page.getByText("I am this child's parent or lawful guardian").click();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByRole("heading", { name: "Pick a time" })).toBeVisible();
  await page.getByRole("group", { name: "Available times" }).locator("label.chip").first().click();
  await page.getByRole("button", { name: "Book my free session" }).click();
  await expect(page.getByRole("heading", { name: "Booked. See you there." })).toBeVisible();
  await expect(page.getByText("Your mini mission")).toBeVisible();
  await page.getByRole("link", { name: "Go to your family home" }).click();
  await expect(page.getByText("Free Build Session · Meera")).toBeVisible();
  // Optional consents default to OFF; required ones are recorded ON against the notice hash
  const rows = await ownerQuery<{ purpose: string; granted: boolean; evidence: { notice_sha256: string } }>(
    "SELECT e.purpose, e.granted, e.evidence FROM consent_events e JOIN accounts a ON a.id = e.guardian_account_id WHERE a.phone_e164 = $1 ORDER BY e.id DESC", ["+91" + parentPhone]);
  const map = Object.fromEntries(rows.map((r) => [r.purpose, r.granted]));
  expect(map).toMatchObject({ account: true, live_classes: true, class_recording: true, whatsapp: false, follow_up: false, ai_helper: false, portfolio_sharing: false });
  expect(rows[0].evidence.notice_sha256).toMatch(/^[0-9a-f]{64}$/);
});

test("consent: API refuses a learner without required consents", async ({ page }) => {
  await login(page);
  const notice = (await ownerQuery<{ id: string }>("SELECT id FROM consent_notices WHERE language = 'en' ORDER BY published_at DESC, id DESC"))[0];
  const r = await page.request.post("/api/app/learners", { data: { firstName: "Kiran", ageBand: "9-11", interests: [], noticeId: notice.id, consents: { account: true, live_classes: true, class_recording: false }, guardianDeclared: true } });
  expect(r.status()).toBe(422);
});

test("consent: withdrawing a required item pauses booking; withdrawal is logged", async ({ page }) => {
  await login(page);
  const id = await addLearner(page, "Arjun");
  await page.goto("/app/consent");
  await page.getByRole("switch", { name: /Arjun: Child safety and quality checks/ }).click();
  await expect(page.getByRole("switch", { name: /Arjun: Child safety and quality checks/ })).toHaveAttribute("aria-checked", "false");
  await page.goto("/app");
  await expect(page.getByText("Classes paused: a required consent is off")).toBeVisible();
  const batch = (await ownerQuery<{ id: string }>("SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.slug = 'free-build-session' AND b.starts_at > now() LIMIT 1"))[0];
  const r = await page.request.post("/api/app/bookings", { data: { learnerId: id, batchId: batch.id } });
  expect(r.status()).toBe(409);
  expect((await r.json()).code).toBe("consent");
});

test("paid course: fee with GST shown before payment, mock payment, invoice, balanced escrow ledger", async ({ page }) => {
  await login(page);
  await addLearner(page, "Diya", "9-11");
  await page.goto("/courses?world=robotics");
  await page.getByRole("link", { name: "See times" }).first().click();
  await page.getByRole("main").getByRole("link", { name: "Book" }).first().click();
  await expect(page.getByText("GST", { exact: true })).toBeVisible();
  await expect(page.getByText("Sample fee (review build)")).toBeVisible();
  await page.locator("label.chip", { hasText: "Diya" }).click();
  await page.getByRole("button", { name: /^Pay ₹/ }).click();
  await expect(page.getByText("Test payment screen. No real money moves.")).toBeVisible();
  await page.getByRole("button", { name: "Pay (test)" }).click();
  await expect(page).toHaveURL(/\/app\/orders$/);
  await expect(page.getByText(/RK\/\d{4}-\d{2}\/\d{6}/)).toBeVisible();
  await page.getByRole("link", { name: "Invoice" }).click();
  await expect(page.getByRole("heading", { name: "Tax invoice" })).toBeVisible();
  const order = (await ownerQuery<{ id: string; amount_paise: number; gst_paise: number }>("SELECT o.id, o.amount_paise, o.gst_paise FROM orders o JOIN bookings b ON b.id = o.booking_id JOIN learners l ON l.id = b.learner_id WHERE l.first_name = 'Diya' AND o.status = 'paid'"))[0];
  const post = await ownerQuery<{ account: string; amount_paise: string }>("SELECT p.account, p.amount_paise FROM ledger_postings p JOIN ledger_journals j ON j.id = p.journal_id WHERE j.kind = 'payment_captured' AND j.ref = $1", [order.id]);
  const m = Object.fromEntries(post.map((p) => [p.account, Number(p.amount_paise)]));
  expect(m.gateway_clearing).toBe(order.amount_paise);
  expect(m.learner_escrow).toBe(-(order.amount_paise - order.gst_paise));
  expect(m.gst_payable).toBe(-order.gst_paise);
});

test("refund: self-serve request, ops approves, gateway refund, ledger reversal", async ({ page, browser }) => {
  await login(page);
  await addLearner(page, "Sana", "9-11");
  const batch = (await ownerQuery<{ id: string }>("SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.slug = 'codo-ashaers-junior-l1' AND b.starts_at > now() + INTERVAL 30 HOUR LIMIT 1"))[0];
  await page.goto(`/app/book/${batch.id}`);
  await page.locator("label.chip", { hasText: "Sana" }).click();
  await page.getByRole("button", { name: /^Pay ₹/ }).click();
  await page.getByRole("button", { name: "Pay (test)" }).click();
  await expect(page).toHaveURL(/\/app\/orders$/);
  await page.getByRole("button", { name: "Request a refund" }).click();
  const reason = `Timing does not work for us ${Math.random().toString(36).slice(2, 8)}`;
  await page.getByLabel("Reason").fill(reason);
  await page.getByRole("button", { name: "Send refund request" }).click();
  // The form closes once a refund is open; the order shows the policy decision.
  await expect(page.getByText(/Full refund: requested \d+ hours before the first class/)).toBeVisible();
  await expect(page.getByText(/Refund: requested/)).toBeVisible();
  // Ops reviews (policy not yet approved, so nothing is auto-decided)
  const opsPhone = randomPhone();
  const ops = await (await browser.newContext()).newPage();
  await login(ops, opsPhone);
  await ownerQuery("UPDATE accounts SET role = 'ops' WHERE phone_e164 = $1", ["+91" + opsPhone]);
  await ops.goto("/app/ops");
  await ops.locator("li", { hasText: reason }).getByRole("button", { name: "Approve and pay" }).click();
  await expect(ops.getByText(reason)).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(/Refund: paid/)).toBeVisible();
  const j = await ownerQuery<{ n: string }>("SELECT count(*) AS n FROM ledger_journals WHERE kind = 'refund_paid'");
  expect(Number(j[0].n)).toBeGreaterThan(0);
  const bal = await ownerQuery<{ s: string }>("SELECT coalesce(sum(amount_paise),0) AS s FROM ledger_postings");
  expect(Number(bal[0].s)).toBe(0);
});

test("safety: one-tap report reaches the Safeguarding queue, not other parents", async ({ page, browser }) => {
  await login(page);
  await page.getByRole("button", { name: "Report a concern" }).click();
  await page.getByLabel("Someone shared contact details").check();
  await page.getByLabel("What happened?").fill("An unknown number was posted in chat (test)");
  await page.getByRole("button", { name: "Send report" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Report received" })).toBeVisible();
  const sgPhone = randomPhone();
  const sg = await (await browser.newContext()).newPage();
  await login(sg, sgPhone);
  await sg.goto("/app/safeguarding");
  await expect(sg.getByRole("heading", { name: "This line goes nowhere." })).toBeVisible(); // a parent cannot open the queue
  await ownerQuery("UPDATE accounts SET role = 'safeguarding' WHERE phone_e164 = $1", ["+91" + sgPhone]);
  await sg.goto("/app/safeguarding");
  await expect(sg.getByText("An unknown number was posted in chat (test)").first()).toBeVisible();
});

test("isolation: one family cannot see another family's learner", async ({ page, browser }) => {
  await login(page);
  const id = await addLearner(page, "Zoya");
  const other = await (await browser.newContext()).newPage();
  await login(other);
  await other.goto(`/app/learners/${id}`);
  await expect(other.getByRole("heading", { name: "This line goes nowhere." })).toBeVisible();
  await expect(other.getByText("Zoya")).toHaveCount(0);
  const me = await (await other.request.get("/api/app/me")).json();
  expect(me.learners).toEqual([]);
});

test("data rights: export includes the learner; deletion hides them", async ({ page }) => {
  await login(page);
  await addLearner(page, "Tara");
  const exp = await (await page.request.get("/api/app/export")).json();
  expect(exp.learners.map((l: { first_name: string }) => l.first_name)).toContain("Tara");
  expect(exp.consentHistory.length).toBeGreaterThanOrEqual(3);
  await page.goto("/app/consent");
  await page.getByRole("button", { name: "Delete this learner's data" }).click();
  await page.getByLabel("Type the learner's first name to confirm").fill("Tara");
  await page.getByRole("button", { name: "Delete this learner's data" }).click();
  await expect(page.getByText("Deletion requested")).toBeVisible();
  await page.goto("/app");
  await expect(page.getByText("Tara")).toHaveCount(0);
});

test("language: switching to Telugu changes the app and html lang", async ({ page }) => {
  await login(page);
  await page.getByRole("combobox", { name: "Language" }).selectOption("te");
  await expect(page.getByRole("link", { name: "అనుమతుల కేంద్రం" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "te-IN");
  await page.getByRole("combobox", { name: "భాష" }).selectOption("en");
  await expect(page.getByRole("link", { name: "Consent centre" })).toBeVisible();
});

test("courses: filters and empty state", async ({ page }) => {
  await page.goto("/courses?world=finlit");
  await expect(page.getByRole("heading", { name: "Money Basics · Level 1" })).toBeVisible();
  await expect(page.getByText("No investing tips")).toBeVisible();
  await page.goto("/courses?world=ai");
  await expect(page.getByText("No courses match these filters yet.")).toBeVisible();
});

test("app pages require login", async ({ page }) => {
  await page.goto("/app/consent");
  await expect(page).toHaveURL(/\/login\/learner\?next=%2Fapp%2Fconsent/);
});

test("app pages never scroll sideways", async ({ page }) => {
  await login(page);
  const id = await addLearner(page, "Ira");
  for (const p of ["/app", `/app/learners/${id}`, `/app/learners/${id}/space`, "/app/consent", "/app/orders", "/courses", "/learn/build-session"]) {
    await page.goto(p);
    await page.waitForLoadState("networkidle");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});

test("header shows Family home once signed in", async ({ page }) => {
  await login(page);
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: "Family home" })).toBeVisible();
});
