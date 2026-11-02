import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { review } from "@/lib/fellows/community";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ bookingId: z.string().uuid(), rating: z.number().int().min(1).max(5), body: z.string().trim().max(600).optional() }));
  await review(a, b.bookingId, b.rating, b.body || null);
  return ok();
});
