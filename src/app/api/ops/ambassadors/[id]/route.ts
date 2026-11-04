import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { decideAmbassador } from "@/lib/market/ambassadors";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ to: z.enum(["active", "declined", "paused", "ended"]), note: z.string().trim().max(1000).default("") }));
  await decideAmbassador(a, (await ctx.params).id, b.to, b.note);
  return ok();
});
