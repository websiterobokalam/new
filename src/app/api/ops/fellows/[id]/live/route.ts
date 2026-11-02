import { handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { goLive } from "@/lib/fellows/core";
export const POST = handler(async (_req, ctx) => {
  const a = await requireRole("ops");
  await goLive(a, (await ctx.params).id);
  return ok();
});
