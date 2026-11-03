import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { opsTicketAction } from "@/lib/schools/core";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ to: z.enum(["acknowledged", "dispatched", "resolved"]), note: z.string().trim().max(500).default("") }));
  await opsTicketAction(a, (await ctx.params).id, b.to, b.note);
  return ok();
});
