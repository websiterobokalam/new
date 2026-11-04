import { z } from "zod";
import { body, handler, HttpError, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
import { uuid } from "@/lib/db";
import { dataRequested } from "@/lib/email/notify";

/**
 * Erasure request. The learner is hidden immediately and their consents
 * withdrawn; ops completes erasure, keeping only records the law requires
 * (for example tax invoices).
 */
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ kind: z.literal("erase"), learnerId: z.string().uuid(), confirmName: z.string().trim() }));
  await asAccount(a, async (c) => {
    const l = await c.query("SELECT first_name FROM learners WHERE id = $1 AND guardian_account_id = $2 AND erased_at IS NULL", [b.learnerId, a.id]);
    if (!l.rows[0]) throw new HttpError(404, "Learner not found");
    if (l.rows[0].first_name.toLowerCase() !== b.confirmName.toLowerCase()) throw new HttpError(422, "The name does not match", { fields: { confirmName: "Type the learner's first name exactly" } });
    const rid = uuid();
    await c.query("INSERT INTO data_requests (id, account_id, learner_id, kind) VALUES ($1,$2,$3,'erase')", [rid, a.id, b.learnerId]);
    await dataRequested(c, a.id, "deletion", rid);
    await c.query("UPDATE learners SET erased_at = now(), first_name = 'Deleted', interests = '[]', portfolio_public = false WHERE id = $1 AND guardian_account_id = $2", [b.learnerId, a.id]);
    await c.query("UPDATE bookings SET status = 'cancelled' WHERE learner_id = $1 AND guardian_account_id = $2 AND status IN ('confirmed','pending_payment')", [b.learnerId, a.id]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'erasure_requested','learner',$2)", [a.id, b.learnerId]);
  });
  return ok();
});
