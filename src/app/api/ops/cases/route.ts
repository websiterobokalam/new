import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { openRemovalCase } from "@/lib/fellows/community";
export const POST = handler(async (req) => {
  const a = await requireRole("ops", "safeguarding");
  const b = await body(req, z.object({ fellowId: z.string().uuid(), reasons: z.string().trim().min(20, "Write the reasons in full (20+ characters)").max(4000), childSafety: z.boolean().default(false) }));
  return ok(await openRemovalCase(a, b.fellowId, b.reasons, b.childSafety));
});
