"use client";
import { useState } from "react";
import { Field, FormError } from "./ui";

export function OtpLogin({ who }: { who: string }) {
  const [state, setState] = useState<{ status: "idle" | "sending" | "notlive" | "error"; error?: string }>({ status: "idle" });
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ status: "sending" });
        const phone = new FormData(e.currentTarget).get("phone");
        try {
          const r = await fetch("/api/otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
          const j = await r.json();
          if (j.notLive) setState({ status: "notlive", error: j.error });
          else setState({ status: "error", error: j.error });
        } catch {
          setState({ status: "error", error: "You seem to be offline." });
        }
      }}
    >
      <Field label={`${who} mobile number`} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98xxxxxx10" required />
      {state.status === "error" && <FormError msg={state.error} />}
      {state.status === "notlive" && (
        <p role="status" className="rounded-xl bg-leafmist px-4 py-3 text-sm font-semibold text-navy dark:bg-panel-2 dark:text-heading">{state.error}</p>
      )}
      <button className="btn btn-primary" disabled={state.status === "sending"}>{state.status === "sending" ? "Checking…" : "Send OTP"}</button>
    </form>
  );
}
