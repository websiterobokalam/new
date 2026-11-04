import { test, expect } from "@playwright/test";
import { login, addLearner, ownerQuery, newId } from "../helpers";

test("families add a class to their calendar, or subscribe to a private feed they can reset", async ({ page, request }) => {
  const courseId = newId(), batchId = newId(), tag = newId().slice(0, 6);
  await ownerQuery("INSERT INTO courses (id, slug, title, world, age_min, age_max, outcome, batch_size_max, sessions, fee_paise, fee_approved, published, kind) VALUES ($1,$2,$3,'space',6,16,'Build',8,1,0,TRUE,TRUE,'course')", [courseId, `cal-${tag}`, `Calendar Class ${tag}`]);
  await ownerQuery("INSERT INTO batches (id, course_id, starts_at, duration_min, capacity, language, mode) VALUES ($1,$2, UTC_TIMESTAMP(3) + INTERVAL 2 DAY, 45, 8, 'en', 'online')", [batchId, courseId]);
  await login(page);
  const learnerId = await addLearner(page, "Meera", "9-11");
  expect((await page.request.post("/api/app/bookings", { data: { learnerId, batchId } })).status()).toBe(200);
  const [bk] = await ownerQuery<{ id: string; guardian_account_id: string }>("SELECT id, guardian_account_id FROM bookings WHERE learner_id = $1", [learnerId]);

  // One class
  const one = await page.request.get(`/api/app/bookings/${bk.id}/calendar`);
  expect(one.headers()["content-type"]).toContain("text/calendar");
  const body = await one.text();
  expect(body).toContain(`SUMMARY:Meera: Calendar Class ${tag}`);
  expect(body).toContain("LOCATION:Online\\, on Robokalam");
  // Not someone else's class
  expect((await request.get(`/api/app/bookings/${bk.id}/calendar`)).status()).toBe(401);

  // The family home offers both
  await page.goto("/app");
  await expect(page.getByRole("link", { name: new RegExp(`Add to calendar.*Calendar Class ${tag}`) })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Put every class in your calendar" })).toBeVisible();
  await page.getByText("Copy the link, or reset it").click();
  const feed = (await page.locator("p.font-mono").filter({ hasText: "/api/calendar/" }).textContent())!.trim();
  const path = new URL(feed).pathname;

  // Calendar apps fetch it with no login
  const sub = await request.get(path);
  expect(sub.status()).toBe(200);
  expect(await sub.text()).toContain("X-WR-CALNAME:Robokalam classes");
  expect((await request.get(path.replace(/[A-Za-z0-9_-]{4}\.ics$/, "AAAA.ics"))).status()).toBe(404);

  // Reset: the old link stops working
  await page.getByRole("button", { name: "Reset my calendar link" }).click();
  await expect(page.getByText("Reset. Subscribe again with the new link.")).toBeVisible();
  expect((await request.get(path)).status()).toBe(404);
});
