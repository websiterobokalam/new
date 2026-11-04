import { NextResponse } from "next/server";
import { unsubscribe } from "@/lib/engage";

/** Link in every newsletter. GET from the link; POST for mail apps' one-click unsubscribe (RFC 8058). */
export async function GET(req: Request) {
  const ok = await unsubscribe(new URL(req.url).searchParams.get("t") ?? "");
  return NextResponse.redirect(new URL(`/newsletter?s=${ok ? "unsubscribed" : "invalid"}`, req.url), 303);
}
export async function POST(req: Request) {
  const ok = await unsubscribe(new URL(req.url).searchParams.get("t") ?? "");
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
