import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { testProvidersAllowed } from "../providers";

/**
 * Payment gateway adapter. Razorpay in production (UPI, cards, netbanking).
 * "mock" exists only for tests and review builds and is refused otherwise.
 */
export type CheckoutPayload = { provider: "razorpay" | "mock"; keyId?: string; orderId: string; amount: number; currency: "INR" };

export interface Gateway {
  name: "razorpay" | "mock";
  createOrder(amountPaise: number, receipt: string, notes: Record<string, string>): Promise<{ orderId: string }>;
  verifyCheckout(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhook(rawBody: string, signature: string): boolean;
  refund(paymentId: string, amountPaise: number, notes: Record<string, string>): Promise<{ refundId: string }>;
  checkout(orderId: string, amount: number): CheckoutPayload;
}

const hmac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest("hex");
function safeEq(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function razorpay(): Gateway {
  const keyId = process.env.RAZORPAY_KEY_ID!, secret = process.env.RAZORPAY_KEY_SECRET!, hook = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  const auth = "Basic " + Buffer.from(`${keyId}:${secret}`).toString("base64");
  async function call(path: string, body: unknown) {
    const r = await fetch(`https://api.razorpay.com/v1${path}`, { method: "POST", headers: { authorization: auth, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
    const j = await r.json();
    if (!r.ok) throw new Error(`Razorpay ${r.status}: ${j?.error?.description ?? "error"}`);
    return j;
  }
  return {
    name: "razorpay",
    async createOrder(amount, receipt, notes) {
      const j = await call("/orders", { amount, currency: "INR", receipt, notes });
      return { orderId: j.id };
    },
    verifyCheckout: (o, p, s) => safeEq(hmac(secret, `${o}|${p}`), s),
    verifyWebhook: (raw, s) => !!hook && safeEq(hmac(hook, raw), s),
    async refund(paymentId, amount, notes) {
      const j = await call(`/payments/${paymentId}/refund`, { amount, notes, speed: "normal" });
      return { refundId: j.id };
    },
    checkout: (orderId, amount) => ({ provider: "razorpay", keyId, orderId, amount, currency: "INR" }),
  };
}

function mock(): Gateway {
  const secret = process.env.SESSION_SECRET ?? "dev-only-secret";
  return {
    name: "mock",
    async createOrder() { return { orderId: `mock_order_${randomBytes(8).toString("hex")}` }; },
    verifyCheckout: (o, p, s) => safeEq(hmac(secret, `${o}|${p}`), s),
    verifyWebhook: (raw, s) => safeEq(hmac(secret, raw), s),
    async refund() { return { refundId: `mock_rfnd_${randomBytes(6).toString("hex")}` }; },
    checkout: (orderId, amount) => ({ provider: "mock", orderId, amount, currency: "INR" }),
  };
}

export class PaymentsNotConfigured extends Error {}

export function gateway(): Gateway {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return razorpay();
  if (process.env.PAYMENT_PROVIDER === "mock" && (testProvidersAllowed() || process.env.NODE_ENV !== "production")) return mock();
  throw new PaymentsNotConfigured("Payments are not configured");
}

/** Used only by the mock checkout page to sign a simulated payment. */
export function mockSign(orderId: string, paymentId: string) {
  if (!(testProvidersAllowed() || process.env.NODE_ENV !== "production")) throw new Error("mock payments disabled");
  return hmac(process.env.SESSION_SECRET ?? "dev-only-secret", `${orderId}|${paymentId}`);
}
