import { test, expect } from "@playwright/test";

test("home: three doors, each with its action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick your door");
  for (const cta of ["Book a Free Build Session", "Book Turnkey Demo", "Become a Fellow"]) {
    await expect(page.getByRole("link", { name: cta }).first()).toBeVisible();
  }
});

test("home: content is in the server HTML (crawlable without JS)", async ({ request }) => {
  const html = await (await request.get("/")).text();
  for (const s of ["Pick your door.", "Teach what you love.", "Straight answers.", "Safe by design", "FAQPage"]) expect(html).toContain(s);
});

test("unapproved claims never reach the HTML", async ({ request }) => {
  for (const path of ["/", "/21c-lab", "/fellows"]) {
    const html = await (await request.get(path)).text();
    expect(html).not.toMatch(/20-day rollout|72-hour|12-year roadmap|SOC ?2|India's No/);
  }
});

test("door click navigates to the door page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Become a Fellow" }).first().click();
  await expect(page).toHaveURL(/\/fellows$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Teach what you love");
});

test("Try the Bot: a correct program reaches the goal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#try-the-bot");
  const add = (n: string) => page.getByRole("button", { name: `+ ${n}`, exact: true }).click();
  await add("Forward ×2"); await add("Forward"); await add("Turn left"); await add("Forward ×2"); await add("Forward");
  await expect(page.locator("pre code")).toContainText("robot.turn_left()");
  await page.getByRole("button", { name: "▶ Run" }).click();
  await expect(page.getByRole("status").filter({ hasText: "You did it" })).toBeVisible();
});

test("learner: Free Build Session request is validated, then accepted", async ({ page }) => {
  await page.goto("/learn#book");
  await page.getByRole("button", { name: "Request my Free Build Session" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please check" })).toBeVisible();
  await page.getByLabel("Parent's name").fill("Asha Rao");
  await page.getByLabel("Parent's mobile").fill("9876543210");
  await page.getByText("You may contact me on this number").click();
  await page.getByRole("button", { name: "Request my Free Build Session" }).click();
  await expect(page.getByText("Request received")).toBeVisible();
});

test("school: demo stepper submits", async ({ page }) => {
  await page.goto("/21c-lab#demo");
  const form = page.locator("#demo form");
  await form.getByRole("button", { name: "Next" }).click();
  await form.getByLabel("School or college name").fill("Model High School");
  await form.getByLabel("City").fill("Warangal");
  await form.getByRole("button", { name: "Next" }).click();
  await form.getByLabel("Number of students").fill("800");
  await form.getByRole("button", { name: "Next" }).click();
  await form.getByLabel("Your name").fill("K. Lakshmi");
  await form.getByLabel("Mobile", { exact: true }).fill("9876543210");
  await form.getByText("You may contact me to arrange a demo").click();
  await form.getByRole("button", { name: "Book Turnkey Demo" }).click();
  await expect(page.getByText("Demo request received")).toBeVisible();
});

test("lab planner returns a plan", async ({ page }) => {
  await page.goto("/21c-lab/planner");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "See my plan" }).click();
  await expect(page.getByRole("heading", { name: /for Classes 3 to 8, CBSE/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download as PDF" })).toBeVisible();
});

test("fellow waitlist requires 18+ and accepts a valid application", async ({ page }) => {
  await page.goto("/fellows/apply");
  await page.getByLabel("Full name").fill("Ravi Teja");
  await page.getByLabel("Mobile", { exact: true }).fill("9876543210");
  await page.getByLabel(/^Email/).fill("ravi@college.ac.in");
  await page.getByRole("textbox", { name: /^College/ }).fill("Any Engineering College");
  await page.getByLabel("Course or branch").fill("B.Tech ECE");
  await page.getByLabel("City").fill("Hyderabad");
  await page.getByText("IoT", { exact: true }).click();
  await page.getByText("You may contact me about the Kalam Fellows pilot").click();
  await page.getByRole("button", { name: "Join the Fellows waitlist" }).click();
  await expect(page.getByText("Kalam Fellows must be 18 or older")).toBeVisible();
  await page.getByText("I am 18 or older.").click();
  await page.getByRole("button", { name: "Join the Fellows waitlist" }).click();
  await expect(page.getByText("You're on the Fellows waitlist")).toBeVisible();
});

test("login: OTP is honest that accounts are not live yet", async ({ page }) => {
  await page.goto("/login/learner");
  await page.getByLabel(/mobile number/).fill("9876543210");
  await page.getByRole("button", { name: "Send OTP" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Accounts open in Phase 2" })).toBeVisible();
});

test("legacy URL 301s to the new page", async ({ request }) => {
  const r = await request.get("/forschools.html", { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()["location"]).toContain("/21c-lab");
});

test("no horizontal scroll on key pages", async ({ page }) => {
  for (const p of ["/", "/learn", "/21c-lab", "/fellows", "/login"]) {
    await page.goto(p);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(over, p).toBeLessThanOrEqual(0);
  }
});
