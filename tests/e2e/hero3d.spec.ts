import { test, expect } from "@playwright/test";

test("hero: the mascot sits on a drawing sheet; call-out labels stay off the mascot's body", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const mascot = page.locator(".bp-sheet img.bp-mascot");
  await expect(mascot).toBeVisible();
  await expect(mascot).toHaveAttribute("alt", /Robokalam mascot/);
  await expect(page.locator(".hero-sky canvas, .hero-sky .orbit")).toHaveCount(0);
  // Sense, think, act: three labels, drawn in after load.
  await expect(page.locator(".bp-word")).toHaveText(["Sense", "Think", "Act"]);
  // Sharp on high-density screens: the full-size artwork is offered.
  expect(await mascot.getAttribute("srcset")).toContain("mascot.webp 967w");
  const m = (await mascot.boundingBox())!;
  const body = { x: m.x + m.width * 0.2, y: m.y + m.height * 0.12, w: m.width * 0.6, h: m.height * 0.8 };
  await page.waitForTimeout(1800);
  for (const el of await page.locator(".bp-label, .bp-title").all()) {
    const b = (await el.boundingBox())!;
    const overlaps = b.x < body.x + body.w && b.x + b.width > body.x && b.y < body.y + body.h && b.y + b.height > body.y;
    expect(overlaps, (await el.textContent()) ?? "").toBe(false);
  }
  expect(errors).toEqual([]);
});

test("reduced motion: the drawing is complete at once and nothing moves", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator(".bp-mascot").evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  expect(await page.locator(".bp-label").first().evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
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

test("photo gallery: filters, full-screen viewer with next/previous, keyboard and Escape", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator(".photo-gallery").first();
  await gallery.scrollIntoViewIfNeeded();
  const tiles = gallery.locator(".pg-tile");
  const all = await tiles.count();
  expect(all).toBeGreaterThanOrEqual(6);
  // A filter narrows the grid, "All" restores it.
  await gallery.getByRole("button", { name: /^Events \d+$/ }).click();
  const events = await tiles.count();
  expect(events).toBeLessThan(all);
  await expect(gallery.getByRole("button", { name: /^Events \d+$/ })).toHaveAttribute("aria-pressed", "true");
  await gallery.getByRole("button", { name: /^All \d+$/ }).click();
  await expect(tiles).toHaveCount(all);
  // Open the second photo, step forward with the arrow key and the button, then close with Escape.
  const second = gallery.getByRole("button", { name: /\(open full size\)$/ }).nth(1);
  await second.click();
  const viewer = page.locator("dialog.pg-viewer");
  await expect(viewer).toHaveAttribute("aria-label", new RegExp(`^Photo 2 of ${all}:`));
  await page.keyboard.press("ArrowRight");
  await expect(viewer).toHaveAttribute("aria-label", new RegExp(`^Photo 3 of ${all}:`));
  await page.getByRole("button", { name: "Previous photo" }).click();
  await expect(viewer).toHaveAttribute("aria-label", new RegExp(`^Photo 2 of ${all}:`));
  await page.keyboard.press("Escape");
  await expect(viewer).not.toBeVisible();
  await expect(second).toBeFocused();
});

test("footer friends: rapid taps never duplicate the robots", async ({ page }) => {
  await page.goto("/about");
  const mascot = page.getByRole("button", { name: "Say hi to the Robokalam mascot" });
  await mascot.scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) await mascot.click({ delay: 10 });
  await expect(page.locator(".footer-friend img")).toHaveCount(1);
  await expect(page.locator(".footer-friend svg.kiko")).toHaveCount(1);
  await expect(page.locator(".friend-say")).toHaveCount(1);
});
