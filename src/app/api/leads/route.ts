import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Lead, routeFor, maskPhone } from "@/lib/leads";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = rateLimit(`lead:${clientIp(req)}`, Number(process.env.LEAD_RATE_LIMIT ?? 8), 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (typeof body.website === "string" && body.website.length > 0) return NextResponse.json({ ok: true, ref: "RK-OK" });
  delete body.website;

  const parsed = Lead.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields", fields }, { status: 422 });
  }

  const lead = parsed.data;
  const { queue, envKey } = routeFor(lead);
  const ref = `RK-${randomUUID().slice(0, 8).toUpperCase()}`;
  const record = { ref, queue, receivedAt: new Date().toISOString(), lead };

  const hook = process.env[envKey];
  try {
    if (hook) {
      const r = await fetch(hook, {
        method: "POST",
        headers: { "content-type": "application/json", ...(process.env.CRM_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.CRM_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`CRM ${r.status}`);
    } else if (process.env.NODE_ENV !== "production" || process.env.LEADS_LOCAL_FILE === "1") {
      // Local development store. Never used in production unless explicitly enabled.
      await mkdir(".data", { recursive: true });
      await appendFile(".data/leads.ndjson", JSON.stringify(record) + "\n");
    } else {
      throw new Error(`No CRM webhook configured for ${queue}`);
    }
  } catch (e) {
    console.error("lead delivery failed", { ref, queue, phone: maskPhone(lead.phone), err: (e as Error).message });
    return NextResponse.json({ ok: false, error: "We could not save this right now. Please try again in a minute." }, { status: 502 });
  }
  console.info("lead", { ref, queue, phone: maskPhone(lead.phone) });
  return NextResponse.json({ ok: true, ref, queue });
}
