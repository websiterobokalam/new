import { test, expect } from "@playwright/test";

test("hero: the old-site orbit with a robot at its centre, a typing headline and three pill buttons", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  // Search engines and screen readers get the whole sentence, not the half-typed word.
  await expect(h1).toContainText("Building the future with");
  await expect(h1).toContainText("AI, robotics labs, smart software and young innovators.");
  await expect(page.locator(".hero-orbit-main .orb-ring")).toHaveCount(3);
  await expect(page.locator(".hero-orbit-main .orb-bot image")).toHaveCount(1);
  for (const name of ["Explore Solutions", "Innovation Ecosystem", "View Vision"]) await expect(page.getByRole("link", { name })).toBeVisible();
  // The typed word changes over time.
  const typed = page.locator(".typewriter-text");
  const first = await typed.textContent();
  await expect.poll(async () => typed.textContent(), { timeout: 8000 }).not.toBe(first);
  await expect(page.locator(".hero-strip li")).toHaveCount(5);
  expect(errors).toEqual([]);
});

test("reduced motion: the orbit and the cursor hold still and the first word stays", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(await page.locator(".hero-orbit-main .orb-ring").first().evaluate((e) => getComputedStyle(e).animationName)).toBe("none");
  await page.waitForTimeout(3500);
  await expect(page.locator(".typewriter-text")).toHaveText("AI.");
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
  await gallery.getByRole("button", { name: /^Events/ }).click();
  const events = await tiles.count();
  expect(events).toBeLessThan(all);
  await expect(gallery.getByRole("button", { name: /^Events/ })).toHaveAttribute("aria-pressed", "true");
  await gallery.getByRole("button", { name: /^All/ }).click();
  await expect(tiles).toHaveCount(all);
  // Open the second photo, step forward with the arrow key and the button, then close with Escape.
  const second = gallery.getByRole("button", { name: /^Open photo:/ }).nth(1);
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

test("pointer companion: a globe of 0s and 1s on desktop, hidden over form fields, absent on touch", async ({ page, isMobile }) => {
  await page.goto("/contact");
  if (isMobile) {
    await expect(page.locator(".cursor-globe")).toHaveCount(0);
    return;
  }
  const globe = page.locator(".cursor-globe");
  await expect(globe).toHaveCount(1);
  await expect(globe).toHaveAttribute("aria-hidden", "true");
  await page.mouse.move(200, 200);
  await page.mouse.move(260, 240, { steps: 5 });
  await expect(globe).toHaveCSS("opacity", "1");
  const field = page.locator("input, textarea").first();
  const box = (await field.boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 5 });
  await expect(globe).toHaveCSS("opacity", "0");
});
