import { test, expect } from "@playwright/test";

test("hero: the mascot shows at once; the 3D scene loads lazily without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".stage3d img.mascot")).toBeAttached();
  // The 3D engine is never part of the first HTML.
  const html = await (await page.request.get("/")).text();
  expect(html).not.toContain("robotScene");
  await page.waitForTimeout(3000);
  expect(errors).toEqual([]);
});

test("reduced motion: no 3D scene, the mascot image stays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(2500);
  await expect(page.locator(".stage3d canvas")).toHaveCount(0);
  await expect(page.locator(".stage3d img.mascot")).toBeVisible();
});

test("real photos: galleries show lab and event photos, never children's photos without consent", async ({ request }) => {
  for (const path of ["/", "/21c-lab", "/events", "/about", "/kits", "/locations/warangal"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain("/images/real/");
    for (const id of ["kids-building-1", "kids-building-2", "classroom-ldr", "robot-demo-kids", "kid-robodog", "assembly-talk"]) expect(html, `${path} ${id}`).not.toContain(`/images/real/${id}`);
  }
  const lab = await (await request.get("/21c-lab")).text();
  for (const id of ["robotics-zone", "space-zone", "coding-zone"]) expect(lab).toContain(`/images/real/${id}`);
});
