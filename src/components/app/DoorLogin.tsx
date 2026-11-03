"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { OtpFlow } from "./OtpFlow";

/** Only same-site /app paths are allowed as a post-login destination. */
function safeNext(n: string | null, fallback: string) {
  return n && /^\/app(\/[\w\-/]*)?$/.test(n) ? n : fallback;
}

export function FellowLogin() {
  const router = useRouter();
  const sp = useSearchParams();
  return <OtpFlow askAdult={false} cta="Send OTP" phoneLabel="Your mobile number" onDone={() => { router.push(safeNext(sp.get("next"), "/app/fellow")); router.refresh(); }} />;
}

export function SchoolLogin() {
  const router = useRouter();
  const sp = useSearchParams();
  return (
    <OtpFlow askAdult={false} door="school" cta="Send OTP" phoneLabel="Staff mobile number"
      onDone={(role) => { router.push(safeNext(sp.get("next"), role === "trainer" ? "/app/trainer" : "/app/school")); router.refresh(); }} />
  );
}
