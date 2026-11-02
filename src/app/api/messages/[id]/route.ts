import { z } from "zod";
import { body, handler, ok, requireAccount, limit } from "@/lib/api";
import { send } from "@/lib/fellows/community";
export const POST = handler(async (req, ctx) => {
  limit(req, "msg", 60, 10 * 60_000);
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ body: z.string().trim().min(1).max(2000) }));
  return ok(await send(a, id, b.body));
});
