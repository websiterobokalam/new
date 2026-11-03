import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { requestFellow } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({
    labId: z.string().uuid(), world: z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]), language: z.enum(["en", "te", "hi"]), startsAt: z.string().datetime({ offset: true }),
    durationMin: z.coerce.number().int().min(30).max(240), gradeBand: z.string().trim().min(1).max(20), students: z.coerce.number().int().min(1).max(80),
    responsibleStaffId: z.string().uuid({ message: "Choose who will be in the room" }), notes: z.string().trim().max(1000).optional(),
  }));
  return ok({ id: await requestFellow(a, b) });
});
