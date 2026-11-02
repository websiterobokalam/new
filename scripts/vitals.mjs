// Rough lab vitals on a throttled mid-range Android profile (4x CPU, ~4G).
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
for (const path of process.argv.slice(2)) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.addInitScript(() => {
    window.__v = { lcp: 0, cls: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__v.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  });
  await p.goto("http://localhost:3100" + path, { waitUntil: "load" });
  await p.waitForTimeout(3000);
  await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(800);
  const v = await p.evaluate(() => window.__v);
  console.log(`${path.padEnd(18)} LCP=${Math.round(v.lcp)}ms CLS=${v.cls.toFixed(3)}`);
  await ctx.close();
}
await b.close();
