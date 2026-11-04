import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { addCollege } from "@/lib/market/cities";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({ name: z.string().trim().min(3).max(160), city: z.string().trim().min(2).max(60), emailDomain: z.string().trim().regex(/^@?[a-z0-9.-]+\.[a-z]{2,}$/i, "For example college.edu.in").optional() }));
  return ok({ id: await addCollege(a, b) });
});
