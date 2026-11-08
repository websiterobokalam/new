import { test, expect } from "@playwright/test";

test("hero: the illustrated Kalam-bot shows at once; the 3D scene loads lazily without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".stage3d .cutebot")).toBeAttached();
  // The 3D engine is never part of the first HTML.
  const html = await (await page.request.get("/")).text();
  expect(html).not.toContain("robotScene");
  await page.waitForTimeout(3000);
  expect(errors).toEqual([]);
});

test("reduced motion: no 3D scene, the illustration stays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.locator(".stage3d canvas")).toHaveCount(0);
  await expect(page.locator(".stage3d .cutebot")).toBeVisible();
});
