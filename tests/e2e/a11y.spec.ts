import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
