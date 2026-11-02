// Plain JavaScript on purpose: Next.js loads it directly, with no SWC compile
// step and no temporary "<hash>.next.config.ts" file written beside it.
import { readFileSync } from "node:fs";

const { redirects: legacyRedirects } = JSON.parse(readFileSync(new URL("./src/content/redirects.json", import.meta.url), "utf8"));

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return legacyRedirects.map((r) => ({ source: r.from, destination: r.to, statusCode: 301 }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
