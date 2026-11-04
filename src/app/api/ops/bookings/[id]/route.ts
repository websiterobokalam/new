import { z } from "zod";
import { body, handler, HttpError, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { system } from "@/lib/db";
import { sessionDelivered } from "@/lib/email/notify";

/**
 * Record what happened in a session: attendance, plain feedback, next step,
 * and any project the learner built. Trainers and Fellows get their own
 * screens in Phases 3 and 4; until then ops records it.
 */
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops", "trainer");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ status: z.enum(["attended", "no_show"]), feedback: z.string().max(1000).optional(), nextStep: z.string().max(300).optional(), builtProject: z.string().optional() }));
  await system(async (c) => {
    const r = await c.query("SELECT learner_id FROM bookings WHERE id = $1 AND status = 'confirmed' FOR UPDATE", [id]);
    if (!r.rows[0]) throw new HttpError(409, "Booking is not open");
    await c.query("UPDATE bookings SET status = $2, feedback = $3, next_step = $4 WHERE id = $1", [id, b.status, b.feedback ?? null, b.nextStep ?? null]);
    if (b.builtProject) {
      await c.query("INSERT INTO learner_progress (learner_id, project_id, status, reviewed_by, completed_at) VALUES ($1,$2,'built',$3, now()) ON DUPLICATE KEY UPDATE status = 'built', reviewed_by = VALUES(reviewed_by), completed_at = now()", [r.rows[0].learner_id, b.builtProject, a.id]);
    }
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'session_recorded','booking',$2,$3)", [a.id, id, { status: b.status, built: b.builtProject ?? null }]);
    const built = b.builtProject ? (await c.query("SELECT title FROM projects WHERE id = $1", [b.builtProject])).rows[0]?.title ?? null : null;
    await sessionDelivered(c, `ops-${id}`, [{ bookingId: id, attended: b.status === "attended", built, feedback: b.feedback ?? null }]);
  });
  return ok();
});
