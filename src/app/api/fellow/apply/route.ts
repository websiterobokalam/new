import { z } from "zod";
import { body, handler, ok, requireAccount, limit } from "@/lib/api";
import { apply } from "@/lib/fellows/core";

const W = z.enum(["robotics", "iot", "ai", "finlit", "space", "coding"]);
export const POST = handler(async (req) => {
  limit(req, "fellow-apply", 10, 60 * 60_000);
  const a = await requireAccount();
  const b = await body(req, z.object({
    fullName: z.string().trim().min(2).max(80), college: z.string().trim().min(2).max(120), course: z.string().trim().min(2).max(80),
    year: z.enum(["1", "2", "3", "4", "5", "PG", "Graduated"]), collegeEmail: z.string().trim().email().optional().or(z.literal("")),
    worlds: z.array(W).min(1, "Pick at least one world"), languages: z.array(z.enum(["en", "te", "hi"])).min(1),
    hoursPerWeek: z.coerce.number().int().min(1).max(40), city: z.string().trim().min(2).max(60),
    ageConfirmed: z.literal(true, { message: "Kalam Fellows must be 18 or older" }),
  }));
  return ok(await apply(a, b));
});
