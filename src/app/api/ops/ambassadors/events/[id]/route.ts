import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { decideEvent } from "@/lib/market/ambassadors";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ to: z.enum(["approved", "declined"]), note: z.string().trim().max(1000).default("") }));
  await decideEvent(a, (await ctx.params).id, b.to, b.note);
  return ok();
});
