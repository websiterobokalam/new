import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ body: z.string().trim().min(1).max(4000) }));
  await asAccount(a, (c) => c.query("INSERT INTO removal_responses (case_id, fellow_id, body) VALUES ($1,$2,$3)", [id, a.id, b.body]));
  return ok();
});
