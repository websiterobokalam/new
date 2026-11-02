import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const PORT = Number(process.env.PORT ?? 3200);
export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.CHROME_PATH || existsSync("/opt/pw-browsers/chromium") ? { executablePath: process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium" } : {},
  },
  projects: [
    { name: "logic", testMatch: /logic\/.*\.spec\.ts/ },
    { name: "mobile", testMatch: /e2e\/.*\.spec\.ts/, use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "desktop", testMatch: /e2e\/.*\.spec\.ts/, use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: true, env: { NEXT_TELEMETRY_DISABLED: "1", LEADS_LOCAL_FILE: "1", LEAD_RATE_LIMIT: "500" } },
});
