"use client";
import { useState } from "react";
import { post } from "./client";
import { Field, FormError, Check } from "../forms/ui";

/** Phone OTP sign-in. Calls onDone after the session cookie is set. */
export function OtpFlow({ onDone, askAdult = true, cta = "Send code", phoneLabel = "Parent's mobile number" }: { onDone: () => void; askAdult?: boolean; cta?: string; phoneLabel?: string }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [adult, setAdult] = useState(false);
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [sentTo, setSentTo] = useState("");

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setErr(undefined);
    const r = await post<{ sentTo: string }>("/api/auth/otp/send", { phone });
    setBusy(false);
    if (!r.ok) return setErr(r.fields?.phone ?? r.error);
    setSentTo(r.sentTo); setStage("code");
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (askAdult && !adult) return setErr("Please confirm you are 18 or older and the child's parent or guardian.");
    setBusy(true); setErr(undefined);
    const region = document.cookie.match(/(?:^|; )rk_region=([^;]+)/)?.[1];
    const r = await post("/api/auth/otp/verify", { phone, code, adultDeclared: adult, region });
    setBusy(false);
    if (!r.ok) return setErr(r.fields?.code ?? r.error);
    onDone();
  }

  return stage === "phone" ? (
    <form onSubmit={send} className="grid gap-4" noValidate>
      <Field label={phoneLabel} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxxxxx10" />
      <FormError msg={err} />
      <button className="btn btn-primary justify-self-start" disabled={busy || phone.length < 10}>{busy ? "Sending…" : cta}</button>
    </form>
  ) : (
    <form onSubmit={verify} className="grid gap-4" noValidate>
      <p className="text-sm text-muted">We sent a 6-digit code to {sentTo}. <button type="button" className="font-semibold text-link underline" onClick={() => { setStage("phone"); setCode(""); }}>Change number</button></p>
      <Field label="6-digit code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
      {askAdult && (
        <Check name="adult" checked={adult} onChange={setAdult}>I am 18 or older, and I am the parent or lawful guardian of the child I will add.</Check>
      )}
      <FormError msg={err} />
      <div className="flex flex-wrap gap-3">
        <button className="btn btn-primary" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify and continue"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => send()} disabled={busy}>Send a new code</button>
      </div>
    </form>
  );
}
