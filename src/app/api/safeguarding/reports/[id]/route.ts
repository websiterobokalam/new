import { z } from "zod";
import { body, handler, HttpError, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { asAccount } from "@/lib/auth/session";

export const POST = handler(async (req, ctx) => {
  const a = await requireRole("safeguarding");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ status: z.enum(["acknowledged", "actioned", "closed"]), note: z.string().max(1000).optional() }));
  await asAccount(a, async (c) => {
    const r = await c.query("UPDATE safety_reports SET status = $2 WHERE id = $1 RETURNING id", [id, b.status]);
    if (!r.rows[0]) throw new HttpError(404, "Report not found");
    await c.query("INSERT INTO audit_log (actor_account_id, action, entity, entity_id, meta) VALUES ($1,'report_status','safety_report',$2,$3)", [a.id, id, b]);
  });
  return ok();
});
