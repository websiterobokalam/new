import { test, expect } from "@playwright/test";
import { ownerQuery, randomPhone, loginSchool, makeSchool, startedSession, staffPage, applyAsFellow, passSteps, ALL_STEPS, login, newId, accountId } from "../helpers";

test("school door: only staff added by a school can sign in, and no account is created", async ({ page }) => {
  const phone = randomPhone();
  await page.goto("/login/school");
  await page.getByLabel("Staff mobile number").fill(phone);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.getByLabel("6-digit code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await expect(page.getByText("This number isn't on a school's staff list")).toBeVisible();
  expect(await ownerQuery("SELECT id FROM accounts WHERE phone_e164 = $1", ["+91" + phone])).toHaveLength(0);
});

test("admin: lab health, coverage and contract window on the school home", async ({ page }) => {
  const s = await makeSchool({ slaHours: 48 });
  await loginSchool(page, s.adminPhone, /\/app\/school$/);
  await expect(page.getByRole("heading", { level: 1, name: "Your labs this month" })).toBeVisible();
  await expect(page.getByText("1 of 1 working")).toBeVisible();
  await expect(page.getByText("Your contract: replacement within 48 hours of a ticket.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "School portal" }).getByRole("link", { name: "Timetable" })).toBeVisible();
});

test("admin adds a trainer and a class; the trainer signs in and sees their week", async ({ page, browser }) => {
  test.setTimeout(60_000); // several browsers and sign-ins in one journey
  const s = await makeSchool();
  await loginSchool(page, s.adminPhone);
  const phone = randomPhone();
  await page.goto("/app/school/staff");
  await page.getByLabel("Full name").fill("Kavya Reddy");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: "Add to staff" }).click();
  await expect(page.getByText("Added. They can sign in now.")).toBeVisible();

  await page.goto("/app/school/timetable");
  const today = new Date(Date.now() + 5.5 * 3600_000).getUTCDay() || 7;
  await page.getByLabel("Class name").fill("Grade 7 Kavya");
  await page.getByLabel("Day").selectOption(String(today));
  await page.getByLabel("Start time (24-hour, HH:MM)").fill("23:30");
  await page.getByRole("combobox", { name: /^Trainer/ }).last().selectOption({ label: "Kavya Reddy" });
  await page.getByRole("button", { name: "Add class" }).click();
  await expect(page.getByText("Class added")).toBeVisible();

  const t = await (await browser.newContext()).newPage();
  await loginSchool(t, phone, /\/app\/trainer$/);
  await expect(t.getByText("Grade 7 Kavya", { exact: true })).toBeVisible();
  await expect(t.getByText("Today", { exact: true })).toBeVisible();
});

test("trainer: lesson plan from AADHYA, attendance from the 21cschool roster, only counts kept", async ({ page }) => {
  const s = await makeSchool();
  const sessionId = await startedSession(s.classId);
  await loginSchool(page, s.trainerPhone, /\/app\/trainer$/);
  await page.goto(`/app/trainer/sessions/${sessionId}`);
  await expect(page.getByText("From AADHYA.")).toBeVisible();
  const boxes = page.getByRole("group", { name: /Who is here/ }).getByRole("checkbox");
  const total = await boxes.count();
  expect(total).toBeGreaterThanOrEqual(6);
  await boxes.first().uncheck();
  await page.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByText(/^Recorded: \d+ of \d+ present\..*21cschool receipt ERP-/)).toBeVisible();
  const [row] = await ownerQuery("SELECT status, present, total, erp_receipt FROM class_sessions WHERE id = $1", [sessionId]);
  expect(row).toMatchObject({ status: "held", present: total - 1, total });
  expect(row.erp_receipt).toMatch(/^ERP-/);
  // No student names anywhere in our database for this class.
  const cols = await ownerQuery("SELECT notes, lesson_title FROM class_sessions WHERE id = $1", [sessionId]);
  expect(JSON.stringify(cols)).not.toContain("(sample)");
});

test("trainer: counts only when the class isn't linked to 21cschool", async ({ page }) => {
  const s = await makeSchool({ erp: false });
  const sessionId = await startedSession(s.classId);
  await loginSchool(page, s.trainerPhone);
  await page.goto(`/app/trainer/sessions/${sessionId}`);
  await page.getByLabel("Students present").fill("31");
  await page.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByText("Present can't be more than the class size")).toBeVisible();
  await page.getByLabel("Students present").fill("27");
  await page.getByRole("button", { name: "Save attendance" }).click();
  await expect(page.getByText("Recorded: 27 of 30 present.")).toBeVisible();
  expect((await ownerQuery("SELECT present, total FROM class_sessions WHERE id = $1", [sessionId]))[0]).toMatchObject({ present: 27, total: 30 });
});

test("trainer: project review goes to AADHYA", async ({ page }) => {
  const s = await makeSchool();
  const sessionId = await startedSession(s.classId);
  await loginSchool(page, s.trainerPhone);
  await page.goto(`/app/trainer/sessions/${sessionId}`);
  await page.getByLabel("Verdict for Traffic light").selectOption("revise");
  const form = page.locator("form", { has: page.getByLabel("Verdict for Traffic light") });
  await form.getByRole("button", { name: "Send review" }).click();
  await expect(form.getByText("Tell the student what to change")).toBeVisible();
  await form.getByLabel("A note for the student").fill("The red light stays on. Check the delay.");
  await form.getByRole("button", { name: "Send review" }).click();
  await expect(page.getByText("Sent back to improve")).toBeVisible();
});

test("trainers only see their own school's classes", async ({ page }) => {
  const a = await makeSchool();
  const b = await makeSchool();
  const other = await startedSession(b.classId);
  await loginSchool(page, a.trainerPhone);
  await page.goto(`/app/trainer/sessions/${other}`);
  await expect(page.getByRole("heading", { level: 1, name: "This line goes nowhere." })).toBeVisible();
  const api = await page.request.post(`/api/school/sessions/${other}`, { data: { status: "held", present: 1, total: 2 } });
  expect(api.status()).toBe(404);
  expect((await page.request.post("/api/school/staff", { data: { phone: randomPhone(), name: "Nope", role: "trainer" } })).status()).toBe(403);
});

test("hardware ticket: the clock starts on raise, never resets, and the school confirms the fix", async ({ page, browser }) => {
  test.setTimeout(60_000); // several browsers and sign-ins in one journey
  const s = await makeSchool();
  await loginSchool(page, s.trainerPhone);
  await page.goto("/app/school/tickets");
  await page.getByLabel("What kind of problem").selectOption("robot");
  await page.getByLabel("Which item (optional)").selectOption({ label: `Rover ${s.name.split(" ").pop()} · Lab ${s.name.split(" ").pop()}` });
  await page.getByLabel("What's wrong, in a few words").fill("Left motor does not turn");
  await page.getByRole("button", { name: "Raise ticket" }).click();
  await expect(page.getByText("Ticket raised. The clock has started.")).toBeVisible();
  const [t] = await ownerQuery("SELECT id, ref, raised_at, due_at FROM hardware_tickets WHERE school_id = $1", [s.schoolId]);
  expect(new Date(t.due_at).getTime() - new Date(t.raised_at).getTime()).toBe(72 * 3600_000);
  expect((await ownerQuery("SELECT status FROM lab_assets WHERE id = $1", [s.assetId]))[0].status).toBe("faulty");
  await expect(page.locator(`[data-ticket="${t.ref}"]`).getByText(/^2d 23h left$/)).toBeVisible();

  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/tickets");
  const card = ops.locator("li", { hasText: t.ref });
  await card.getByLabel("New status").selectOption("resolved");
  await card.getByRole("button", { name: "Update" }).click();
  await expect(card.getByText("Say what was fixed or replaced")).toBeVisible();
  await card.getByLabel(/Note for the school/).fill("Motor driver replaced");
  await card.getByRole("button", { name: "Update" }).click();
  await expect.poll(async () => (await ownerQuery("SELECT status FROM hardware_tickets WHERE id = $1", [t.id]))[0].status).toBe("resolved");

  const admin = await (await browser.newContext()).newPage();
  await loginSchool(admin, s.adminPhone);
  await admin.goto("/app/school/tickets");
  const mine = admin.locator(`[data-ticket="${t.ref}"]`);
  await expect(mine.getByText("Marked fixed, please confirm")).toBeVisible();
  await mine.getByLabel("Is it working now?").selectOption("no");
  await mine.getByLabel("If not, what's still wrong").fill("Still stalls after a minute");
  await mine.getByRole("button", { name: "Send" }).click();
  await expect(mine.getByText("Open", { exact: true })).toBeVisible();
  const [again] = await ownerQuery("SELECT status, due_at FROM hardware_tickets WHERE id = $1", [t.id]);
  expect(again.status).toBe("open");
  expect(new Date(again.due_at).getTime()).toBe(new Date(t.due_at).getTime());

  await ops.reload();
  await ops.locator("li", { hasText: t.ref }).getByLabel("New status").selectOption("resolved");
  await ops.locator("li", { hasText: t.ref }).getByLabel(/Note for the school/).fill("Rover swapped for a new unit");
  await ops.locator("li", { hasText: t.ref }).getByRole("button", { name: "Update" }).click();
  await expect.poll(async () => (await ownerQuery("SELECT status FROM hardware_tickets WHERE id = $1", [t.id]))[0].status).toBe("resolved");
  await admin.reload();
  await admin.locator(`[data-ticket="${t.ref}"]`).getByRole("button", { name: "Send" }).click();
  await expect(admin.locator(`[data-ticket="${t.ref}"]`).getByText("Closed", { exact: true })).toBeVisible();
  await expect(admin.locator(`[data-ticket="${t.ref}"]`).getByText("Fixed within the agreed time")).toBeVisible();
  const events = await ownerQuery<{ status: string }>("SELECT status FROM hardware_ticket_events WHERE ticket_id = $1 ORDER BY id", [t.id]);
  expect(events.map((e) => e.status)).toEqual(["open", "resolved", "open", "resolved", "closed"]);
});

test("hardware ticket: an overdue ticket says so in words", async ({ page }) => {
  const s = await makeSchool();
  const ref = `HW-T${newId().slice(0, 6)}`;
  await ownerQuery(
    `INSERT INTO hardware_tickets (id, ref, school_id, lab_id, raised_by, category, summary, sla_hours, raised_at, due_at)
     VALUES ($1,$2,$3,$4,$5,'network','Wi-Fi down in lab',72, UTC_TIMESTAMP(3) - INTERVAL 80 HOUR, UTC_TIMESTAMP(3) - INTERVAL 80 HOUR + INTERVAL 72 HOUR)`,
    [newId(), ref, s.schoolId, s.labId, s.adminId],
  );
  await loginSchool(page, s.adminPhone);
  await expect(page.getByText(/Overdue by 8h/)).toBeVisible();
  await expect(page.getByText("Needs attention")).toBeVisible();
});

test("Kalamite booking: school asks, ops schedules a Campus Session, a vetted Kalamite accepts, a trainer observes", async ({ page, browser }) => {
  test.setTimeout(60_000); // several browsers and sign-ins in one journey
  const s = await makeSchool();
  await loginSchool(page, s.adminPhone);
  await page.goto("/app/school/fellows");
  const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  await page.getByLabel("Date and time").fill(local(new Date(Date.now() + 6 * 3600_000)));
  await page.getByLabel("Grades").fill("Grade 6 to 7");
  await page.getByLabel("Staff member in the room").selectOption({ label: `Tarun ${s.name.split(" ").pop()}` });
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Please ask at least 48 hours ahead")).toBeVisible();
  const when = new Date(Date.now() + 5 * 86400_000);
  when.setMinutes(0, 0, 0);
  await page.getByLabel("Date and time").fill(local(when));
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent")).toBeVisible();
  await expect(page.getByText("Waiting for Robokalam")).toBeVisible();

  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/schools");
  await ops.locator("li", { hasText: s.name }).getByRole("button", { name: "Schedule as Campus Session gig" }).click();
  await expect.poll(async () => (await ownerQuery("SELECT status FROM fellow_requests WHERE school_id = $1", [s.schoolId]))[0]?.status).toBe("scheduled");
  const [gig] = await ownerQuery("SELECT g.* FROM fellow_requests fr JOIN gigs g ON g.id = fr.gig_id WHERE fr.school_id = $1", [s.schoolId]);
  expect(gig).toMatchObject({ kind: "campus_session", mode: "offline", city: "Hyderabad" });
  expect(gig.responsible_adult).toContain("Tarun");
  expect(gig.location).toContain(s.name);

  const fp = await (await browser.newContext()).newPage();
  const fphone = await applyAsFellow(fp, { name: "Sneha Varma" });
  await passSteps(fphone, ALL_STEPS, true);
  await fp.goto("/app/fellow/gigs");
  await fp.locator("li", { hasText: gig.title }).getByRole("button", { name: "Accept" }).click();
  await expect(fp.locator("li", { hasText: gig.title }).getByRole("link", { name: "Teach mode" })).toBeVisible();

  await page.reload();
  await expect(page.getByText("Confirmed")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sneha/ })).toBeVisible();

  await ownerQuery("UPDATE gig_assignments SET status = 'delivered', delivered_at = now() WHERE gig_id = $1", [gig.id]);
  const tr = await (await browser.newContext()).newPage();
  await loginSchool(tr, s.trainerPhone);
  await tr.goto("/app/school/fellows");
  await tr.getByText("Record your observation").click();
  await tr.getByRole("button", { name: "Save observation" }).click();
  await expect(tr.getByText("You recorded an observation.")).toBeVisible();
  const fid = await accountId(fphone);
  const [asg] = await ownerQuery("SELECT id FROM gig_assignments WHERE gig_id = $1 AND fellow_id = $2", [gig.id, fid]);
  expect(await ownerQuery("SELECT kind FROM quality_reviews WHERE assignment_id = $1", [asg.id])).toEqual([{ kind: "observation" }]);

  // A trainer at another school can't score this Kalamite.
  const other = await makeSchool();
  const ot = await (await browser.newContext()).newPage();
  await loginSchool(ot, other.trainerPhone);
  const r = await ot.request.post("/api/ops/quality", { data: { assignmentId: asg.id, kind: "observation", prep: 1, clarity: 1, engagement: 1, safety: 1, outcome: 1 } });
  expect(r.status()).toBe(403);
});

test("removing a staff member signs them out at once", async ({ page, browser }) => {
  const s = await makeSchool();
  const t = await (await browser.newContext()).newPage();
  await loginSchool(t, s.trainerPhone);
  await loginSchool(page, s.adminPhone);
  await page.goto("/app/school/staff");
  await page.getByRole("button", { name: /^Remove Tarun/ }).click();
  await expect.poll(async () => (await ownerQuery("SELECT removed_at FROM school_staff WHERE account_id = $1", [s.trainerId]))[0].removed_at).not.toBeNull();
  await expect(page.getByRole("button", { name: /^Remove Tarun/ })).toHaveCount(0);
  await t.goto("/app/trainer");
  await expect(t).toHaveURL(/\/login\/school/);
  expect((await ownerQuery("SELECT trainer_account_id FROM school_classes WHERE id = $1", [s.classId]))[0].trainer_account_id).toBeNull();
});

test("a parent's number can't be turned into school staff", async ({ page, browser }) => {
  const parent = await (await browser.newContext()).newPage();
  const phone = await login(parent);
  const s = await makeSchool();
  await loginSchool(page, s.adminPhone);
  await page.goto("/app/school/staff");
  await page.getByLabel("Full name").fill("Some Parent");
  await page.getByLabel("Mobile number").fill(phone);
  await page.getByRole("button", { name: "Add to staff" }).click();
  await expect(page.getByText(/already has a different Robokalam account/)).toBeVisible();
  expect((await ownerQuery("SELECT role FROM accounts WHERE phone_e164 = $1", ["+91" + phone]))[0].role).toBe("parent");
});

test("audit report: the school's actions, ticket clocks, no phone numbers or student names", async ({ page }) => {
  const s = await makeSchool();
  const sessionId = await startedSession(s.classId);
  await loginSchool(page, s.trainerPhone);
  await page.request.post(`/api/school/tickets`, { data: { labId: s.labId, category: "network", summary: "Router keeps restarting" } });
  await page.request.post(`/api/school/sessions/${sessionId}`, { data: { status: "held", present: 20, total: 30 } });
  expect((await page.request.get("/api/school/audit")).status()).toBe(403);
  await loginSchool(page, s.adminPhone);
  const r = await page.request.get("/api/school/audit");
  expect(r.headers()["content-type"]).toContain("text/csv");
  const csv = await r.text();
  expect(csv).toContain("ticket_raised");
  expect(csv).toContain("class_held");
  expect(csv).toContain("Router keeps restarting");
  expect(csv).not.toContain(s.trainerPhone);
  expect(csv).not.toContain("(sample)");
});

test("ops adds a partner school; its admin can sign in straight away", async ({ page, browser }) => {
  const ops = await staffPage(browser, "ops");
  await ops.goto("/app/ops/schools");
  const name = `Ops School ${newId().slice(0, 6)}`;
  const phone = randomPhone();
  await ops.getByLabel("School name").fill(name);
  await ops.getByLabel("School admin's name").fill("Farah Khan");
  await ops.getByLabel("School admin's mobile number").fill(phone);
  await ops.getByRole("button", { name: "Add school" }).click();
  await expect(ops.getByText("School added. Their admin can sign in now.")).toBeVisible();
  await expect(ops.getByText(`${name} · Hyderabad`)).toBeVisible();
  await loginSchool(page, phone, /\/app\/school$/);
  await expect(page.getByText(name)).toBeVisible();
});
