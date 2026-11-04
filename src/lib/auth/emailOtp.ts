import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { system, uuid } from "../db";
import { testProvidersAllowed } from "../providers";
import { render } from "../email/templates";
import { transport } from "../email/transport";

/**
 * Email sign-in codes: the default at every door. Same rules as SMS codes: 6
 * digits, 10 minutes, one use, 5 tries, 3 codes per 15 minutes per address.
 * Only a keyed hash is stored. The code is sent straight away (never written
 * to the outbox), so it's never sitting in the database in plain text.
 */
const TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_15_MIN = 3;

/** One normalised form of an email address: trimmed, lower-case, checked. */
export const loginEmail = z
  .string({ error: "Enter your email address" })
  .trim()
  .toLowerCase()
  .max(160, "That email is too long")
  .email("Enter a valid email address, like name@example.com")
  .refine((e) => !/\.\./.test(e), "Enter a valid email address, like name@example.com")
  .refine((e) => testProvidersAllowed() || !/@(example\.(com|org|net)|mailinator\.com)$/.test(e), "Use an email address you can open");

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production" && !testProvidersAllowed()) throw new Error("SESSION_SECRET is required");
  return s ?? "dev-only-secret";
}
const hashCode = (email: string, code: string) => createHmac("sha256", secret()).update(`email:${email}:${code}`).digest("hex");

export class EmailLoginNotConfigured extends Error {}
export class EmailOtpRateLimited extends Error {}

/** Test servers use a fixed code; everywhere else a random one. */
const fixedTestCode = () => testProvidersAllowed() && (process.env.EMAIL_TRANSPORT ?? "").toLowerCase() === "test";

export function emailLoginAvailable() {
  return !!transport();
}

export async function sendEmailOtp(email: string) {
  const t = transport();
  if (!t) throw new EmailLoginNotConfigured();
  const code = fixedTestCode() ? "123456" : String(randomInt(0, 1_000_000)).padStart(6, "0");
  await system(async (c) => {
    const { rows } = await c.query("SELECT COUNT(*) AS n FROM email_otp_challenges WHERE email = $1 AND created_at > UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE", [email]);
    if (Number(rows[0].n) >= MAX_SENDS_PER_15_MIN) throw new EmailOtpRateLimited();
    // Only the newest code for an address works.
    await c.query("UPDATE email_otp_challenges SET consumed_at = UTC_TIMESTAMP(3) WHERE email = $1 AND consumed_at IS NULL", [email]);
    await c.query("INSERT INTO email_otp_challenges (id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)", [uuid(), email, hashCode(email, code), new Date(Date.now() + TTL_MS)]);
  });
  const m = render("login_code", { code });
  await t.send({ to: email, subject: m.subject, html: m.html, text: m.text, headers: { "X-Robokalam-Template": "login_code" } });
}

export type EmailVerifyResult = { ok: true } | { ok: false; reason: "expired" | "wrong" | "locked" };

export async function verifyEmailOtp(email: string, code: string): Promise<EmailVerifyResult> {
  return system(async (c) => {
    const { rows } = await c.query(
      "SELECT id, code_hash, attempts, (expires_at < UTC_TIMESTAMP(3)) AS expired FROM email_otp_challenges WHERE email = $1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
      [email],
    );
    const ch = rows[0];
    if (!ch || ch.expired) return { ok: false, reason: "expired" } as const;
    if (ch.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" } as const;
    const a = Buffer.from(ch.code_hash, "hex");
    const b = Buffer.from(hashCode(email, String(code).trim()), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await c.query("UPDATE email_otp_challenges SET attempts = attempts + 1 WHERE id = $1", [ch.id]);
      return { ok: false, reason: ch.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "wrong" } as const;
    }
    await c.query("UPDATE email_otp_challenges SET consumed_at = UTC_TIMESTAMP(3) WHERE id = $1", [ch.id]);
    return { ok: true } as const;
  });
}
