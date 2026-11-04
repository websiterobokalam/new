import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { markEventHeld } from "@/lib/market/ambassadors";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ attendees: z.coerce.number().int().min(0).max(2000) }));
  await markEventHeld(a, (await ctx.params).id, b.attendees);
  return ok();
});
