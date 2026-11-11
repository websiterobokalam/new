"use client";
import { useSearchParams } from "next/navigation";
import { OtpFlow } from "./OtpFlow";

/** Only same-site /app paths are allowed as a post-login destination. */
function safeNext(n: string | null) {
  return n && /^\/app(\/[\w\-/]*)?$/.test(n) ? n : "/app";
}

export function LearnerLogin({ smsEnabled }: { smsEnabled: boolean }) {
  const sp = useSearchParams();
  return <OtpFlow cta="Send OTP" door="learner" smsEnabled={smsEnabled} onDone={() => window.location.assign(safeNext(sp.get("next")))} />;
}
