import { gateway } from "@/lib/payments";
import { system } from "@/lib/db";
import { markPaid } from "@/lib/learn/booking";
import { fail, handler, ok } from "@/lib/api";

/** Razorpay webhook: payment.captured / order.paid. Signature-checked and idempotent. */
export const POST = handler(async (req) => {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!gateway().verifyWebhook(raw, sig)) return fail(400, "bad signature");
  const evt = JSON.parse(raw);
  const pay = evt?.payload?.payment?.entity;
  if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay?.order_id && pay?.id) {
    await system((c) => markPaid(c, pay.order_id, pay.id));
  }
  return ok();
});
