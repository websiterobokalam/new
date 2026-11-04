import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { Lead, routeFor, maskPhone } from "@/lib/leads";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { system, uuid } from "@/lib/db";
import { leadReceived } from "@/lib/email/notify";

export const runtime = "nodejs";

/**
 * Every enquiry is stored first (so none is lost), acknowledged by email and
 * flagged to the team in the same transaction, then forwarded to a CRM if one
 * is configured.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`lead:${clientIp(req)}`, Number(process.env.LEAD_RATE_LIMIT ?? 8) * Number(process.env.RATE_LIMIT_MULTIPLIER ?? 1), 10 * 60_000);
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
  const name = lead.door === "learner" ? lead.parentName : lead.name;
  const email = "email" in lead ? lead.email ?? null : null;
  const summary = lead.door === "learner" ? `Child ${lead.childAgeBand}, ${lead.interest}, ${lead.mode}, ${lead.language}`
    : lead.door === "school" ? `${lead.institution}, ${lead.city}, ${lead.board}, ${lead.students} students, ${lead.role}, prefers ${lead.preferredTime}`
    : `${lead.college}, ${lead.course} year ${lead.year}, ${lead.city}, ${lead.worlds.join("/")}`;
  try {
    await system(async (c) => {
      await c.query("INSERT INTO leads (id, ref, door, queue, name, phone_e164, email, data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [uuid(), ref, lead.door, queue, name, lead.phone, email, lead]);
      await leadReceived(c, { ref, door: lead.door, queue, name, phone: lead.phone, email, institution: lead.door === "school" ? lead.institution : undefined, summary });
    });
  } catch (e) {
    console.error("lead save failed", { ref, queue, phone: maskPhone(lead.phone), err: (e as Error).message });
    return NextResponse.json({ ok: false, error: "We could not save this right now. Please try again in a minute." }, { status: 502 });
  }

  const hook = process.env[envKey];
  if (hook) {
    const ok = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json", ...(process.env.CRM_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.CRM_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ ref, queue, receivedAt: new Date().toISOString(), lead }),
      signal: AbortSignal.timeout(8000),
    }).then((r) => r.ok).catch(() => false);
    await system((c) => c.query("UPDATE leads SET crm_status = $2 WHERE ref = $1", [ref, ok ? "sent" : "failed"])).catch(() => {});
  }
  console.info("lead", { ref, queue, phone: maskPhone(lead.phone) });
  return NextResponse.json({ ok: true, ref, queue });
}
