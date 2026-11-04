import { NextResponse } from "next/server";
import { confirmSubscription } from "@/lib/engage";

export async function GET(req: Request) {
  const ok = await confirmSubscription(new URL(req.url).searchParams.get("t") ?? "");
  return NextResponse.redirect(new URL(`/newsletter?s=${ok ? "confirmed" : "invalid"}`, req.url), 303);
}
