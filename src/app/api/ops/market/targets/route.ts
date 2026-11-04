import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { setTarget, type MetricId } from "@/lib/market/gate";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ metric: z.enum(["fill_rate", "satisfaction", "safety_rate", "refund_rate", "complaint_rate", "min_sessions"]), target: z.coerce.number().min(0).max(100000), note: z.string().trim().max(300).optional() }));
  await setTarget(a, b.metric as MetricId, b.target, b.note);
  return ok();
});
