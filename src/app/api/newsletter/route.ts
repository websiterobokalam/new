import { NextResponse } from "next/server";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { Subscribe, subscribe } from "@/lib/engage";

/** Newsletter sign-up: we email a confirmation link; nobody is subscribed until they click it. */
export async function POST(req: Request) {
  const rl = rateLimit(`newsletter:${clientIp(req)}`, 6 * Number(process.env.RATE_LIMIT_MULTIPLIER ?? 1), 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests. Please try again shortly." }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  if (typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });
  const p = Subscribe.safeParse(body);
  if (!p.success) {
    const fields: Record<string, string> = {};
    for (const i of p.error.issues) fields[i.path.join(".")] ??= i.message;
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields", fields }, { status: 422 });
  }
  await subscribe(p.data);
  return NextResponse.json({ ok: true });
}
