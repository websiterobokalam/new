import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { mockSign } from "@/lib/payments";
import { testProvidersAllowed } from "@/lib/providers";
import { inr } from "@/lib/money";
import { MockPay } from "@/components/app/MockPay";
import { randomBytes } from "node:crypto";

export const metadata = { title: "Test payment" };

/** Test-only payment screen. 404s unless test providers are explicitly allowed. */
export default async function MockPayPage({ searchParams }: { searchParams: Promise<{ order?: string; amount?: string }> }) {
  if (!(testProvidersAllowed() || process.env.NODE_ENV !== "production") || process.env.PAYMENT_PROVIDER !== "mock") notFound();
  await appContext("/app/orders");
  const { order, amount } = await searchParams;
  if (!order) notFound();
  const paymentId = `mock_pay_${randomBytes(6).toString("hex")}`;
  return (
    <section className="py-16">
      <div className="wrap max-w-md">
        <div className="card grid gap-4 p-6">
          <p className="rounded-lg bg-[#fff4cc] px-3 py-2 text-sm font-semibold text-[#5c4500]">Test payment screen. No real money moves.</p>
          <h1 className="text-2xl font-bold">Pay {inr(Number(amount ?? 0))}</h1>
          <MockPay order={order} paymentId={paymentId} signature={mockSign(order, paymentId)} />
        </div>
      </div>
    </section>
  );
}
