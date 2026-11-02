import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { asAccount } from "@/lib/auth/session";
import { uuid } from "@/lib/db";
import { HttpError } from "@/lib/api";
export const POST = handler(async (req, ctx) => {
  const a = await requireAccount();
  const { id } = await ctx.params;
  const b = await body(req, z.object({ body: z.string().trim().min(1).max(4000) }));
  await asAccount(a, async (c) => {
    // Only the Fellow the case is about can respond to it.
    const k = (await c.query("SELECT id FROM removal_cases WHERE id = $1 AND fellow_id = $2", [id, a.id])).rows[0];
    if (!k) throw new HttpError(404, "Case not found");
    await c.query("INSERT INTO removal_responses (id, case_id, fellow_id, body) VALUES ($1,$2,$3,$4)", [uuid(), id, a.id, b.body]);
  });
  return ok();
});
