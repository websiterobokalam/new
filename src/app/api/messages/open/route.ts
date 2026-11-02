import { z } from "zod";
import { body, handler, ok, requireAccount } from "@/lib/api";
import { openThread } from "@/lib/fellows/community";
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ bookingId: z.string().uuid() }));
  return ok({ threadId: await openThread(a, b.bookingId) });
});
