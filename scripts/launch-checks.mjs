// Launch readiness checks (Phase 6). Plain JavaScript so the start-up preflight
// can run them before Next starts; the ops Launch page imports the same file.
//
// Each check: { id, area, label, ok, severity: "blocker" | "warn", detail, fix }.
// A blocker stops the live site from starting (see scripts/preflight.mjs).

const LIVE_HOSTS = ["robokalam.com", "www.robokalam.com"];
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 86_400_000;

const set = (v) => typeof v === "string" && v.trim().length > 0;

function host(env) {
  try { return new URL(/^https?:\/\//.test(env.NEXT_PUBLIC_SITE_URL ?? "") ? env.NEXT_PUBLIC_SITE_URL : `https://${env.NEXT_PUBLIC_SITE_URL}`).hostname; } catch { return ""; }
}

/** True when this server is the public robokalam.com (not a review or staging copy). */
export function isLiveSite(env = process.env) {
  return env.NODE_ENV === "production" && env.NEXT_PUBLIC_REVIEW_MODE !== "1" && LIVE_HOSTS.includes(host(env));
}

/** Checks that need only settings. Safe to run anywhere. */
export function envChecks(env = process.env, now = new Date()) {
  const c = [];
  const add = (id, area, label, ok, detail, fix, severity = "blocker") => c.push({ id, area, label, ok: !!ok, severity, detail, fix });

  const url = env.NEXT_PUBLIC_SITE_URL ?? "";
  add("site_url", "Site", "Public address is https://robokalam.com", /^https:\/\//.test(url) && LIVE_HOSTS.includes(host(env)), set(url) ? `Set to ${url}` : "Not set", "Set NEXT_PUBLIC_SITE_URL=https://robokalam.com, then rebuild.");
  add("review_off", "Site", "Review mode is off", env.NEXT_PUBLIC_REVIEW_MODE !== "1", env.NEXT_PUBLIC_REVIEW_MODE === "1" ? "Review banner and sample content are on" : "Off", "Remove NEXT_PUBLIC_REVIEW_MODE, then rebuild.");
  add("test_providers_off", "Security", "Test sign-in codes and mock payments are off", env.ALLOW_TEST_PROVIDERS !== "1" && env.PAYMENT_PROVIDER !== "mock" && env.OTP_PROVIDER !== "test", env.ALLOW_TEST_PROVIDERS === "1" ? "ALLOW_TEST_PROVIDERS=1: anyone can sign in with 123456" : "Off", "Remove ALLOW_TEST_PROVIDERS, PAYMENT_PROVIDER=mock and OTP_PROVIDER=test.");
  add("session_secret", "Security", "Session secret is long and random", (env.SESSION_SECRET ?? "").length >= 32 && !/test|dev|change|example/i.test(env.SESSION_SECRET ?? ""), set(env.SESSION_SECRET) ? `${env.SESSION_SECRET.length} characters` : "Not set", "Set SESSION_SECRET to 32+ random characters (openssl rand -hex 32).");
  add("cookies_secure", "Security", "Cookies are secure", env.INSECURE_COOKIES !== "1", env.INSECURE_COOKIES === "1" ? "INSECURE_COOKIES=1" : "Secure", "Remove INSECURE_COOKIES.");
  add("cron_secret", "Security", "Scheduled-job key is set", (env.CRON_SECRET ?? "").length >= 16 && !/test/i.test(env.CRON_SECRET ?? ""), set(env.CRON_SECRET) ? "Set" : "Not set", "Set CRON_SECRET to 16+ random characters and use it in the Hostinger cron URLs.");

  add("database", "Database", "Database connection is set", set(env.DATABASE_URL), set(env.DATABASE_URL) ? "Set" : "Not set", "Set DATABASE_URL to the Hostinger MySQL database.");
  add("database_ssl", "Database", "Database connection is encrypted", env.DATABASE_SSL === "1" || /@(127\.0\.0\.1|localhost)[:/]/.test(env.DATABASE_URL ?? ""), env.DATABASE_SSL === "1" ? "SSL on" : "SSL off", "Set DATABASE_SSL=1 if the database is on another server.", "warn");
  const verified = Date.parse(env.BACKUP_VERIFIED_AT ?? "");
  add("backup_verified", "Database", "A backup was restored and checked in the last 90 days", Number.isFinite(verified) && now.getTime() - verified < 90 * DAY && verified <= now.getTime() + DAY, Number.isFinite(verified) ? `Last checked ${env.BACKUP_VERIFIED_AT}` : "Never checked", "Run node scripts/backup-verify.mjs <backup.sql.gz>, then set BACKUP_VERIFIED_AT to the date it printed.");

  add("otp", "Sign-in", "Real SMS sign-in codes (MSG91)", env.OTP_PROVIDER === "msg91" && set(env.MSG91_AUTH_KEY) && set(env.MSG91_TEMPLATE_ID), env.OTP_PROVIDER ? `OTP_PROVIDER=${env.OTP_PROVIDER}` : "Not set", "Set OTP_PROVIDER=msg91, MSG91_AUTH_KEY and a DLT-registered MSG91_TEMPLATE_ID.");

  add("payments", "Payments", "Razorpay live keys", (env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_") && set(env.RAZORPAY_KEY_SECRET), set(env.RAZORPAY_KEY_ID) ? (env.RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "Test keys" : "Set") : "Not set", "Set RAZORPAY_KEY_ID (rzp_live_...) and RAZORPAY_KEY_SECRET.");
  add("payments_webhook", "Payments", "Razorpay webhook secret", set(env.RAZORPAY_WEBHOOK_SECRET), set(env.RAZORPAY_WEBHOOK_SECRET) ? "Set" : "Not set", "In Razorpay, add a webhook to https://robokalam.com/api/webhooks/razorpay and set RAZORPAY_WEBHOOK_SECRET.");
  add("gstin", "Invoices", "GSTIN on invoices", GSTIN.test((env.SUPPLIER_GSTIN ?? "").toUpperCase()), set(env.SUPPLIER_GSTIN) ? "Set" : "Not set", "Set SUPPLIER_GSTIN (15 characters).");
  add("supplier_address", "Invoices", "Registered address on invoices", (env.SUPPLIER_ADDRESS ?? "").length >= 15, set(env.SUPPLIER_ADDRESS) ? "Set" : "Not set", "Set SUPPLIER_ADDRESS to the registered office address.");
  add("sac", "Invoices", "SAC code for education services", set(env.SAC_CODE), set(env.SAC_CODE) ? env.SAC_CODE : "Not set", "Set SAC_CODE (confirm with your accountant).", "warn");

  add("legal_name", "Legal", "Legal company name confirmed", set(env.LEGAL_NAME), set(env.LEGAL_NAME) ? env.LEGAL_NAME : "Not set: pages show the placeholder name", "Set LEGAL_NAME to the registered company name, then rebuild.");
  add("legal_approved", "Legal", "Privacy, terms and child-safety pages approved by counsel", env.LEGAL_PAGES_APPROVED === "1", env.LEGAL_PAGES_APPROVED === "1" ? "Approved" : "Pages still say draft", "After counsel signs off, set LEGAL_PAGES_APPROVED=1 and rebuild.");
  add("refund_policy", "Legal", "Refund policy approved", env.REFUND_POLICY_APPROVED === "1", env.REFUND_POLICY_APPROVED === "1" ? "Approved" : "Draft: every request goes to a person", "Set REFUND_POLICY_APPROVED=1 once the policy is approved.");
  add("grievance_officer", "Legal", "Grievance Officer named", set(env.GRIEVANCE_OFFICER_NAME) && EMAIL.test(env.GRIEVANCE_OFFICER_EMAIL ?? ""), set(env.GRIEVANCE_OFFICER_NAME) ? env.GRIEVANCE_OFFICER_NAME : "Not named", "Set GRIEVANCE_OFFICER_NAME and GRIEVANCE_OFFICER_EMAIL, then rebuild.");

  add("safeguarding_lead", "Child safety", "Safeguarding Lead named", set(env.SAFEGUARDING_LEAD_NAME) && EMAIL.test(env.SAFEGUARDING_EMAIL ?? ""), set(env.SAFEGUARDING_LEAD_NAME) ? env.SAFEGUARDING_LEAD_NAME : "Not named", "Set SAFEGUARDING_LEAD_NAME and SAFEGUARDING_EMAIL, then rebuild.");
  add("safeguarding_hours", "Child safety", "Safeguarding response time set", Number(env.SAFEGUARDING_RESPONSE_HOURS) > 0 && Number(env.SAFEGUARDING_RESPONSE_HOURS) <= 24, set(env.SAFEGUARDING_RESPONSE_HOURS) ? `${env.SAFEGUARDING_RESPONSE_HOURS} hours` : "Not set", "Set SAFEGUARDING_RESPONSE_HOURS (24 or less).");

  add("email", "Email", "Email sending (SMTP)", (env.EMAIL_TRANSPORT ?? "").toLowerCase() === "smtp" && set(env.SMTP_HOST) && set(env.SMTP_USER) && set(env.SMTP_PASS) && EMAIL.test(env.MAIL_FROM?.match(/<([^>]+)>/)?.[1] ?? env.MAIL_FROM ?? ""), env.EMAIL_TRANSPORT ? `EMAIL_TRANSPORT=${env.EMAIL_TRANSPORT}` : "Not set: emails wait in the queue", "Set EMAIL_TRANSPORT=smtp, SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM.");
  add("ops_email", "Email", "Ops and schools inboxes set", EMAIL.test(env.OPS_EMAIL ?? "") && !/example/.test(env.OPS_EMAIL ?? ""), set(env.OPS_EMAIL) ? env.OPS_EMAIL : "Not set", "Set OPS_EMAIL and SCHOOLS_EMAIL.", "warn");

  add("crm", "Leads", "Lead forms reach the CRM", set(env.CRM_WEBHOOK_LEARNER) && set(env.CRM_WEBHOOK_SCHOOL) && set(env.CRM_WEBHOOK_EDUCATOR), set(env.CRM_WEBHOOK_LEARNER) ? "Set" : "Not set: leads are stored in the database only", "Set the three CRM_WEBHOOK_* addresses.", "warn");
  return c;
}

/**
 * Checks that read the database. `q(sql, params)` returns rows. Uses only
 * plain SQL so both the preflight (mysql2) and the app can run it.
 */
export async function dbChecks(q, expectedMigrations = 5) {
  const c = [];
  const add = (id, area, label, ok, detail, fix, severity = "blocker") => c.push({ id, area, label, ok: !!ok, severity, detail, fix });
  const n = async (sql, p = []) => Number((await q(sql, p))[0]?.n ?? 0);

  const migrations = await n("SELECT COUNT(*) AS n FROM schema_migrations");
  add("migrations", "Database", "Database tables are up to date", migrations >= expectedMigrations, `${migrations} of ${expectedMigrations} migrations applied`, "Run npm run migrate.");
  const sample = await n("SELECT COUNT(*) AS n FROM courses WHERE sample = TRUE");
  add("no_sample", "Content", "No sample courses in the database", sample === 0, sample ? `${sample} sample courses` : "None", "Use a fresh production database (sample data is for review builds only).");
  const live = await n("SELECT COUNT(*) AS n FROM courses WHERE published = TRUE AND sample = FALSE");
  const unpriced = await n("SELECT COUNT(*) AS n FROM courses WHERE published = TRUE AND sample = FALSE AND (fee_paise IS NULL OR (fee_paise > 0 AND NOT fee_approved))");
  add("courses", "Content", "Published courses have approved fees", live > 0 && unpriced === 0, `${live} published, ${unpriced} without an approved fee`, "Publish at least one course and approve every fee in Ops.", "warn");
  const ops = await n("SELECT COUNT(*) AS n FROM accounts WHERE role = 'ops'");
  add("ops_account", "People", "At least one ops account", ops > 0, `${ops} ops accounts`, "Sign in once, then set that account's role to ops in the database.");
  const sg = await n("SELECT COUNT(*) AS n FROM accounts WHERE role = 'safeguarding'");
  add("safeguarding_account", "Child safety", "The Safeguarding Lead has an account", sg > 0, `${sg} safeguarding accounts`, "The Safeguarding Lead signs in once; set their role to safeguarding.");
  const failed = await n("SELECT COUNT(*) AS n FROM email_outbox WHERE status = 'failed' AND created_at > UTC_TIMESTAMP(3) - INTERVAL 1 DAY");
  add("email_failures", "Email", "No email failures in the last day", failed === 0, `${failed} failed`, "Open Ops → Email to see why.", "warn");
  const overdue = await n("SELECT COUNT(*) AS n FROM safety_reports WHERE status = 'open' AND respond_by < UTC_TIMESTAMP(3)");
  add("safety_overdue", "Child safety", "No safety reports past their response time", overdue === 0, `${overdue} overdue`, "The Safeguarding Lead must respond now.");
  return c;
}

export function summarise(checks) {
  const blockers = checks.filter((x) => !x.ok && x.severity === "blocker");
  const warnings = checks.filter((x) => !x.ok && x.severity === "warn");
  return { total: checks.length, passed: checks.filter((x) => x.ok).length, blockers, warnings, ready: blockers.length === 0 };
}
