import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { envChecks, summarise, isLiveSite } from "../../scripts/launch-checks.mjs";

/** A complete, launch-ready set of settings. */
const READY: Record<string, string> = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://robokalam.com",
  SESSION_SECRET: "a3f9c1e07b5d42e8a6c0f1b2d3e4f5a6b7c8d9e0",
  CRON_SECRET: "c0ffee1234567890abcd",
  DATABASE_URL: "mysql://u:p@db.example.net/rk",
  DATABASE_SSL: "1",
  BACKUP_VERIFIED_AT: "2026-10-20",
  OTP_PROVIDER: "msg91", MSG91_AUTH_KEY: "k", MSG91_TEMPLATE_ID: "t",
  RAZORPAY_KEY_ID: "rzp_live_abc", RAZORPAY_KEY_SECRET: "s", RAZORPAY_WEBHOOK_SECRET: "w",
  SUPPLIER_GSTIN: "36ABCDE1234F1Z5", SUPPLIER_ADDRESS: "T-Hub Phase 2, Hitec City, Hyderabad 500081", SAC_CODE: "999293",
  LEGAL_NAME: "Robokalam Technologies Private Limited", LEGAL_PAGES_APPROVED: "1", REFUND_POLICY_APPROVED: "1",
  GRIEVANCE_OFFICER_NAME: "A. Officer", GRIEVANCE_OFFICER_EMAIL: "grievance@robokalam.com",
  SAFEGUARDING_LEAD_NAME: "S. Lead", SAFEGUARDING_EMAIL: "safeguarding@robokalam.com", SAFEGUARDING_RESPONSE_HOURS: "24",
  EMAIL_TRANSPORT: "smtp", SMTP_HOST: "smtp.hostinger.com", SMTP_USER: "info@robokalam.com", SMTP_PASS: "x", MAIL_FROM: "Robokalam <info@robokalam.com>",
  OPS_EMAIL: "ops@robokalam.com",
  CRM_WEBHOOK_LEARNER: "https://x", CRM_WEBHOOK_SCHOOL: "https://x", CRM_WEBHOOK_EDUCATOR: "https://x",
};
const NOW = new Date("2026-11-04T10:00:00Z");

test("a fully configured server passes every settings check", () => {
  const s = summarise(envChecks(READY, NOW));
  expect(s.blockers.map((b) => b.id)).toEqual([]);
  expect(s.warnings.map((b) => b.id)).toEqual([]);
});

test("each launch blocker is caught", () => {
  const cases: [string, Record<string, string | undefined>][] = [
    ["test_providers_off", { ALLOW_TEST_PROVIDERS: "1" }],
    ["test_providers_off", { OTP_PROVIDER: "test" }],
    ["otp", { OTP_PROVIDER: "test" }],
    ["payments", { RAZORPAY_KEY_ID: "rzp_test_abc" }],
    ["session_secret", { SESSION_SECRET: "short" }],
    ["gstin", { SUPPLIER_GSTIN: "NOT-A-GSTIN" }],
    ["legal_name", { LEGAL_NAME: "" }],
    ["legal_approved", { LEGAL_PAGES_APPROVED: "0" }],
    ["refund_policy", { REFUND_POLICY_APPROVED: "0" }],
    ["safeguarding_lead", { SAFEGUARDING_EMAIL: "not-an-email" }],
    ["grievance_officer", { GRIEVANCE_OFFICER_EMAIL: "not-an-email" }],
    ["email", { EMAIL_TRANSPORT: "test" }],
    ["backup_verified", { BACKUP_VERIFIED_AT: "2026-01-01" }],
    ["site_url", { NEXT_PUBLIC_SITE_URL: "https://new.robokalam.com" }],
    ["review_off", { NEXT_PUBLIC_REVIEW_MODE: "1" }],
  ];
  for (const [id, change] of cases) {
    const s = summarise(envChecks({ ...READY, ...change }, NOW));
    expect(s.blockers.map((b) => b.id), `${id} ${JSON.stringify(change)}`).toContain(id);
    expect(s.ready).toBe(false);
  }
});

test("company name and approvals are confirmed by default; unnamed people are only a recommendation", () => {
  const bare = { ...READY };
  for (const k of ["LEGAL_NAME", "LEGAL_PAGES_APPROVED", "REFUND_POLICY_APPROVED", "SAFEGUARDING_LEAD_NAME", "GRIEVANCE_OFFICER_NAME", "GRIEVANCE_OFFICER_EMAIL"]) delete bare[k];
  const checks = envChecks(bare, NOW);
  const s = summarise(checks);
  expect(s.blockers.map((b) => b.id)).toEqual([]);
  expect(s.warnings.map((w) => w.id).sort()).toEqual(["grievance_named", "safeguarding_named"]);
  expect(checks.find((c) => c.id === "legal_name")?.detail).toBe("Robokalam Technologies Private Limited");
});

test("only robokalam.com in production, outside review mode, counts as the live site", () => {
  expect(isLiveSite(READY)).toBe(true);
  expect(isLiveSite({ ...READY, NEXT_PUBLIC_SITE_URL: "https://new.robokalam.com" })).toBe(false);
  expect(isLiveSite({ ...READY, NEXT_PUBLIC_REVIEW_MODE: "1" })).toBe(false);
  expect(isLiveSite({ ...READY, NODE_ENV: "development" })).toBe(false);
});

test("start-up preflight: the live site refuses to start with blockers; review copies start", () => {
  const run = (env: Record<string, string>) => spawnSync(process.execPath, ["scripts/preflight.mjs", "--on-start"], { env: { PATH: process.env.PATH ?? "", ...env } as unknown as NodeJS.ProcessEnv, encoding: "utf8" });
  const blocked = { ...READY, ALLOW_TEST_PROVIDERS: "1", DATABASE_URL: "" };
  expect(run(blocked).status).toBe(1);
  expect(run({ ...blocked, NEXT_PUBLIC_SITE_URL: "https://new.robokalam.com" }).status).toBe(0);
  const override = run({ ...blocked, LAUNCH_PREFLIGHT: "warn" });
  expect(override.status).toBe(0);
  expect(override.stderr).toContain("LIVE site with blockers");
});
