import { NextResponse } from "next/server";
import { housekeeping } from "@/lib/housekeeping";

/** For an external scheduler (Hostinger cron): GET /api/cron/housekeeping?key=CRON_SECRET once a day. The server also runs it hourly. */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await housekeeping()) });
}
