import { test, expect } from "@playwright/test";

test("hero: a two-tone headline over a real lab photo, side tags, buttons and a scroll cue", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveText(/Building the future\s*with robotics, AI & smart labs/);
  await expect(page.locator(".az-hero-photo img")).toBeVisible();
  for (const name of ["Book a consultation", "Free build session"]) await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Scroll to explore/ })).toHaveAttribute("href", "#intro");
  // Facts are plain and true: ages, tracks, offices, one partner.
  await expect(page.locator("#intro dd")).toHaveCount(4);
  await expect(page.locator("#solutions .sol-row")).toHaveCount(6);
  expect(errors).toEqual([]);
});

test("menu: the two-line button opens a full-screen numbered menu", async ({ page }) => {
  await page.goto("/");
  await page.locator('summary[aria-label="Menu"]').click();
  const menu = page.getByRole("navigation", { name: "Mobile menu" });
  await expect(menu.getByRole("link", { name: /Schools/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Gallery" })).toBeVisible();
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
