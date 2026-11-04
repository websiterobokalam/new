import { test, expect } from "@playwright/test";
import { loginByEmail, addLearner, ownerQuery, staffPage, newId } from "../helpers";

const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

test("events: ops draft, check and publish; parents register children; places, cancelling and notices work", async ({ page, browser }) => {
  test.setTimeout(90_000);
  const ops = await staffPage(browser, "ops");
  const title = `Code Week Taster ${newId().slice(0, 5)}`;

  // In-person children's events must name a responsible adult.
  const bad = await ops.request.post("/api/ops/events", { data: { title, kind: "code_week", audience: "learners", summary: "Build your first game in Scratch.", startsAt: inDays(5), durationMin: 90, mode: "in_person", venue: "Green Valley School", capacity: 1, ageMin: 8, ageMax: 12 } });
  expect(bad.status()).toBe(422);
  expect((await bad.json()).fields.responsibleAdult).toMatch(/responsible adult/);

  const created = await ops.request.post("/api/ops/events", { data: { title, kind: "code_week", audience: "learners", summary: "Build your first game in Scratch.", startsAt: inDays(5), durationMin: 90, mode: "online", capacity: 1, ageMin: 10, ageMax: 14, city: "Hyderabad" } });
  expect(created.status(), await created.text()).toBe(200);
  const { id, slug } = await created.json();
  expect((await page.request.get(`/events/${slug}`)).status()).toBe(404); // drafts aren't public
  expect((await ops.request.post(`/api/ops/events/${id}`, { data: { action: "publish" } })).status()).toBe(200);

  // Public listing and page, with Event structured data.
  await page.goto("/events");
  await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();
  const html = await (await page.request.get(`/events/${slug}`)).text();
  expect(html).toContain('"@type":"Event"');
  expect(html).toContain('"price":0');

  // A parent registers a child in the age group; a child outside it can't be picked.
  await loginByEmail(page, undefined, { landing: /\/app$/ });
  await addLearner(page, "Kavi", "9-11");
  await addLearner(page, "Tara", "6-8");
  await page.goto(`/events/${slug}`);
  await page.getByRole("link", { name: "Register your child" }).click();
  await expect(page.getByText("not in this event's age group")).toBeVisible();
  await page.getByLabel(/Kavi/).check();
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("You're registered. We've emailed the details.")).toBeVisible();
  await expect(page.getByText("Kavi is registered")).toBeVisible();
  const [acct] = await ownerQuery<{ account_id: string }>("SELECT r.account_id FROM event_registrations r WHERE r.event_id = $1 AND r.status = 'registered'", [id]);
  expect((await ownerQuery("SELECT id FROM email_outbox WHERE account_id = $1 AND template = 'event_registered'", [acct.account_id])).length).toBe(1);

  // The event is now full for everyone else.
  const other = await (await browser.newContext()).newPage();
  await loginByEmail(other, undefined, { landing: /\/app$/ });
  const kid = await addLearner(other, "Isha", "9-11");
  const full = await other.request.post(`/api/events/${slug}/register`, { data: { learnerIds: [kid] } });
  expect(full.status()).toBe(409);
  expect((await full.json()).error).toMatch(/Only 0 places left/);
  await other.goto(`/events/${slug}`);
  await expect(other.getByText("This event is full.")).toBeVisible();

  // It's in the family's calendar feed.
  await page.goto("/app");
  await page.getByText("Copy the link, or reset it").click();
  const feed = (await page.locator("p.font-mono").filter({ hasText: "/api/calendar/" }).textContent())!.trim();
  expect(await (await page.request.get(new URL(feed).pathname)).text()).toContain(`Kavi: ${title}`);

  // Cancelling a place frees it.
  await page.goto(`/app/events/${slug}`);
  await page.getByRole("button", { name: "Cancel Kavi's place" }).click();
  await expect(page.getByText("Cancelled for Kavi.")).toBeVisible();
  expect((await other.request.post(`/api/events/${slug}/register`, { data: { learnerIds: [kid] } })).status()).toBe(200);

  // Ops see who's coming (first name and age band only), then cancel; everyone registered is told.
  const csv = await (await ops.request.get(`/api/ops/events/${id}/csv`)).text();
  expect(csv.split("\n")[0]).toBe("name,age_band,contact_email,registered_at");
  expect(csv).toContain("Isha,9-11,");
  const cx = await ops.request.post(`/api/ops/events/${id}`, { data: { action: "cancel", reason: "The trainer is unwell" } });
  expect((await cx.json()).notified).toBe(1);
  await other.goto(`/events/${slug}`);
  await expect(other.getByText("This event is cancelled: The trainer is unwell")).toBeVisible();
});

test("adult events: adults register themselves", async ({ page, browser }) => {
  const ops = await staffPage(browser, "ops");
  const r = await ops.request.post("/api/ops/events", { data: { title: `Teacher AI Workshop ${newId().slice(0, 5)}`, kind: "teacher_training", audience: "adults", summary: "Hands-on AI lessons for your classroom.", startsAt: inDays(9), durationMin: 120, mode: "in_person", venue: "T-Hub, Hyderabad", capacity: 20 } });
  const { id, slug } = await r.json();
  await ops.request.post(`/api/ops/events/${id}`, { data: { action: "publish" } });
  await loginByEmail(page, undefined, { landing: /\/app$/ });
  await page.goto(`/app/events/${slug}`);
  await page.getByRole("button", { name: "Register me" }).click();
  await expect(page.getByText("You're registered. We've emailed the details.")).toBeVisible();
  const ics = await page.request.get(`/api/events/${slug}/calendar`);
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  expect(await ics.text()).toContain("LOCATION:T-Hub\\, Hyderabad");
});
