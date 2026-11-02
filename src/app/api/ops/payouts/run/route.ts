import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { runPayouts } from "@/lib/fellows/earnings";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }));
  return ok({ payouts: await runPayouts(a, b.periodEnd) });
});
