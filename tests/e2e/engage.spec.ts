import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ownerQuery, randomEmail, staffPage } from "../helpers";

test("contact form: validated, stored, acknowledged, routed to the right inbox, closed by ops", async ({ page, browser }) => {
  const email = randomEmail("contact");
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Please check the highlighted fields")).toBeVisible();
  await page.getByLabel("What's it about?").selectOption("school");
  await page.getByLabel("Your name").fill("Priya Principal");
  await page.getByLabel("Your email").fill(email);
  await page.getByLabel("School or organisation (optional)").fill("Green Valley School");
  await page.getByLabel("Your message").fill("We'd like a 21C lab for classes 3 to 8 next term.");
  await page.getByText("I am 18 or older.").first().click();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thanks, we've got your message")).toBeVisible();
  const [e] = await ownerQuery<{ id: string; ref: string; topic: string }>("SELECT id, ref, topic FROM enquiries WHERE email = $1", [email]);
  expect(e.topic).toBe("school");
  const mails = await ownerQuery<{ template: string; to_email: string }>("SELECT template, to_email FROM email_outbox WHERE dedupe_key IN ($1, $2)", [`enquiry-ack:${e.ref}`, `enquiry-staff:${e.ref}`]);
  expect(mails.map((m) => m.template).sort()).toEqual(["enquiry_ack", "staff_enquiry"]);

  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/enquiries");
  await expect(ops.getByText("We'd like a 21C lab")).toBeVisible();
  await ops.getByRole("button", { name: `Mark ${e.ref} answered` }).click();
  await expect(ops.getByText("Marked answered")).toBeVisible();
  expect((await ownerQuery<{ status: string }>("SELECT status FROM enquiries WHERE id = $1", [e.id]))[0].status).toBe("answered");
});

test("contact form: bots that fill the hidden field are ignored", async ({ request }) => {
  const r = await request.post("/api/enquiries", { data: { website: "spam.example", topic: "other", name: "Bot", email: randomEmail("bot"), message: "Buy cheap things now!!!", adult: true } });
  expect((await r.json()).ref).toBe("RK-OK");
});

test("newsletter: adults only, double opt-in, one-click unsubscribe, ops export", async ({ page, browser, request }) => {
  const email = randomEmail("news");
  await page.goto("/blog");
  await page.getByLabel("Email for the newsletter").fill(email);
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText(/confirm you are 18 or older/)).toBeVisible();
  await page.getByText("I am 18 or older.").click();
  await page.getByRole("button", { name: "Subscribe" }).click();
  await expect(page.getByText("Nearly there: check your inbox")).toBeVisible();

  const [s] = await ownerQuery<{ status: string; token: string }>("SELECT status, token FROM newsletter_subscribers WHERE email = $1", [email]);
  expect(s.status).toBe("pending"); // not on the list until they confirm
  const [m] = await ownerQuery<{ payload: { link: string } }>("SELECT payload FROM email_outbox WHERE to_email = $1 AND template = 'newsletter_confirm'", [email]);
  await page.goto(new URL(m.payload.link).pathname + new URL(m.payload.link).search);
  await expect(page.getByRole("heading", { name: "You're subscribed." })).toBeVisible();

  // Signing up again doesn't reveal anything or send another mail the same day.
  expect((await request.post("/api/newsletter", { data: { email, adult: true } })).status()).toBe(200);
  expect((await ownerQuery("SELECT id FROM email_outbox WHERE to_email = $1 AND template = 'newsletter_confirm'", [email])).length).toBe(1);

  const ops = await staffPage(browser, "ops");
  const csv = await (await ops.request.get("/api/ops/newsletter")).text();
  expect(csv.split("\n")[0]).toBe("email,confirmed_at,unsubscribe_url");
  expect(csv).toContain(email);
  expect((await page.request.get("/api/ops/newsletter")).status()).toBe(401);

  // Mail apps' one-click unsubscribe (POST), and the link (GET).
  expect((await request.post(`/api/newsletter/unsubscribe?t=${s.token}`)).status()).toBe(200);
  expect((await ownerQuery<{ status: string }>("SELECT status FROM newsletter_subscribers WHERE email = $1", [email]))[0].status).toBe("unsubscribed");
  await page.goto(`/api/newsletter/unsubscribe?t=${s.token}`);
  await expect(page.getByRole("heading", { name: "You're unsubscribed." })).toBeVisible();
  await page.goto("/api/newsletter/confirm?t=nonsense");
  await expect(page.getByRole("heading", { name: "That link didn't work." })).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`a11y ${theme} contact and newsletter forms`, async ({ page }) => {
    if (theme === "dark") await page.addInitScript(() => { try { localStorage.setItem("rk-theme", "dark"); } catch {} });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of ["/contact", "/newsletter"]) {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    }
  });
}
