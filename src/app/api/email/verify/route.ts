import { NextResponse } from "next/server";
import { confirmVerification } from "@/lib/email/verify";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const ok = /^[\w-]{20,64}$/.test(token) ? await confirmVerification(token).catch(() => null) : null;
  // Relative to this request, so it works on any host the site is served from.
  return NextResponse.redirect(new URL(`/app/email?${ok ? "verified=1" : "expired=1"}`, req.url), 303);
}
