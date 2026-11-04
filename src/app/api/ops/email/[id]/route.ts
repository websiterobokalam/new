import { handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { retry } from "@/lib/email/outbox";

export const POST = handler(async (_req, ctx) => {
  await requireRole("ops");
  await retry((await ctx.params).id);
  return ok();
});
