import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { addClass } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({
    labId: z.string().uuid(), label: z.string().trim().min(1).max(40), grade: z.coerce.number().int().min(1).max(12), world: z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]),
    weekday: z.coerce.number().int().min(1).max(7), startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM, 24-hour"),
    durationMin: z.coerce.number().int().min(15).max(240), students: z.coerce.number().int().min(1).max(80),
    trainerId: z.string().uuid().optional(), erpClassRef: z.string().trim().max(80).optional(),
  }));
  return ok({ id: await addClass(a, b) });
});
