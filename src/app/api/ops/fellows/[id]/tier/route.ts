import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { system } from "@/lib/db";
/** A person confirms tier changes; the formula only suggests. */
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ tier: z.enum(["apprentice", "fellow", "senior", "lead"]), note: z.string().min(2).max(300) }));
  await system(async (c) => {
    await c.query("UPDATE fellows SET tier = $2 WHERE account_id = $1", [id, b.tier]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'tier_set','fellow',$2,$3)", [a.id, id, b]);
  });
  return ok();
});
