import { z } from "zod";
import { body, handler, ok } from "@/lib/api";
import { requireRole } from "@/lib/staff";
import { createGig } from "@/lib/fellows/gigs";
export const POST = handler(async (req) => {
  const a = await requireRole("ops");
  const b = await body(req, z.object({
    kind: z.enum(["live_batch", "campus_session", "weekend_workshop", "doubt_desk", "project_mentor", "build_session", "shadow", "co_teach", "one_to_one"]),
    title: z.string().trim().min(3).max(120), world: z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]), language: z.enum(["en", "te", "hi"]),
    startsAt: z.string().datetime({ offset: true }), durationMin: z.number().int().min(15).max(480), mode: z.enum(["online", "offline"]), city: z.string().trim().min(2),
    location: z.string().trim().max(200).optional(), responsibleAdult: z.string().trim().max(120).optional(), seats: z.number().int().min(1).max(10).optional(),
    minTier: z.enum(["apprentice", "fellow", "senior", "lead"]).optional(), batchId: z.string().uuid().optional(), lessonPlan: z.string().max(4000).optional(), kitList: z.string().max(1000).optional(),
  }));
  return ok({ id: await createGig(a, b) });
});
