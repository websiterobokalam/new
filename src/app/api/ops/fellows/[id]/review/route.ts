import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { reviewStep, STEPS } from "@/lib/fellows/core";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ step: z.enum(STEPS), outcome: z.enum(["passed", "failed"]), note: z.string().trim().min(2).max(500), vendorRef: z.string().max(100).optional() }));
  await reviewStep(a, id, b.step, b.outcome, b.note, b.vendorRef);
  return ok();
});
