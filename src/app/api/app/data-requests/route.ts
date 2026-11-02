import { z } from "zod";
import { body, handler, HttpError, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";

/**
 * Erasure request. The learner is hidden immediately and their consents
 * withdrawn; ops completes erasure, keeping only records the law requires
 * (for example tax invoices).
 */
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ kind: z.literal("erase"), learnerId: z.string().uuid(), confirmName: z.string().trim() }));
  await asAccount(a, async (c) => {
    const l = await c.query("SELECT first_name FROM learners WHERE id = $1 AND erased_at IS NULL", [b.learnerId]);
    if (!l.rows[0]) throw new HttpError(404, "Learner not found");
    if (l.rows[0].first_name.toLowerCase() !== b.confirmName.toLowerCase()) throw new HttpError(422, "The name does not match", { fields: { confirmName: "Type the learner's first name exactly" } });
    await c.query("INSERT INTO data_requests (account_id, learner_id, kind) VALUES ($1,$2,'erase')", [a.id, b.learnerId]);
    await c.query("UPDATE learners SET erased_at = now(), first_name = 'Deleted', interests = '{}', portfolio_public = false WHERE id = $1", [b.learnerId]);
    await c.query("UPDATE bookings SET status = 'cancelled' WHERE learner_id = $1 AND status IN ('confirmed','pending_payment')", [b.learnerId]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id) VALUES ($1,'erasure_requested','learner',$2)", [a.id, b.learnerId]);
  });
  return ok();
});
