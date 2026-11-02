import { z } from "zod";
import { body, handler, ok, requireAccount, limit } from "@/lib/api";
import { respond } from "@/lib/fellows/gigs";
export const POST = handler(async (req, ctx) => {
  limit(req, "gig", 60, 10 * 60_000);
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ action: z.enum(["accept", "decline", "withdraw"]) }));
  return ok(await respond(a, id, b.action));
});
