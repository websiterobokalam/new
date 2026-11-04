import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { publishCourse, reviewDraft } from "@/lib/market/courses";
export const POST = handler(async (req, ctx) => {
  const a = await requireRole("ops");
  const { id } = await ctx.params;
  const b = await body(req, z.object({ decision: z.enum(["approve", "changes", "reject", "publish"]), note: z.string().trim().max(1000).default("") }));
  if (b.decision === "publish") { await publishCourse(a, id); return ok(); }
  return ok({ courseId: await reviewDraft(a, id, b.decision, b.note) });
});
