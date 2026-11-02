import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { deliver } from "@/lib/fellows/gigs";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ records: z.array(z.object({ bookingId: z.string().uuid(), attended: z.boolean(), builtProject: z.string().optional(), feedback: z.string().max(500).optional() })).max(30) }));
  await deliver(a, id, b.records);
  return ok();
});
