import { z } from "zod";
import { body, handler, limit, ok, requireAccount } from "@/lib/api";
import { requestRefund } from "@/lib/learn/refunds";

export const POST = handler(async (req) => {
  limit(req, "refund", 10, 60 * 60_000);
  const a = await requireAccount();
  const b = await body(req, z.object({ orderId: z.string().uuid(), reason: z.string().trim().min(3, "Tell us briefly why").max(500) }));
  return ok(await requestRefund(a, b.orderId, b.reason));
});
