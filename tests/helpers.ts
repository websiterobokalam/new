import { expect, type Page } from "@playwright/test";
import pg from "pg";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync("scripts/test.env", "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split(/=(.*)/s).slice(0, 2)));

/** Owner connection for test assertions and setup (bypasses RLS on purpose). */
export async function ownerQuery<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const c = new pg.Client({ connectionString: env.DATABASE_OWNER_URL });
  await c.connect();
  try { return (await c.query(sql, params)).rows as T[]; } finally { await c.end(); }
}

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
export async function applyAsFellow(page: Page, opts: { city?: string; name?: string; worlds?: string[] } = {}) {
  const phone = randomPhone();
  await page.goto("/fellows/apply");
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
  await ownerQuery("UPDATE vetting_steps SET status = 'passed' WHERE fellow_id = $1 AND step = ANY($2)", [id, steps]);
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
