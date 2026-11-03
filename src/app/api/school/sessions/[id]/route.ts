import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { HttpError } from "@/lib/api";
import { recordSession, requireStaff, trainerSession, istDate } from "@/lib/schools/core";
import { erp } from "@/lib/integrations";

/**
 * Record a class. With 21cschool connected, the trainer ticks names from the
 * live roster; we send the marks to the ERP and keep only the counts.
 */
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({
    status: z.enum(["held", "cancelled"]), presentRefs: z.array(z.string().max(80)).max(80).optional(),
    present: z.coerce.number().int().min(0).max(80).optional(), total: z.coerce.number().int().min(1).max(80).optional(),
    lessonTitle: z.string().trim().max(160).optional(), notes: z.string().trim().max(500).optional(),
  }));
  const s = await requireStaff(a, "trainer", "school_admin");
  const row = await trainerSession(a, id);
  if (!row) throw new HttpError(404, "Not your class");
  let { present, total } = b;
  let receipt: string | undefined;
  if (b.status === "held" && b.presentRefs) {
    if (!s.erpRef || !row.erp_class_ref) throw new HttpError(409, "This class isn't linked to 21cschool. Enter counts instead.");
    const roster = await erp().roster(s.erpRef, row.erp_class_ref);
    const valid = new Set(roster.map((r) => r.ref));
    if (b.presentRefs.some((r) => !valid.has(r))) throw new HttpError(422, "That student isn't on this class roster");
    if (new Date(row.starts_at).getTime() <= Date.now() + 15 * 60_000) {
      receipt = (await erp().submitAttendance(s.erpRef, row.erp_class_ref, istDate(new Date(row.starts_at)), b.presentRefs)).receipt;
    }
    present = b.presentRefs.length;
    total = roster.length;
  }
  await recordSession(a, id, { status: b.status, present, total, lessonTitle: b.lessonTitle, notes: b.notes, erpReceipt: receipt });
  return ok({ receipt: receipt ?? null });
});
