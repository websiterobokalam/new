import { test, expect, type Page } from "@playwright/test";
import { applyAsFellow, passSteps, ALL_STEPS, staffPage, ownerQuery, newId, teachingHistory, attendedBooking, accountId } from "../helpers";

/* ---------- Independent tests (mobile and desktop) ---------- */

test("Campus Ambassadors page: the rules are stated up front", async ({ page }) => {
  await page.goto("/campus-ambassadors");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Bring the classmates");
  await expect(page.getByText("Never to school students, children or parents.")).toBeVisible();
  await expect(page.getByText(/No earnings promises/)).toBeVisible();
});

test("a Fellow without a teaching record can draft a course but not submit it", async ({ page }) => {
  const phone = await applyAsFellow(page);
  await passSteps(phone, ALL_STEPS, true);
  await page.goto("/app/fellow/courses");
  await expect(page.getByText("Not yet").first()).toBeVisible();
  const title = `Blink and beep ${newId().slice(0, 5)}`;
  await fillDraft(page, { title, outcome: "Every learner builds a buzzer that beeps a pattern they composed.", syllabus: "Blink | An LED that blinks a pattern\nBeep | A buzzer that plays the pattern" });
  const card = page.locator(`[data-draft="${title}"]`);
  await card.getByRole("button", { name: "Submit for review" }).click();
  await expect(card.getByText(/Not yet: Tier fellow or above/)).toBeVisible();
});

async function fillDraft(page: Page, d: { title: string; world?: string; outcome: string; sessions?: number; syllabus: string; fee?: number }) {
  const form = page.locator("form", { has: page.getByRole("button", { name: "Save draft" }) }).last();
  await form.getByLabel("Course title").fill(d.title);
  if (d.world) await form.getByLabel("World").selectOption(d.world);
  await form.getByLabel("What every learner will have built by the end").fill(d.outcome);
  await form.getByLabel(/Number of weekly sessions/).fill(String(d.sessions ?? 2));
  if (d.fee != null) await form.getByLabel(/Proposed fee/).fill(String(d.fee));
  await form.getByLabel(/Syllabus: one line per session/).fill(d.syllabus);
  await form.getByRole("button", { name: "Save draft" }).click();
  await expect(page.locator(`[data-draft="${d.title}"]`)).toBeVisible();
}

/* ---------- The open marketplace (global state: run once, in order, on desktop) ---------- */

test.describe("open marketplace", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(({}, ti) => test.skip(ti.project.name !== "desktop", "Marketplace state is global; run once"));

  let author: { page: Page; phone: string; id: string; name: string };

  test("gate: closed until targets are agreed and met; a person opens it, with a reason", async ({ browser }) => {
    const ops = await staffPage(browser, "ops");
    await ops.goto("/app/ops/marketplace");
    await expect(ops.locator("[data-gate]")).toHaveAttribute("data-gate", "closed");
    await expect(ops.getByText("No agreed target for gig fill rate yet")).toBeVisible();
    await ops.getByLabel("Why now (recorded)").fill("Trying early");
    await ops.getByRole("button", { name: "Open the marketplace" }).click();
    await expect(ops.getByText(/Not ready: No agreed target/)).toBeVisible();

    // A Fellow with a real teaching record gives the measures data.
    const p = await (await browser.newContext()).newPage();
    const name = `Meera Author${newId().slice(0, 4)}`;
    const phone = await applyAsFellow(p, { name, worlds: ["Robotics", "Financial Literacy"] });
    const id = await passSteps(phone, ALL_STEPS, true);
    await teachingHistory(id, { sessions: 10, observation: 4, reviews: 3, tier: "fellow" });
    await attendedBooking((await ownerQuery<{ id: string }>("SELECT b.id FROM batches b JOIN courses c ON c.id = b.course_id WHERE c.sample LIMIT 1"))[0].id, { paid: 100000 });
    author = { page: p, phone, id, name: (await ownerQuery<{ display_name: string }>("SELECT display_name FROM fellows WHERE account_id = $1", [id]))[0].display_name };

    // Agreed targets (loose for the test database), each recorded with who set it.
    const targets: Record<string, number> = { min_sessions: 1, fill_rate: 1, satisfaction: 1, safety_rate: 1000, refund_rate: 100, complaint_rate: 1000 };
    for (const [metric, value] of Object.entries(targets)) {
      const card = ops.locator(`[data-metric="${metric}"]`);
      await card.getByText("Set the agreed target").click();
      await card.getByLabel(/target \(/).fill(String(value));
      await card.getByRole("button", { name: "Save target" }).click();
      await expect(card.getByText(/Target: at (least|most)/)).toBeVisible();
    }
    await ops.getByLabel("Why now (recorded)").fill("Targets agreed in the ops review");
    await ops.getByRole("button", { name: "Open the marketplace" }).click();
    await expect(ops.locator("[data-gate]")).toHaveAttribute("data-gate", "open");
    expect((await ownerQuery("SELECT action FROM audit_log WHERE action = 'market_opened'")).length).toBeGreaterThan(0);
  });

  test("Fellow's Own Course: checks raise points, a person decides each one, then the course", async ({ browser }) => {
    const p = author.page;
    await p.goto("/app/fellow/courses");
    // Fair work: the checks are announced with a start date 14 days out.
    await expect(p.getByText(/Course draft checks · starts/)).toBeVisible();
    await ownerQuery("UPDATE automated_systems SET notice_at = now() - INTERVAL 15 DAY, effective_at = now() - INTERVAL 1 MINUTE");

    const title = `Pocket Money Planner ${newId().slice(0, 5)}`;
    await p.reload();
    await fillDraft(p, { title, world: "finlit", outcome: "Plan money.", fee: 1500, syllabus: "Budget basics | A weekly budget sheet\nStock tips for kids | Pick shares to buy" });
    const card = p.locator(`[data-draft="${title}"]`);
    await card.getByRole("button", { name: "Submit for review" }).click();
    await expect(card.getByText("With a Robokalam reviewer")).toBeVisible();
    await expect(card.getByText(/money basics only/)).toBeVisible();
    await expect(card.getByText(/a person will look at this/).first()).toBeVisible();

    const ops = await staffPage(browser, "ops");
    await ops.goto("/app/ops/courses");
    const rev = ops.locator(`[data-review="${title}"]`);
    const decide = rev.locator("form").last();
    await decide.getByLabel("Note the Fellow will read").fill("Looks good");
    await decide.getByRole("button", { name: "Record review" }).click();
    await expect(rev.getByText(/Decide the 2 open flags/)).toBeVisible();
    await rev.locator('[data-flag="finlit_investment"]').getByLabel(/Decision on/).selectOption("actioned");
    await rev.locator('[data-flag="finlit_investment"]').getByLabel("Note the Fellow will read").fill("Replace the share-picking session: money basics only.");
    await rev.locator('[data-flag="finlit_investment"]').getByRole("button", { name: "Record decision" }).click();
    await expect(rev.locator('[data-flag="finlit_investment"]').getByText(/^Issue:/)).toBeVisible();
    await rev.locator('[data-flag="ai_outcome"]').getByLabel(/Decision on/).selectOption("actioned");
    await rev.locator('[data-flag="ai_outcome"]').getByLabel("Note the Fellow will read").fill("Say what they will have built.");
    await rev.locator('[data-flag="ai_outcome"]').getByRole("button", { name: "Record decision" }).click();
    await expect(rev.locator('[data-flag="ai_outcome"]').getByText(/^Issue:/)).toBeVisible();
    await rev.getByRole("combobox", { name: /^Decision(?! on)/ }).selectOption("changes");
    await rev.locator("form").last().getByLabel("Note the Fellow will read").fill("Please replace session 2 and sharpen the outcome.");
    await rev.getByRole("button", { name: "Record review" }).click();
    await expect.poll(async () => (await ownerQuery("SELECT status FROM course_drafts WHERE title = $1", [title]))[0].status).toBe("changes");

    // The Fellow sees the notes, edits and resubmits.
    await p.reload();
    await expect(card.getByText("Please replace session 2 and sharpen the outcome.")).toBeVisible();
    await expect(card.getByText(/reviewer: Replace the share-picking session/)).toBeVisible();
    await card.getByText("Edit this draft").click();
    await card.getByLabel("What every learner will have built by the end").fill("Every learner plans a weekly budget and prices a tiny stall with real costs.");
    await card.getByLabel(/Syllabus: one line per session/).fill("Budget basics | A weekly budget sheet\nPrice a lemonade stall | A price list with costs and profit");
    await card.getByRole("button", { name: "Save draft" }).click();
    await expect(card.getByText("Saved")).toBeVisible();
    await card.getByRole("button", { name: "Submit for review" }).click();
    await expect(card.getByText("With a Robokalam reviewer")).toBeVisible();

    await ops.reload();
    await rev.getByRole("combobox", { name: /^Decision(?! on)/ }).selectOption("approve");
    await rev.locator("form").last().getByLabel("Note the Fellow will read").fill("Clear, safe and age-appropriate. Approved.");
    await rev.getByRole("button", { name: "Record review" }).click();
    await expect(rev.getByRole("button", { name: "Publish" })).toBeVisible();
    await rev.getByRole("button", { name: "Publish" }).click();
    await expect.poll(async () => (await ownerQuery("SELECT status FROM course_drafts WHERE title = $1", [title]))[0].status).toBe("published");

    // Public: labelled as a Fellow's Own Course.
    const pub = await (await browser.newContext()).newPage();
    await pub.goto("/courses?world=finlit");
    const li = pub.locator("li", { hasText: title });
    await expect(li.getByText("Fellow's Own Course · reviewed by Robokalam")).toBeVisible();

    // The author schedules a run: weekly sessions on their own calendar, never on the gig board.
    await p.reload();
    const when = new Date(Date.now() + 4 * 86400_000);
    when.setMinutes(0, 0, 0);
    await card.getByLabel("First session").fill(new Date(when.getTime() - when.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
    await card.getByRole("button", { name: "Schedule" }).click();
    await expect.poll(async () => (await ownerQuery("SELECT COUNT(*) AS n FROM gigs WHERE kind = 'own_course' AND title LIKE $1", [`${title}%`]))[0].n).toBe(2);
    const gigs = await ownerQuery<{ id: string; batch_id: string }>("SELECT id, batch_id FROM gigs WHERE kind = 'own_course' AND title LIKE $1 ORDER BY starts_at", [`${title}%`]);

    // A family pays; the first session is delivered; the Fellow earns 70% of that session's share.
    const paid = 150000;
    await attendedBooking(gigs[0].batch_id, { paid, status: "confirmed" });
    await ownerQuery("UPDATE gigs SET starts_at = now() - INTERVAL 5 MINUTE WHERE id = $1", [gigs[0].id]);
    await ownerQuery("UPDATE batches SET starts_at = now() - INTERVAL 5 MINUTE WHERE id = $1", [gigs[0].batch_id]);
    await p.goto(`/app/fellow/gigs/${gigs[0].id}`);
    await p.getByRole("button", { name: "Mark session delivered" }).click();
    await expect(p.getByText("Session recorded.")).toBeVisible();
    const gst = Math.round(paid - paid / 1.18);
    const expected = Math.round(Math.round((paid - gst) / 2) * 0.7);
    const [line] = await ownerQuery<{ kind: string; gross_paise: number }>("SELECT kind, gross_paise FROM earnings_lines WHERE assignment_id = (SELECT id FROM gig_assignments WHERE gig_id = $1)", [gigs[0].id]);
    expect(line).toEqual({ kind: "own_course", gross_paise: expected });
    expect(Number((await ownerQuery<{ s: string }>("SELECT coalesce(sum(amount_paise),0) AS s FROM ledger_postings"))[0].s)).toBe(0);
  });

  test("more cities: opening a city moves its waitlist into checks", async ({ browser }) => {
    const city = `Warangal${newId().slice(0, 4)}`;
    const w = await (await browser.newContext()).newPage();
    const phone = await applyAsFellow(w, { city });
    const id = await accountId(phone);
    expect((await ownerQuery("SELECT status FROM fellows WHERE account_id = $1", [id]))[0].status).toBe("waitlisted");

    const ops = await staffPage(browser, "ops");
    await ops.goto("/app/ops/marketplace");
    await ops.getByLabel("City to open").fill(city);
    await ops.getByLabel("Most live Fellows there").fill("10");
    await ops.getByLabel("Why, and who agreed (recorded)").fill("Partner schools ready there");
    await ops.getByRole("button", { name: "Open this city" }).click();
    await expect(ops.getByText("City opened. Waitlisted applicants there have moved to checks.")).toBeVisible();
    expect((await ownerQuery("SELECT status FROM fellows WHERE account_id = $1", [id]))[0].status).toBe("vetting");
    const pub = await (await browser.newContext()).newPage();
    await pub.goto("/fellows/apply");
    await expect(pub.getByText(new RegExp(`open in .*${city}`, "i"))).toBeVisible();
  });

  test("Campus Ambassadors: approved by a person, counts only, reward only when approved", async ({ browser }) => {
    const ops = await staffPage(browser, "ops");
    const college = `Sample Institute ${newId().slice(0, 5)}`;
    await ops.goto("/app/ops/marketplace");
    await ops.getByLabel("College name").fill(college);
    await ops.getByLabel("College city").fill("Hyderabad");
    await ops.getByRole("button", { name: "Add college" }).click();
    await expect(ops.getByText("College added")).toBeVisible();

    const p = author.page;
    await p.goto("/app/fellow/ambassador");
    await expect(p.getByText("There is no referral reward yet.")).toBeVisible();
    await p.getByLabel("Your college").selectOption({ label: college });
    await p.getByLabel("Why you, and how you'd reach classmates").fill("I run the robotics club and can hold a short talk after labs each month.");
    await p.getByRole("button", { name: "Apply to be an ambassador" }).click();
    await expect(p.getByText("Applied, waiting for a person to review")).toBeVisible();

    await ops.goto("/app/ops/ambassadors");
    const row = ops.locator(`[data-ambassador="${author.name}"]`);
    await row.getByLabel(/Decision for/).selectOption("active");
    await row.getByLabel("Note the Fellow will read").fill("Welcome aboard. Materials are in the app.");
    await row.getByRole("button", { name: "Record decision" }).click();
    await expect.poll(async () => (await ownerQuery("SELECT status FROM ambassadors WHERE fellow_id = $1", [author.id]))[0].status).toBe("active");
    const code = (await ownerQuery<{ code: string }>("SELECT code FROM ambassadors WHERE fellow_id = $1", [author.id]))[0].code;

    // A classmate applies with the link; a reward is approved; they go live.
    await ownerQuery("INSERT INTO rate_card (gig_kind, per_session_paise, minutes, approved) VALUES ('ambassador_referral', 50000, 1, TRUE) ON DUPLICATE KEY UPDATE approved = TRUE, per_session_paise = 50000");
    const c = await (await browser.newContext()).newPage();
    const cphone = await applyAsFellow(c, { ref: code, name: "Classmate Referred" });
    const cid = await passSteps(cphone, ALL_STEPS);
    expect((await ownerQuery("SELECT referred_by FROM fellows WHERE account_id = $1", [cid]))[0].referred_by).toBe(code);
    expect((await ops.request.post(`/api/ops/fellows/${cid}/live`, { data: {} })).ok()).toBe(true);
    const lines = await ownerQuery<{ gross_paise: number }>("SELECT gross_paise FROM earnings_lines WHERE fellow_id = $1 AND kind = 'referral'", [author.id]);
    expect(lines).toEqual([{ gross_paise: 50000 }]);
    await p.reload();
    await expect(p.getByText(`/fellows/apply?ref=${code}`)).toBeVisible();
    await expect(p.getByText("Live", { exact: true })).toBeVisible();
    await expect(p.getByText(/Classmate R/)).toHaveCount(0);
    await ownerQuery("UPDATE rate_card SET approved = FALSE WHERE gig_kind = 'ambassador_referral'");
  });

  test("teaching signals: rules flag, a person decides, the Fellow sees it, tier untouched", async ({ browser }) => {
    const p = await (await browser.newContext()).newPage();
    const phone = await applyAsFellow(p, { name: "Signal Tester" });
    const id = await passSteps(phone, ALL_STEPS, true);
    await teachingHistory(id, { sessions: 2, observation: 1 });
    const ops = await staffPage(browser, "ops");
    await ops.goto("/app/ops/quality");
    await ops.getByRole("button", { name: "Run teaching checks now" }).click();
    await expect(ops.getByText("Checks run")).toBeVisible();
    await ops.reload();
    const flag = ops.locator('[data-flag="safety_score"]', { hasText: "Signal T." });
    await expect(flag).toBeVisible();
    await flag.getByLabel("Note the Fellow will read").fill("We talked it through; a safety refresher is booked.");
    await flag.getByRole("button", { name: "Record decision" }).click();
    await expect.poll(async () => (await ownerQuery("SELECT status FROM quality_flags WHERE fellow_id = $1 AND code = 'safety_score'", [id]))[0].status).toBe("actioned");
    await p.goto("/app/fellow/growth");
    await expect(p.getByText(/discussed: We talked it through/)).toBeVisible();
    expect((await ownerQuery("SELECT tier, status FROM fellows WHERE account_id = $1", [id]))[0]).toEqual({ tier: "apprentice", status: "live" });
  });

  test("closing the gate stops growth at once", async ({ browser }) => {
    const ops = await staffPage(browser, "ops");
    await ops.goto("/app/ops/marketplace");
    await ops.getByLabel("Why (recorded)").fill("Pausing for the exam season");
    await ops.getByRole("button", { name: "Close the marketplace" }).click();
    await expect(ops.locator("[data-gate]")).toHaveAttribute("data-gate", "closed");
    const r = await ops.request.post("/api/ops/market/cities", { data: { action: "open", name: "Karimnagar", maxLive: 5, note: "Should be refused" } });
    expect(r.status()).toBe(409);
    expect((await r.json()).error).toMatch(/isn't switched on/);
  });
});
