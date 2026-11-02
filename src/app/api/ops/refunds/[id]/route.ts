import { z } from "zod";
import { body, handler, HttpError, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { system } from "@/lib/db";
import { payRefund } from "@/lib/learn/refunds";

/** Ops decides a refund request. Approve pays it through the gateway. */
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ decision: z.enum(["approve", "reject"]), note: z.string().max(300).optional() }));
  const status = await system(async (c) => {
    const r = await c.query("UPDATE refund_requests SET status = $2, decided_at = now(), decision = decision || $3 WHERE id = $1 AND status = 'requested' RETURNING status", [id, b.decision === "approve" ? "approved" : "rejected", { reviewer_note: b.note ?? null }]);
    if (!r.rows[0]) throw new HttpError(409, "Already decided");
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,$2,'refund',$3,$4)", [a.id, `refund_${b.decision}d`, id, { note: b.note }]);
    return r.rows[0].status;
  });
  if (status === "approved") await payRefund(id);
  return ok();
});
