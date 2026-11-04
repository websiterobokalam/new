import { NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/engage";
import { SITE } from "@/lib/site";

export async function GET(req: Request) {
  const ok = await confirmSubscription(new URL(req.url).searchParams.get("t") ?? "");
  return NextResponse.redirect(`${SITE.url}/newsletter?s=${ok ? "confirmed" : "invalid"}`, 303);
}
