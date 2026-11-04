import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { system, uuid } from "../db";
import { testProvidersAllowed } from "../providers";

const TTL_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_15_MIN = 3;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production" && !testProvidersAllowed()) throw new Error("SESSION_SECRET is required");
  return s ?? "dev-only-secret";
}
const hashCode = (phone: string, code: string) => createHmac("sha256", secret()).update(`${phone}:${code}`).digest("hex");

export type OtpProvider = { name: string; send(phone: string, code: string): Promise<void> };

function provider(): OtpProvider {
  const p = process.env.OTP_PROVIDER;
  if (p === "msg91") {
    return {
      name: "msg91",
      async send(phone, code) {
        // MSG91 OTP API (template must be DLT-registered).
        const r = await fetch("https://control.msg91.com/api/v5/otp?" + new URLSearchParams({ template_id: process.env.MSG91_TEMPLATE_ID ?? "", mobile: phone.replace("+", ""), otp: code }), {
          method: "POST",
          headers: { authkey: process.env.MSG91_AUTH_KEY ?? "", "content-type": "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) throw new Error(`MSG91 ${r.status}`);
      },
    };
  }
  if (p === "test" && testProvidersAllowed()) return { name: "test", async send() {} };
  if (p === "console" && process.env.NODE_ENV !== "production") return { name: "console", async send(phone, code) { console.info(`[dev otp] ${phone}: ${code}`); } };
  throw new OtpNotConfigured();
}

export class OtpNotConfigured extends Error {}

/** True when sign-in by SMS can send a code (MSG91, or the test/dev providers). */
export function smsLoginAvailable() {
  try { provider(); return true; } catch { return false; }
}
export class OtpRateLimited extends Error {}

export async function sendOtp(phone: string) {
  const prov = provider();
  const code = prov.name === "test" ? "123456" : String(randomInt(0, 1_000_000)).padStart(6, "0");
  await system(async (c) => {
    const { rows } = await c.query("SELECT COUNT(*) AS n FROM otp_challenges WHERE phone_e164 = $1 AND created_at > UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE", [phone]);
    if (rows[0].n >= MAX_SENDS_PER_15_MIN) throw new OtpRateLimited();
    // Only the newest challenge for a phone is valid.
    await c.query("UPDATE otp_challenges SET consumed_at = UTC_TIMESTAMP(3) WHERE phone_e164 = $1 AND consumed_at IS NULL", [phone]);
    await c.query("INSERT INTO otp_challenges (id, phone_e164, code_hash, expires_at) VALUES ($1, $2, $3, $4)", [uuid(), phone, hashCode(phone, code), new Date(Date.now() + TTL_MS)]);
  });
  await prov.send(phone, code);
}

export type VerifyResult = { ok: true } | { ok: false; reason: "expired" | "wrong" | "locked" };

export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  return system(async (c) => {
    const { rows } = await c.query(
      "SELECT id, code_hash, attempts, (expires_at < UTC_TIMESTAMP(3)) AS expired FROM otp_challenges WHERE phone_e164 = $1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE",
      [phone],
    );
    const ch = rows[0];
    if (!ch || ch.expired) return { ok: false, reason: "expired" } as const;
    if (ch.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "locked" } as const;
    const a = Buffer.from(ch.code_hash, "hex");
    const b = Buffer.from(hashCode(phone, String(code).trim()), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      await c.query("UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = $1", [ch.id]);
      return { ok: false, reason: ch.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "wrong" } as const;
    }
    await c.query("UPDATE otp_challenges SET consumed_at = UTC_TIMESTAMP(3) WHERE id = $1", [ch.id]);
    return { ok: true } as const;
  });
}
