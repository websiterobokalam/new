import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto(process.argv[2] ?? "http://localhost:3100/", { waitUntil: "load" });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const rc = el.getBoundingClientRect();
    if (rc.right > innerWidth + 1 && rc.width > 0) out.push(`${el.tagName}.${(el.className?.baseVal ?? el.className ?? "").toString().slice(0, 60)} right=${Math.round(rc.right)}`);
  }
  return { sw: document.documentElement.scrollWidth, out: out.slice(0, 15) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
