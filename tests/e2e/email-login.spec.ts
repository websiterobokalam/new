import { test, expect } from "@playwright/test";
import { loginByEmail, loginSchoolByEmail, randomEmail, ownerQuery, staffPage, makeSchool, loginSchool } from "../helpers";

test("learner door: email is the default; a new parent signs up with an email code", async ({ page }) => {
  const email = await loginByEmail(page, randomEmail("parent"), { landing: /\/app$/ });
  const [a] = await ownerQuery<{ role: string; phone_e164: string | null; email_verified_at: Date | null }>("SELECT role, phone_e164, email_verified_at FROM accounts WHERE login_email = $1", [email]);
  expect(a.role).toBe("parent");
  expect(a.phone_e164).toBeNull(); // no mobile needed
  expect(a.email_verified_at).not.toBeNull(); // the code proved the address
  // Signing in again reuses the same account.
  await page.context().clearCookies();
  await loginByEmail(page, email.toUpperCase(), { landing: /\/app$/ });
  expect(await ownerQuery("SELECT id FROM accounts WHERE login_email = $1", [email])).toHaveLength(1);
});

test("email codes: a wrong code is refused, the address is validated, codes are never stored in plain text", async ({ page, request }) => {
  const bad = await request.post("/api/auth/email/send", { data: { email: "not-an-email" } });
  expect(bad.status()).toBe(422);
  expect((await bad.json()).fields.email).toMatch(/valid email/);
  const email = randomEmail("wrong");
  await page.goto("/login/learner");
  await page.getByLabel("Parent's email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByText(/We sent a 6-digit code to/)).toBeVisible();
  await page.getByLabel("6-digit code").fill("000000");
  await page.getByText("I am 18 or older, and I am the parent").click();
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("That code is not right.")).toBeVisible();
  const [ch] = await ownerQuery<{ code_hash: string; attempts: number }>("SELECT code_hash, attempts FROM email_otp_challenges WHERE email = $1", [email]);
  expect(ch.code_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(ch.attempts).toBe(1);
  expect(await ownerQuery("SELECT id FROM email_outbox WHERE to_email = $1", [email])).toHaveLength(0); // sent directly, not queued with the code
});

test("school door by email: unknown emails are refused and no account is created", async ({ page }) => {
  const email = randomEmail("stranger");
  await page.goto("/login/school");
  await page.getByLabel("Staff email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("This email isn't on a school's staff list")).toBeVisible();
  expect(await ownerQuery("SELECT id FROM accounts WHERE login_email = $1", [email])).toHaveLength(0);
});

test("a school admin adds a trainer by email; the trainer signs in with an email code", async ({ page, browser }) => {
  test.setTimeout(60_000);
  const s = await makeSchool();
  await loginSchool(page, s.adminPhone);
  const email = randomEmail("trainer");
  await page.goto("/app/school/staff");
  await page.getByLabel("Full name").fill("Meena Trainer");
  await page.locator("input[name=email]").fill(email);
  await page.getByRole("button", { name: "Add to staff" }).click();
  await expect(page.getByText("Added. They can sign in now.")).toBeVisible();
  const t = await (await browser.newContext()).newPage();
  await loginSchoolByEmail(t, email, /\/app\/trainer$/);
});

test("educator door by email: apply as a Kalamite without a mobile number", async ({ page }) => {
  const email = randomEmail("kalamite");
  await page.goto("/kalamites/apply");
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByLabel("Full name (as on your ID)")).toBeVisible();
  await page.context().clearCookies();
  await loginByEmail(page, email, { door: "educator" });
  await expect(page).toHaveURL(/\/app/);
});

test("ops create logins: a school admin and a safeguarding lead; switching one off signs them out", async ({ browser, page }) => {
  test.setTimeout(90_000);
  const ops = await staffPage(browser, "ops");
  const s = await makeSchool();

  // 1. School admin for an existing school
  const adminEmail = randomEmail("newadmin");
  await ops.goto("/app/ops/accounts");
  await ops.getByLabel("Full name").fill("Ravi School Admin");
  await ops.locator("input[name=email]").fill(adminEmail);
  await ops.getByRole("combobox", { name: "Role", exact: true }).selectOption("school_admin");
  await ops.getByLabel("School (for school admins and trainers)").selectOption(s.schoolId);
  await ops.getByRole("button", { name: "Create login" }).click();
  await expect(ops.getByText("Created. We emailed them how to sign in.")).toBeVisible();
  await expect.poll(async () => (await ownerQuery("SELECT id FROM email_outbox WHERE to_email = $1 AND template = 'login_created'", [adminEmail])).length).toBe(1);
  await loginSchoolByEmail(page, adminEmail, /\/app\/school$/);

  // 2. A school role without a school is refused
  await ops.goto("/app/ops/accounts");
  await ops.getByLabel("Full name").fill("No School");
  await ops.locator("input[name=email]").fill(randomEmail("noschool"));
  await ops.getByRole("combobox", { name: "Role", exact: true }).selectOption("trainer");
  await ops.getByRole("button", { name: "Create login" }).click();
  await expect(ops.getByText("Pick the school this person works at")).toBeVisible();

  // 3. Safeguarding lead: signs in at any door and lands on their own role
  const sgEmail = randomEmail("safeguard");
  await ops.goto("/app/ops/accounts");
  await ops.getByLabel("Full name").fill("Lakshmi Safeguarding");
  await ops.locator("input[name=email]").fill(sgEmail);
  await ops.getByRole("combobox", { name: "Role", exact: true }).selectOption("safeguarding");
  await ops.getByRole("button", { name: "Create login" }).click();
  await expect(ops.getByText("Created. We emailed them how to sign in.")).toBeVisible();
  const sg = await (await browser.newContext()).newPage();
  await loginByEmail(sg, sgEmail, { landing: /\/app/ });
  expect((await ownerQuery<{ role: string }>("SELECT role FROM accounts WHERE login_email = $1", [sgEmail]))[0].role).toBe("safeguarding");

  // 4. Switch the safeguarding login off: signed out at once, and can't sign back in
  await ops.goto(`/app/ops/accounts?q=${encodeURIComponent(sgEmail.split("@")[0])}`);
  const row = ops.locator("li", { hasText: "Lakshmi Safeguarding" });
  await row.getByLabel("Reason").fill("Left the organisation");
  await row.getByRole("button", { name: "Switch off Lakshmi Safeguarding" }).click();
  await expect(row.getByText("Saved")).toBeVisible();
  await ops.reload();
  await expect(ops.locator("li", { hasText: "Lakshmi Safeguarding" }).getByText("Switched off")).toBeVisible();
  await sg.goto("/app");
  await expect(sg).toHaveURL(/\/login/);
  await sg.context().clearCookies();
  await sg.goto("/login/learner");
  await sg.getByLabel("Parent's email").fill(sgEmail);
  await sg.getByRole("button", { name: "Email me a code" }).click();
  await sg.getByLabel("6-digit code").fill("123456");
  await sg.getByText("I am 18 or older, and I am the parent").click();
  await sg.getByRole("button", { name: "Verify and continue" }).click();
  await expect(sg.getByText("This login has been switched off.")).toBeVisible();

  // 5. Only ops can create logins
  const r = await page.request.post("/api/ops/accounts", { data: { name: "Sneaky", email: randomEmail("x"), role: "ops" } });
  expect(r.status()).toBe(403);
});
