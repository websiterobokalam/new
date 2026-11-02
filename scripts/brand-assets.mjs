// Regenerates the favicon and PWA icons from src/lib/globe.ts.
// Usage: node --experimental-strip-types scripts/brand-assets.mjs
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
const { globeSvg } = await import("../src/lib/globe.ts");
writeFileSync("public/icon.svg", globeSvg(64, "#FFFFFF"));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" });
const p = await b.newPage();
for (const size of [192, 512]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0;background:#fff">${globeSvg(size, "#FFFFFF").replace('viewBox="0 0 100 100"', 'viewBox="-8 -8 116 116"')}</body>`);
  await p.screenshot({ path: `public/icon-${size}.png`, omitBackground: false });
}
await b.close();
console.log("icons written");
