import { z } from "zod";
import { body, handler, HttpError, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
import { getNotice, recordConsents, PURPOSES } from "@/lib/learn/consent";
import { hashIp } from "@/lib/providers";
import { clientIp } from "@/lib/rateLimit";

/** Grant or withdraw one purpose. Withdrawal is as easy as granting. */
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ learnerId: z.string().uuid(), purpose: z.enum(PURPOSES), granted: z.boolean() }));
  await asAccount(a, async (c) => {
    const l = await c.query("SELECT id FROM learners WHERE id = $1 AND guardian_account_id = $2 AND erased_at IS NULL", [b.learnerId, a.id]);
    if (!l.rows[0]) throw new HttpError(404, "Learner not found");
    const notice = await getNotice(c, a.language);
    await recordConsents(c, a.id, b.learnerId, notice, { [b.purpose]: b.granted }, { ipHash: hashIp(clientIp(req)), userAgent: req.headers.get("user-agent") ?? "", declaredAt: new Date().toISOString() });
    if (!b.granted && b.purpose === "portfolio_sharing") await c.query("UPDATE learners SET portfolio_public = false WHERE id = $1 AND guardian_account_id = $2", [b.learnerId, a.id]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,$2,'consent',$3,$4)", [a.id, b.granted ? "consent_granted" : "consent_withdrawn", b.learnerId, { purpose: b.purpose }]);
  });
  return ok();
});
