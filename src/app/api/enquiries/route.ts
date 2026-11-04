import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { Enquiry, submitEnquiry } from "@/lib/engage";

/** The contact form. Stored first, acknowledged by email, routed to the right team inbox. */
export async function POST(req: Request) {
  const rl = rateLimit(`enquiry:${clientIp(req)}`, 5 * Number(process.env.RATE_LIMIT_MULTIPLIER ?? 1), 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many messages. Please try again shortly." }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true, ref: "RK-OK" });
  const p = Enquiry.safeParse(body);
  if (!p.success) {
    const fields: Record<string, string> = {};
    for (const i of p.error.issues) fields[i.path.join(".")] ??= i.message;
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields", fields }, { status: 422 });
  }
  return NextResponse.json({ ok: true, ref: await submitEnquiry(p.data) });
}
