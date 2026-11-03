import { z } from "zod";
import { body, handler, ok, HttpError } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { declineRequest, scheduleRequest } from "@/lib/schools/core";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ action: z.enum(["schedule", "decline"]), minTier: z.enum(["apprentice", "fellow", "senior", "lead"]).optional(), lessonPlan: z.string().max(4000).optional(), kitList: z.string().max(1000).optional(), note: z.string().trim().max(500).optional() }));
  if (b.action === "decline") {
    if (!b.note || b.note.length < 5) throw new HttpError(422, "Give the school a reason", { fields: { note: "Required" } });
    await declineRequest(a, id, b.note);
    return ok();
  }
  return ok({ gigId: await scheduleRequest(a, id, b) });
});
