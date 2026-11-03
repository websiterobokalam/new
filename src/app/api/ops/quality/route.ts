import { z } from "zod";
import { body, handler, ok, HttpError } from "@/lib/api";
import { canObserve } from "@/lib/schools/core";
import { requireRole } from "@/lib/staff";
import { system, uuid } from "@/lib/db";

/** A second Fellow or trainer observes a sample of classes and scores them on the rubric. */
const score = z.coerce.number().int().min(1).max(4);
export const POST = handler(async (req) => {
  const a = await requireRole("ops", "trainer");
  const b = await body(req, z.object({ assignmentId: z.string().uuid(), kind: z.enum(["observation", "recording_sample"]), prep: score, clarity: score, engagement: score, safety: score, outcome: score, notes: z.string().max(1000).optional() }));
  // Trainers may observe only Fellow sessions delivered at their own school.
  if (a.role === "trainer" && !(await canObserve(a, b.assignmentId))) throw new HttpError(403, "Not allowed");
  await system(async (c) => {
    await c.query("INSERT INTO quality_reviews (id, assignment_id, reviewer_account_id, kind, rubric, notes) VALUES ($6,$1,$2,$3,$4,$5)", [b.assignmentId, a.id, b.kind, { prep: b.prep, clarity: b.clarity, engagement: b.engagement, safety: b.safety, outcome: b.outcome }, b.notes ?? null, uuid()]);
  });
  return ok();
});
