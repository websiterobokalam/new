"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpFlow } from "./OtpFlow";

/** Only same-site /app paths are allowed as a post-login destination. */
function safeNext(n: string | null) {
  return n && /^\/app(\/[\w\-/]*)?$/.test(n) ? n : "/app";
}

export function LearnerLogin() {
  const router = useRouter();
  const sp = useSearchParams();
  return <OtpFlow cta="Send OTP" onDone={() => { router.push(safeNext(sp.get("next"))); router.refresh(); }} />;
}
