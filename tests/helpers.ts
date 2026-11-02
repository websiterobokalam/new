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
