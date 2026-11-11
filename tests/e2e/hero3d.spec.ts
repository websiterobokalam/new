import { test, expect } from "@playwright/test";

test("hero: the mascot shows at once on a calm stage, with nothing crossing it", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const mascot = page.locator(".hero-stage img.hero-mascot");
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveAttribute("alt", /Robokalam mascot/);
  // No 3D engine, orbits or canvases behind the mascot any more.
  await expect(page.locator(".hero-sky canvas, .hero-sky .orbit")).toHaveCount(0);
  // The speech bubble and doodles stay clear of the mascot's middle (its body).
  const m = (await mascot.boundingBox())!;
  const body = { x: m.x + m.width * 0.2, y: m.y + m.height * 0.12, w: m.width * 0.6, h: m.height * 0.8 };
  for (const el of await page.locator(".hero-bubble, .hero-doodle").all()) {
    const b = (await el.boundingBox())!;
    const overlaps = b.x < body.x + body.w && b.x + b.width > body.x && b.y < body.y + body.h && b.y + b.height > body.y;
    expect(overlaps, (await el.getAttribute("class")) ?? "").toBe(false);
  }
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("reduced motion: the hero holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const name = await page.locator(".hero-mascot").evaluate((e) => getComputedStyle(e).animationName);
  expect(name).toBe("none");
  await expect(page.locator(".hero-bubble")).toBeVisible();
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

test("footer friends: Kiko and the mascot say hi when tapped, without covering footer links", async ({ page }) => {
  await page.goto("/about");
  const kiko = page.getByRole("button", { name: "Say hi to Kiko" });
  await kiko.scrollIntoViewIfNeeded();
  await kiko.click();
  const bubble = page.locator(".friend-say");
  await expect(bubble).toHaveText(/Kiko/);
  const b = (await bubble.boundingBox())!;
  for (const link of await page.locator("footer .footer-ground a").all()) {
    const l = await link.boundingBox();
    if (!l) continue;
    const overlaps = b.x < l.x + l.width && b.x + b.width > l.x && b.y < l.y + l.height && b.y + b.height > l.y;
    expect(overlaps, (await link.textContent()) ?? "").toBe(false);
  }
  await page.getByRole("button", { name: "Say hi to the Robokalam mascot" }).click();
  await expect(bubble).toHaveCount(1);
});
