import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { scheduleRun } from "@/lib/market/courses";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ startsAt: z.string().datetime({ offset: true }), language: z.enum(["en", "te", "hi"]) }));
  return ok({ batchId: await scheduleRun(a, (await ctx.params).id, b) });
});
