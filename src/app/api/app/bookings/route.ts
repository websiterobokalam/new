import { z } from "zod";
import { body, handler, limit, ok, requireAccount } from "@/lib/api";
import { book } from "@/lib/learn/booking";

export const POST = handler(async (req) => {
  limit(req, "book", 20, 10 * 60_000);
  const a = await requireAccount();
  const b = await body(req, z.object({ learnerId: z.string().uuid(), batchId: z.string().uuid() }));
  return ok(await book(a, b.learnerId, b.batchId));
});
