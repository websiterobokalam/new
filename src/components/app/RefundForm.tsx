"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";
import type { Dict } from "@/i18n/en";

export function RefundForm({ orderId, t }: { orderId: string; t: Dict }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  if (!open) return <button type="button" className="btn btn-ghost !min-h-10 text-sm" onClick={() => setOpen(true)}>{t.request_refund}</button>;
  return (
    <form className="grid w-full gap-2" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const r = await post<{ decision: { explanation: string; auto: boolean } }>("/api/app/refunds", { orderId, reason });
      setBusy(false);
      if (!r.ok) return setMsg(r.fields?.reason ?? r.error);
      setMsg(r.decision.explanation + (r.decision.auto ? " Refund sent." : " Our team will review it; you will see the decision here."));
      router.refresh();
    }}>
      <label className="field"><span>{t.refund_reason}</span><textarea className="input min-h-20" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></label>
      {msg && <p role="status" className="text-sm font-semibold">{msg}</p>}
      <button className="btn btn-primary justify-self-start" disabled={busy || reason.trim().length < 3}>{t.refund_send}</button>
    </form>
  );
}
