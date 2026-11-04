import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Content pages carried over from old.robokalam.com. */
const PAGES: [string, RegExp][] = [
  ["/about", /Literature of Technologies/], ["/contact", /Talk to Robokalam/], ["/faq", /Questions, answered/],
  ["/privacy", /Privacy notice/], ["/terms", /Terms and conditions/], ["/refunds", /Refund and cancellation/],
  ["/child-safety", /Child safety/], ["/careers", /future-ready schools/], ["/validate", /Validate a Robokalam certificate/],
  ["/kits", /ASHAER Box/], ["/programs", /first robot/], ["/bootcamps", /Learn today/], ["/internships", /real clients/],
  ["/blog", /Build notes from Robokalam/], ["/blog/build-a-line-following-robot", /line-following robot/], ["/locations/hyderabad", /Robotics, coding and AI in Hyderabad/], ["/locations/warangal", /Robotics, coding and AI in Warangal/], ["/events", /show what they built/], ["/partners", /Partner with Robokalam/],
  ["/studio", /Software for education/], ["/impact", /measured honestly/], ["/programs/robo-ashaers", /Robo Ashaers/],
];

test("every content page is coded, not a placeholder", async ({ request }) => {
  for (const [path, h1] of PAGES) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    const html = await res.text();
    expect(html, path).toMatch(h1);
    expect(html, path).not.toContain("Coming in Phase");
    expect(html, path).not.toContain("ships in Phase 2");
  }
});

test("old external links and contact details are connected", async ({ request }) => {
  const html = (await (await request.get("/contact")).text()) + (await (await request.get("/careers")).text());
  for (const s of [
    "https://learn.robokalam.com", "https://shop.robokalam.com", "https://school.robokalam.com", "https://validate.robokalam.com",
    "https://robokalam.com/ashaerlabs/", "app.pyjamahr.com/careers?company=Robokalam&amp;company_uuid=71BA5814DB", "linkedin.com/company/robokalam",
    "instagram.com/robokalam", "facebook.com/robokalam", "pinterest.com/robokalam", "youtube.com/watch?v=OnH2-on5O6o",
    "mailto:info@robokalam.com", "tel:+919666287717", "tel:+919949279869", "T-Hub Phase 2, Hitec City", "Essen, Germany", "Coimbatore",
  ]) expect(html).toContain(s);
  // External links open in a new tab and never leak the opener.
  expect(html).not.toMatch(/target="_blank"(?![^>]*rel="noopener noreferrer")/);
});

test("privacy notice: DPDP rights, no ad tracking, children protected", async ({ request }) => {
  const html = await (await request.get("/privacy")).text();
  for (const s of ["Digital Personal Data Protection Act", "Data Protection Board of India", "verifiable consent", "We do not track children", "rk_sess"]) expect(html).toContain(s);
  expect(html).not.toMatch(/networkadvertising|Ads Settings|over seven \(7\) years/);
});

test("unapproved old-site claims stay hidden", async ({ request }) => {
  const html = await (await request.get("/about")).text();
  expect(html).not.toMatch(/75%|Top 1%|since 2015|IIT Delhi/);
});

test("footer links out to the shop and learning portal in a new tab", async ({ page }) => {
  await page.goto("/about");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: /^Shop/ })).toHaveAttribute("href", "https://shop.robokalam.com");
  await expect(footer.getByRole("link", { name: /^Learning portal/ })).toHaveAttribute("target", "_blank");
  await expect(footer.getByRole("link", { name: /^LinkedIn/ })).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  test(`a11y ${theme} content pages`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    if (theme === "dark") await page.addInitScript(() => { try { localStorage.setItem("rk-theme", "dark"); } catch {} });
    for (const path of ["/about", "/contact", "/faq", "/privacy", "/kits", "/programs", "/programs/electro-ashaers", "/careers", "/blog", "/blog/build-a-line-following-robot", "/locations", "/locations/hyderabad", "/locations/warangal"]) {
      await page.goto(path);
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      const issues = r.violations.map((v) => `${path} ${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
      expect(issues, issues.join("\n")).toEqual([]);
    }
  });
}

test("blog: posts, RSS and article markup", async ({ request }) => {
  const rss = await request.get("/blog/rss.xml");
  expect(rss.headers()["content-type"]).toContain("rss");
  expect(await rss.text()).toContain("/blog/robotics-classes-for-kids-in-hyderabad");
  const html = await (await request.get("/blog/robotics-classes-for-kids-in-hyderabad")).text();
  for (const s of ['"@type":"BlogPosting"', '"@type":"BreadcrumbList"', 'rel="canonical" href="https://robokalam.com/blog/robotics-classes-for-kids-in-hyderabad"', 'property="og:type" content="article"']) expect(html).toContain(s);
  expect((await request.get("/stories", { maxRedirects: 0 })).headers().location).toMatch(/\/blog$/);
});

test("local SEO: Hyderabad and Warangal", async ({ request }) => {
  const hyd = await (await request.get("/locations/hyderabad")).text();
  for (const s of ['"LocalBusiness"', '"postalCode":"500081"', 'name="geo.placename" content="Hyderabad"', '"@type":"FAQPage"', "Gachibowli"]) expect(hyd).toContain(s);
  const wgl = await (await request.get("/locations/warangal")).text();
  for (const s of ['"EducationalOrganization"', 'content="Warangal"', "Hanamkonda", "Kazipet"]) expect(wgl).toContain(s);
  // No Warangal office: its own markup must never invent an address.
  const ld = [...wgl.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const city = ld.find((x) => x.name === "Robokalam Warangal");
  expect(city).toBeTruthy();
  expect(city.address).toBeUndefined();
  const map = await (await request.get("/sitemap.xml")).text();
  for (const s of ["/locations/hyderabad", "/locations/warangal", "/blog/build-a-line-following-robot"]) expect(map).toContain(s);
});

test("footer has a separate Blog link", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("href", "/blog");
});

test("light theme by default, even when the device prefers dark; dark is opt-in from the footer", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("header").getByRole("button", { name: /theme/i })).toHaveCount(0);
  const sw = page.locator("footer").getByRole("switch", { name: "Dark theme" });
  await expect(sw).toBeEnabled();
  await sw.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("footer").getByRole("switch", { name: "Dark theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
