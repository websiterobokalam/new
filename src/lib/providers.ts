import { createHash } from "node:crypto";

/**
 * Test providers (fixed OTP, mock payments) run only when explicitly allowed.
 * Never set ALLOW_TEST_PROVIDERS in production.
 */
export function testProvidersAllowed() {
  return process.env.ALLOW_TEST_PROVIDERS === "1";
}

/** Store a salted hash, never the raw IP. */
export function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.SESSION_SECRET ?? "dev"}:${ip}`).digest("hex").slice(0, 32);
}
