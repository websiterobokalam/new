import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { markPayoutPaid } from "@/lib/fellows/earnings";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ bankRef: z.string().trim().min(3).max(80) }));
  await markPayoutPaid(a, (await ctx.params).id, b.bankRef);
  return ok();
});
