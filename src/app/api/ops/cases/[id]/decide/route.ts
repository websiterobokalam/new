import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { decideRemovalCase } from "@/lib/fellows/community";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops", "safeguarding");
  const b = await body(req, z.object({ decision: z.enum(["removed", "reinstated"]), enquiryNotes: z.string().trim().min(10).max(4000) }));
  await decideRemovalCase(a, (await ctx.params).id, b.decision, b.enquiryNotes);
  return ok();
});
