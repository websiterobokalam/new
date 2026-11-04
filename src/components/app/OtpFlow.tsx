"use client";
import { useState } from "react";
import { post } from "./client";
import { Field, FormError, Check } from "../forms/ui";

type Channel = "email" | "phone";

/**
 * One-time-code sign-in. Email is the default at every door; a mobile number
 * works too where SMS is switched on. Calls onDone after the session cookie is set.
 */
export function OtpFlow({
  onDone, askAdult = true, cta = "Send OTP", phoneLabel = "Parent's mobile number", emailLabel = "Parent's email", door, smsEnabled = true,
}: { onDone: (role: string) => void; askAdult?: boolean; cta?: string; phoneLabel?: string; emailLabel?: string; door?: "learner" | "school" | "educator"; smsEnabled?: boolean }) {
  const [channel, setChannel] = useState<Channel>("email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [adult, setAdult] = useState(false);
  const [stage, setStage] = useState<"who" | "code">("who");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [sentTo, setSentTo] = useState("");

  const base = channel === "email" ? "/api/auth/email" : "/api/auth/otp";
  const who = channel === "email" ? { email } : { phone };

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true); setErr(undefined);
    const r = await post<{ sentTo: string }>(`${base}/send`, who);
    setBusy(false);
    if (!r.ok) return setErr(r.fields?.email ?? r.fields?.phone ?? r.error);
    setSentTo(r.sentTo); setStage("code"); setCode("");
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (askAdult && !adult) return setErr("Please confirm you are 18 or older and the child's parent or guardian.");
    setBusy(true); setErr(undefined);
    const region = document.cookie.match(/(?:^|; )rk_region=([^;]+)/)?.[1];
    const r = await post<{ role: string }>(`${base}/verify`, { ...who, code, adultDeclared: adult, region, door });
    setBusy(false);
    if (!r.ok) return setErr(r.fields?.code ?? r.error);
    onDone(r.role);
  }
  function switchTo(c: Channel) { setChannel(c); setErr(undefined); setStage("who"); setCode(""); }

  if (stage === "who") {
    return (
      <form onSubmit={send} className="grid gap-4" noValidate>
        {channel === "email" ? (
          <Field label={emailLabel} name="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" hint="We'll email you a one-time code. No password needed." />
        ) : (
          <Field label={phoneLabel} name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98xxxxxx10" hint="We'll text you a one-time code." />
        )}
        <FormError msg={err} />
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-primary" disabled={busy || (channel === "email" ? !email.includes("@") : phone.length < 10)}>
            {busy ? "Sending…" : channel === "email" ? "Email me a code" : cta}
          </button>
          {smsEnabled && (
            <button type="button" className="text-sm font-semibold text-link underline" onClick={() => switchTo(channel === "email" ? "phone" : "email")}>
              {channel === "email" ? "Use mobile number instead" : "Use email instead"}
            </button>
          )}
        </div>
      </form>
    );
  }
  return (
    <form onSubmit={verify} className="grid gap-4" noValidate>
      <p className="text-sm text-muted" role="status">
        We sent a 6-digit code to {sentTo}.{channel === "email" ? " Check spam if it isn't there in a minute." : ""}{" "}
        <button type="button" className="font-semibold text-link underline" onClick={() => { setStage("who"); setCode(""); }}>
          {channel === "email" ? "Change email" : "Change number"}
        </button>
      </p>
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
