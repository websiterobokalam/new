"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";
import { FormError } from "../forms/ui";

type L = { id: string; first_name: string; age_band: string; ready: boolean; fits: boolean };
type Co = { provider: "razorpay" | "mock"; keyId?: string; orderId: string; amount: number; localOrderId: string };

declare global { interface Window { Razorpay?: new (o: object) => { open(): void } } }

function loadRazorpay() {
  return new Promise<void>((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(); s.onerror = () => rej(new Error("Could not load the payment window"));
    document.body.appendChild(s);
  });
}

export function Checkout({ batchId, learners, payLabel, oneToOne, notReadyLabel = "consent needed" }: { batchId: string; learners: L[]; payLabel: string; oneToOne?: string[]; notReadyLabel?: string }) {
  const router = useRouter();
  const [learnerId, setLearnerId] = useState(learners.find((l) => l.ready && l.fits)?.id);
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [acks, setAcks] = useState<boolean[]>(oneToOne?.map(() => false) ?? []);
  const acked = acks.every(Boolean);

  async function go() {
    setBusy(true); setErr(undefined);
    const r = await post<{ status: string; checkout?: Co }>("/api/app/bookings", { learnerId, batchId, oneToOneAck: oneToOne ? acked : undefined });
    if (!r.ok) { setBusy(false); return setErr(r.error); }
    if (r.status === "confirmed" || !r.checkout) return router.push("/app");
    const co = r.checkout;
    if (co.provider === "mock") return router.push(`/app/pay/mock?order=${encodeURIComponent(co.orderId)}&amount=${co.amount}`);
    try {
      await loadRazorpay();
      new window.Razorpay!({
        key: co.keyId, order_id: co.orderId, amount: co.amount, currency: "INR", name: "Robokalam",
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await post("/api/app/payments/verify", { providerOrderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
          if (v.ok) router.push("/app/orders"); else setErr(v.error);
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  return (
    <div className="card grid gap-4 p-6">
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold text-heading">Who is this for?</legend>
        {learners.map((l) => (
          <label key={l.id} className="chip !justify-start">
            <input type="radio" className="sr-only" name="learner" checked={learnerId === l.id} disabled={!l.ready || !l.fits} onChange={() => setLearnerId(l.id)} />
            {l.first_name} · {l.age_band}{!l.fits ? " · different age group" : !l.ready ? ` · ${notReadyLabel}` : ""}
          </label>
        ))}
      </fieldset>
      {oneToOne && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 font-semibold text-heading">Before you book a one-to-one class, please confirm</legend>
          {oneToOne.map((t, i) => (
            <label key={i} className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-navy)]" checked={acks[i]} onChange={(e) => setAcks((a) => a.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span>{t}</span>
            </label>
          ))}
        </fieldset>
      )}
      <FormError msg={err} />
      <button className="btn btn-primary justify-self-start" disabled={!learnerId || busy || (!!oneToOne && !acked)} onClick={go}>{busy ? "…" : payLabel}</button>
    </div>
  );
}
