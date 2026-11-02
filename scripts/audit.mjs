// Usage: node scripts/audit.mjs <path>...  -> overflow at 390px, console errors, first-load JS (gzip)
import { chromium } from "playwright";
import { gzipSync } from "node:zlib";
const base = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
for (const path of process.argv.slice(2)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = [];
  const js = new Map();
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !m.text().includes("404") && errs.push(m.text()));
  p.on("response", async (r) => {
    if (r.request().resourceType() === "script") {
      try { js.set(r.url(), gzipSync(await r.body()).length); } catch {}
    }
  });
  const res = await p.goto(base + path, { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  const kb = [...js.values()].reduce((a, n) => a + n, 0) / 1024;
  console.log(`${path.padEnd(24)} ${res.status()} width=${sw} js=${kb.toFixed(0)}KB gz (${js.size} files) ${errs.length ? "ERR " + errs.slice(0, 3).join(" | ") : "ok"}`);
  await ctx.close();
}
await b.close();
