import { z } from "zod";
import { body, handler, limit, ok } from "@/lib/api";
import { currentAccount } from "@/lib/auth/session";
import { tx, uuid } from "@/lib/db";

/** Target response time for the Safeguarding Lead. Placeholder until the named Lead confirms it. */
const RESPOND_HOURS = Number(process.env.SAFEGUARDING_RESPONSE_HOURS ?? 24);

export const POST = handler(async (req) => {
  limit(req, "report", 10, 60 * 60_000);
  const a = await currentAccount();
  const b = await body(req, z.object({
    page: z.string().max(200),
    category: z.enum(["safety", "contact_details", "inappropriate", "bullying", "technical", "other"]),
    details: z.string().trim().min(1, "Tell us what happened").max(2000),
    learnerId: z.string().uuid().optional(),
  }));
  const r = await tx({ accountId: a?.id, role: a?.role }, async (c) => {
    // A learner id is only recorded if it belongs to the reporter.
    const learnerId = b.learnerId && a ? ((await c.query("SELECT id FROM learners WHERE id = $1 AND guardian_account_id = $2", [b.learnerId, a.id])).rows[0]?.id ?? null) : null;
    const rows = [{ id: uuid(), respond_by: new Date(Date.now() + RESPOND_HOURS * 3600_000) }];
    await c.query(
      "INSERT INTO safety_reports (id, reporter_account_id, learner_id, page, category, details, respond_by) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [rows[0].id, a?.id ?? null, learnerId, b.page, b.category, b.details, rows[0].respond_by],
    );
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'safety_report','safety_report',$2,$3)", [a?.id ?? null, rows[0].id, { category: b.category }]);
    return rows[0];
  });
  // Phase 2: alert channel for the Safeguarding Lead (email/WhatsApp) is configured with their contact.
  if (process.env.SAFEGUARDING_WEBHOOK) await fetch(process.env.SAFEGUARDING_WEBHOOK, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, category: b.category }) }).catch(() => {});
  return ok({ id: r.id, respondBy: r.respond_by });
});
