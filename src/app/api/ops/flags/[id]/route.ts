import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { decideFlag } from "@/lib/quality/flags";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ status: z.enum(["dismissed", "actioned"]), note: z.string().trim().max(1000).default("") }));
  await decideFlag(a, (await ctx.params).id, b.status, b.note);
  return ok();
});
