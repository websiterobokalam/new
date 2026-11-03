import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireAccount } from "@/lib/api";
import { assignTrainer } from "@/lib/schools/core";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ classId: z.string().uuid(), trainerId: z.string().uuid().or(z.literal("")) }));
  await assignTrainer(a, b.classId, b.trainerId || null);
  return ok();
});
