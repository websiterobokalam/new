import { NextResponse } from "next/server";
import { phone } from "@/lib/leads";
import { rateLimit, clientIp } from "@/lib/rateLimit";

/**
 * School and Fellow login placeholder: validates and rate-limits, never sends.
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
  // School and Fellow accounts open in Phases 3 and 4. Parents use /api/auth/otp/*.
  return NextResponse.json({ ok: false, notLive: true, error: "These accounts open in a later phase. We have not sent a code." }, { status: 503 });
}
