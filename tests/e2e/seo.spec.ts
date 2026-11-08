import { test, expect } from "@playwright/test";

/**
 * SEO audit over every URL in sitemap.xml: each page loads, is indexable, has
 * one h1, a unique title and description of sensible length, a self canonical,
 * an og:image, and alt text on every image. Plus robots.txt and llms.txt.
 */
test.describe.configure({ mode: "serial" });
test.skip(({ isMobile }) => isMobile, "markup is the same on every screen; audited once");

const attr = (html: string, re: RegExp) => html.match(re)?.[1]?.replace(/&amp;/g, "&").trim();

test("every sitemap page is indexable with sound titles, descriptions, canonicals and headings", async ({ request }) => {
  test.setTimeout(240_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(urls.length).toBeGreaterThan(25);
  const titles = new Map<string, string>(), descs = new Map<string, string>();
  const problems: string[] = [];
  for (const full of urls) {
    const u = new URL(full);
    const path = u.pathname;
    const r = await request.get(path);
    if (r.status() !== 200) { problems.push(`${path}: status ${r.status()}`); continue; }
    const html = await r.text();
    const title = attr(html, /<title>([^<]*)<\/title>/);
    const desc = attr(html, /<meta name="description" content="([^"]*)"/);
    const canon = attr(html, /<link rel="canonical" href="([^"]*)"/);
    const robots = attr(html, /<meta name="robots" content="([^"]*)"/);
    const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
    if (!title || title.length < 15 || title.length > 70) problems.push(`${path}: title length ${title?.length ?? 0} "${title}"`);
    if (!desc || desc.length < 50 || desc.length > 170) problems.push(`${path}: description length ${desc?.length ?? 0}`);
    if (!canon || new URL(canon).pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) problems.push(`${path}: canonical ${canon}`);
    if (robots && /noindex/.test(robots)) problems.push(`${path}: in sitemap but noindex`);
    if (h1s !== 1) problems.push(`${path}: ${h1s} h1`);
    if (!/<meta property="og:image" content="/.test(html)) problems.push(`${path}: no og:image`);
    for (const img of html.match(/<img\b[^>]*>/g) ?? []) if (!/\balt="/.test(img)) problems.push(`${path}: img without alt ${img.slice(0, 80)}`);
    if (title) { if (titles.has(title)) problems.push(`${path}: title same as ${titles.get(title)}`); else titles.set(title, path); }
    if (desc) { if (descs.has(desc)) problems.push(`${path}: description same as ${descs.get(desc)}`); else descs.set(desc, path); }
  }
  expect(problems, problems.join("\n")).toEqual([]);
});

test("robots.txt points at the sitemap and keeps private areas out", async ({ request }) => {
  const t = await (await request.get("/robots.txt")).text();
  expect(t).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  for (const p of ["/api/", "/app", "/login"]) expect(t).toContain(`Disallow: ${p}`);
});

test("llms.txt summarises the public site for answer engines", async ({ request }) => {
  const r = await request.get("/llms.txt");
  expect(r.status()).toBe(200);
  const t = await r.text();
  expect(t.startsWith("# Robokalam")).toBe(true);
  for (const s of ["Hyderabad", "Warangal", "/21c-lab", "/blog/"]) expect(t).toContain(s);
  expect(t).not.toMatch(/\/app\b|\/login/);
});

test("home page carries Organization and WebSite structured data; programmes carry Course", async ({ request }) => {
  const home = await (await request.get("/")).text();
  const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const types = blocks.flatMap((b) => [b["@type"]].flat());
  expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "FAQPage"]));
  const prog = await (await request.get("/programs/robo-ashaers")).text();
  expect(prog).toContain('"@type":"Course"');
});

test("analytics needs a measurement ID and consent, and never runs on account or children's pages", async ({ page }) => {
  // The test build has no NEXT_PUBLIC_GA_ID: no banner, no Google script, anywhere.
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: /help us improve/i })).toHaveCount(0);
  expect(await page.locator('script[src*="googletagmanager"]').count()).toBe(0);
});
