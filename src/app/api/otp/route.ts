import { NextResponse } from "next/server";
import { phone } from "@/lib/leads";
import { rateLimit, clientIp } from "@/lib/rateLimit";

/**
 * OTP send. Phase 1: rate limiting and validation are live; sending is not.
 * Phase 2 wires MSG91 (or equivalent) behind OTP_PROVIDER.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  const p = phone.safeParse(body?.phone);
  if (!p.success) return NextResponse.json({ ok: false, error: "Enter a valid mobile number" }, { status: 422 });
  // Per IP and per number limits.
  const a = rateLimit(`otp-ip:${ip}`, 5, 15 * 60_000);
  const b = rateLimit(`otp-ph:${p.data}`, 3, 15 * 60_000);
  if (!a.ok || !b.ok) return NextResponse.json({ ok: false, error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  if (!process.env.OTP_PROVIDER) {
    return NextResponse.json({ ok: false, notLive: true, error: "Accounts open in Phase 2. We have not sent a code." }, { status: 503 });
  }
  return NextResponse.json({ ok: false, error: "OTP provider not wired yet" }, { status: 501 });
}
