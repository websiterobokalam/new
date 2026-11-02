// Usage: node scripts/shoot.mjs <outdir> <path> [<path>...]
import { chromium } from "playwright";
const [out, ...paths] = process.argv.slice(2);
const base = process.env.BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
for (const [name, vp] of [["desk", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: process.env.SCHEME ?? "light" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "load", timeout: 45000 });
    // scroll through so every section powers on and the line draws
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(2600);
    const file = `${out}/${name}${p.replace(/\//g, "_") || "_home"}${process.env.SCHEME === "dark" ? "-dark" : ""}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file, errs.length ? "ERRORS: " + errs.join(" | ") : "");
    errs.length = 0;
  }
  await ctx.close();
}
await browser.close();
