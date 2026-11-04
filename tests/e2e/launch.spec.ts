import { test, expect } from "@playwright/test";
import { login, addLearner, staffPage, ownerQuery } from "../helpers";

const KEY = "test-cron-secret";

test("health check: public answer is minimal; with the key it adds launch status", async ({ request }) => {
  const pub = await request.get("/api/health");
  expect(pub.status()).toBe(200);
  const p = await pub.json();
  expect(p).toMatchObject({ ok: true, db: true });
  expect(p.launch).toBeUndefined();
  const full = await (await request.get(`/api/health?key=${KEY}`)).json();
  expect(full.launch.ready).toBe(false); // the test server uses test providers
  expect(full.launch.blockers).toContain("test_providers_off");
  expect(full.email).toHaveProperty("queued");
});

test("housekeeping: needs the key, cancels day-old unpaid holds and fails their orders", async ({ page, request }) => {
  expect((await request.get("/api/cron/housekeeping")).status()).toBe(401);
  await login(page);
  const learnerId = await addLearner(page, "Ira", "9-11");
  const batch = (await ownerQuery<{ id: string }>(
    `SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id
     WHERE c.fee_paise > 0 AND c.published AND b.starts_at > now() AND c.age_min <= 9 AND COALESCE(c.age_max, 99) >= 11 AND c.format <> 'one_to_one' AND (c.fee_approved OR c.sample) ORDER BY b.starts_at LIMIT 1`))[0];
  const r = await page.request.post("/api/app/bookings", { data: { learnerId, batchId: batch.id } });
  expect(r.status(), await r.text()).toBe(200);
  const [bk] = await ownerQuery<{ id: string }>("SELECT id FROM bookings WHERE learner_id = $1 AND status = 'pending_payment'", [learnerId]);
  await ownerQuery("UPDATE bookings SET created_at = UTC_TIMESTAMP(3) - INTERVAL 25 HOUR WHERE id = $1", [bk.id]);
  const res = await (await request.get(`/api/cron/housekeeping?key=${KEY}`)).json();
  expect(res.ok).toBe(true);
  expect(res.expiredHolds).toBeGreaterThanOrEqual(1);
  const [after] = await ownerQuery<{ status: string; ostatus: string }>("SELECT b.status, o.status AS ostatus FROM bookings b JOIN orders o ON o.booking_id = b.id WHERE b.id = $1", [bk.id]);
  expect(after).toEqual({ status: "cancelled", ostatus: "failed" });
});

test("ops see Launch readiness with each blocker and its fix; parents can't", async ({ browser, page }) => {
  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/launch");
  await expect(ops.getByRole("heading", { name: "Launch readiness", level: 1 })).toBeVisible();
  await expect(ops.getByRole("status")).toContainText("block launch");
  await expect(ops.getByText("Test sign-in codes and mock payments are off")).toBeVisible();
  await expect(ops.getByText(/Fix: Remove ALLOW_TEST_PROVIDERS/)).toBeVisible();
  await login(page);
  await page.goto("/app/ops/launch");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This line goes nowhere.");
  await expect(page.getByText("Test sign-in codes and mock payments are off")).toHaveCount(0);
});
