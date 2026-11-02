import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { system } from "@/lib/db";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ status: z.enum(["committee", "resolved"]), resolution: z.string().max(2000).optional() }));
  const id = (await ctx.params).id;
  await system(async (c) => {
    await c.query("UPDATE disputes SET status = $2, resolution = coalesce($3, resolution), updated_at = now() WHERE id = $1", [id, b.status, b.resolution ?? null]);
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'dispute_update','dispute',$2,$3)", [a.id, id, b]);
  });
  return ok();
});
