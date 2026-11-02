"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client";

export function MockPay({ order, paymentId, signature }: { order: string; paymentId: string; signature: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string>();
  return (
    <div className="grid gap-3">
      <button className="btn btn-primary" onClick={async () => {
        const r = await post("/api/app/payments/verify", { providerOrderId: order, paymentId, signature });
        if (r.ok) router.push("/app/orders"); else setErr(r.error);
      }}>Pay (test)</button>
      <button className="btn btn-ghost" onClick={() => router.push("/app")}>Cancel</button>
      {err && <p role="alert">{err}</p>}
    </div>
  );
}
