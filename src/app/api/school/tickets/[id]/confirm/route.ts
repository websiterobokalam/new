import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { confirmTicket } from "@/lib/schools/core";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ fixed: z.enum(["yes", "no"]).or(z.boolean()), note: z.string().trim().max(500).optional() }));
  await confirmTicket(a, id, b.fixed === true || b.fixed === "yes", b.note);
  return ok();
});
