import { test, expect } from "@playwright/test";
import { login, loginByEmail, addLearner, ownerQuery, newId, staffPage, applyAsFellow, passSteps, ALL_STEPS } from "../helpers";

/** A free, single-session course with a batch tomorrow (so a booking is confirmed without payment). */
async function oneSessionCourse() {
  const courseId = newId(), batchId = newId(), tag = newId().slice(0, 6);
  await ownerQuery(
    "INSERT INTO courses (id, slug, title, world, age_min, age_max, outcome, batch_size_max, sessions, fee_paise, fee_approved, published, kind) VALUES ($1,$2,$3,'robotics',6,16,'Build a line follower',8,1,0,TRUE,TRUE,'course')",
    [courseId, `cert-${tag}`, `Line Follower Workshop ${tag}`]);
  await ownerQuery("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode) VALUES ($1,$2, UTC_TIMESTAMP(3) + INTERVAL 1 DAY, 60, 8, 'en', 'online')", [batchId, courseId]);
  return { batchId, title: `Line Follower Workshop ${tag}` };
}

test("a learner who completes a course gets a certificate anyone can check; revoking it shows on the check", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const { batchId, title } = await oneSessionCourse();
  await loginByEmail(page, undefined, { landing: /\/app$/ }); // a confirmed email, so the certificate email goes out
  const learnerId = await addLearner(page, "Asha", "9-11");
  const r = await page.request.post("/api/app/bookings", { data: { learnerId, batchId } });
  expect(r.status(), await r.text()).toBe(200);
  const [bk] = await ownerQuery<{ id: string }>("SELECT id FROM bookings WHERE learner_id = $1 AND batch_id = $2", [learnerId, batchId]);

  const ops = await staffPage(browser, "ops");
  const rec = await ops.request.post(`/api/ops/bookings/${bk.id}`, { data: { status: "attended", feedback: "Built and tested a line follower." } });
  expect(rec.status(), await rec.text()).toBe(200);
  const [cert] = await ownerQuery<{ code: string; holder_name: string }>("SELECT code, holder_name FROM certificates WHERE booking_id = $1", [bk.id]);
  expect(cert.holder_name).toBe("Asha"); // first name only
  expect((await ownerQuery("SELECT id FROM email_outbox WHERE template = 'certificate_issued' AND dedupe_key = $1", [`certificate:${cert.code}`])).length).toBe(1);

  // Parent sees it on the learner page and can open the printable certificate.
  await page.goto(`/app/learners/${learnerId}`);
  await expect(page.getByRole("heading", { name: "Certificates" })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(`View and print.*${title}`) }).click();
  await expect(page.getByRole("article", { name: "Certificate" })).toContainText("Asha");
  await expect(page.getByRole("article", { name: "Certificate" })).toContainText(cert.code);

  // Anyone can check it, typed loosely.
  const anon = await (await browser.newContext()).newPage();
  await anon.goto("/validate");
  await anon.getByLabel("Certificate ID").fill(cert.code.toLowerCase().replace(/-/g, " "));
  await anon.getByRole("button", { name: "Check" }).click();
  await expect(anon.getByText("✓ Genuine Robokalam certificate")).toBeVisible();
  await expect(anon.getByRole("status")).toContainText(title);

  // A made-up ID is not found, and points to the older validation site.
  await anon.goto("/validate?code=RK-AAAAA-BBBBB");
  await expect(anon.getByText("We couldn't find that certificate")).toBeVisible();
  await expect(anon.getByRole("link", { name: /validate\.robokalam\.com/ }).first()).toBeVisible();

  // Ops revoke it; the public check says so.
  const rv = await ops.request.post(`/api/ops/certificates/${cert.code}`, { data: { reason: "Issued to the wrong learner" } });
  expect(rv.status()).toBe(200);
  await anon.goto(`/validate?code=${cert.code}`);
  await expect(anon.getByText("This certificate was revoked")).toBeVisible();
  await expect(anon.getByText(/Issued to the wrong learner/)).toBeVisible();

  // Only ops can issue or revoke.
  expect((await page.request.post(`/api/ops/certificates/${cert.code}`, { data: { reason: "Not allowed here" } })).status()).toBe(403);
});

test("erasing a learner removes their name from certificates and stops them validating", async ({ page, browser }) => {
  const { batchId } = await oneSessionCourse();
  await login(page);
  const learnerId = await addLearner(page, "Ravi", "9-11");
  await page.request.post("/api/app/bookings", { data: { learnerId, batchId } });
  const [bk] = await ownerQuery<{ id: string }>("SELECT id FROM bookings WHERE learner_id = $1", [learnerId]);
  const ops = await staffPage(browser, "ops");
  await ops.request.post(`/api/ops/bookings/${bk.id}`, { data: { status: "attended" } });
  const [cert] = await ownerQuery<{ code: string }>("SELECT code FROM certificates WHERE booking_id = $1", [bk.id]);
  const del = await page.request.post("/api/app/data-requests", { data: { kind: "erase", learnerId, confirmName: "Ravi" } });
  expect(del.status()).toBe(200);
  const [after] = await ownerQuery<{ holder_name: string; revoked_at: Date | null }>("SELECT holder_name, revoked_at FROM certificates WHERE code = $1", [cert.code]);
  expect(after.holder_name).toBe("Deleted");
  expect(after.revoked_at).not.toBeNull();
  await page.goto(`/validate?code=${cert.code}`);
  await expect(page.getByText("This certificate was revoked")).toBeVisible();
  await expect(page.getByText("Ravi")).toHaveCount(0);
});

test("a Kalamite gets their certificate when they go live", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const phone = await applyAsFellow(page, { name: "Sneha Reddy Kalamite" });
  const id = await passSteps(phone, ALL_STEPS);
  const ops = await staffPage(browser, "ops");
  const r = await ops.request.post(`/api/ops/fellows/${id}/live`, { data: {} });
  expect(r.status(), await r.text()).toBe(200);
  const [cert] = await ownerQuery<{ code: string; title: string; holder_name: string }>("SELECT code, title, holder_name FROM certificates WHERE fellow_id = $1", [id]);
  expect(cert).toMatchObject({ title: "Certified Kalamite", holder_name: "Sneha Reddy Kalamite" });
  await page.goto("/app/fellow/growth");
  await expect(page.getByRole("heading", { name: "Your Kalamite certificate" })).toBeVisible();
  await expect(page.getByText(cert.code)).toBeVisible();
});
