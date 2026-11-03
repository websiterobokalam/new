import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login, addLearner, applyAsFellow, passSteps, ALL_STEPS, staffPage, makeSchool, startedSession, loginSchool, ownerQuery, newId } from "../helpers";

for (const theme of ["light", "dark"] as const) {
  for (const path of ["/", "/learn", "/21c-lab", "/21c-lab/planner", "/fellows", "/fellows/apply", "/login/learner"]) {
    test(`a11y ${theme} ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForTimeout(400);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    });
  }
}


for (const theme of ["light", "dark"] as const) {
  test(`a11y ${theme} public Phase 2 pages`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const path of ["/courses", "/courses/robo-ashaers-junior-l1", "/learn/build-session"]) {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    }
  });

  test(`a11y ${theme} logged-in app`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await login(page);
    const id = await addLearner(page, "Nila");
    for (const path of ["/app", `/app/learners/${id}`, `/app/learners/${id}/space`, "/app/consent", "/app/orders"]) {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    }
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`a11y ${theme} Fellow app and ops`, async ({ page, browser }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    const phone = await applyAsFellow(page);
    const check = async (p: import("@playwright/test").Page, path: string) => {
      await p.goto(path);
      const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    };
    for (const path of ["/app/fellow", "/app/fellow/test", "/app/fellow/academy", "/app/fellow/academy/child-safety", "/app/fellow/terms", "/app/fellow/checks", "/app/fellow/demo"]) await check(page, path);
    await passSteps(phone, ALL_STEPS, true);
    for (const path of ["/app/fellow", "/app/fellow/gigs", "/app/fellow/earnings", "/app/fellow/growth", "/app/fellow/support", "/app/messages", "/fellow-terms", "/fellows/apply"]) await check(page, path);
    const ops = await staffPage(browser, "ops");
    await ops.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const path of ["/app/ops/fellows", "/app/ops/gigs", "/app/ops/payouts", "/app/ops/cases"]) await check(ops, path);
  });
}


for (const theme of ["light", "dark"] as const) {
  test(`a11y ${theme} school portal, trainer and ops school screens`, async ({ page, browser }) => {
    test.setTimeout(60_000);
    const s = await makeSchool();
    const sessionId = await startedSession(s.classId);
    await ownerQuery(
      `INSERT INTO hardware_tickets (id, ref, school_id, lab_id, raised_by, category, summary, sla_hours, raised_at, due_at)
       VALUES ($1,$2,$3,$4,$5,'network','Wi-Fi down',72, UTC_TIMESTAMP(3) - INTERVAL 80 HOUR, UTC_TIMESTAMP(3) - INTERVAL 80 HOUR + INTERVAL 72 HOUR)`,
      [newId(), `HW-A${newId().slice(0, 6)}`, s.schoolId, s.labId, s.adminId],
    );
    const check = async (p: import("@playwright/test").Page, paths: string[]) => {
      await p.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const path of paths) {
        await p.goto(path);
        const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
        const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
        expect(issues, issues.join("\n")).toEqual([]);
      }
    };
    await check(page, ["/login/school"]);
    await loginSchool(page, s.adminPhone);
    await check(page, ["/app/school", "/app/school/timetable", "/app/school/tickets", "/app/school/fellows", "/app/school/staff"]);
    const t = await (await browser.newContext()).newPage();
    await loginSchool(t, s.trainerPhone);
    await check(t, ["/app/trainer", `/app/trainer/sessions/${sessionId}`]);
    const ops = await staffPage(browser, "ops");
    await check(ops, ["/app/ops/schools", "/app/ops/tickets"]);
  });
}
