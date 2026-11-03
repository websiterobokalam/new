import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { addLab } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ schoolId: z.string().uuid(), name: z.string().trim().min(2).max(80), room: z.string().trim().max(80).optional(), installedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }));
  return ok({ id: await addLab(a, b.schoolId, b) });
});
