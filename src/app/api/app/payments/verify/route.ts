import { z } from "zod";
import { body, handler, HttpError, ok, requireAccount } from "@/lib/api";
import { gateway } from "@/lib/payments";
import { system } from "@/lib/db";
import { markPaid } from "@/lib/learn/booking";

/** Checkout success callback. The webhook confirms the same payment independently. */
export const POST = handler(async (req) => {
  const a = await requireAccount();
  const b = await body(req, z.object({ providerOrderId: z.string(), paymentId: z.string(), signature: z.string() }));
  if (!gateway().verifyCheckout(b.providerOrderId, b.paymentId, b.signature)) throw new HttpError(400, "Payment could not be verified");
  const orderId = await system(async (c) => {
    const o = await c.query("SELECT account_id FROM orders WHERE provider_order_id = $1", [b.providerOrderId]);
    if (o.rows[0]?.account_id !== a.id) throw new HttpError(404, "Order not found");
    return markPaid(c, b.providerOrderId, b.paymentId);
  });
  return ok({ orderId });
});
