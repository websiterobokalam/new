import { NextResponse } from "next/server";
import { housekeeping } from "@/lib/housekeeping";
import { testProvidersAllowed } from "@/lib/providers";

/** For an external scheduler (Hostinger cron): GET /api/cron/housekeeping?key=CRON_SECRET once a day. The server also runs it hourly. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!process.env.CRON_SECRET || u.searchParams.get("key") !== process.env.CRON_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  // Test servers only: run as if it were another date (to exercise the monthly summary).
  const at = testProvidersAllowed() && u.searchParams.get("now") ? new Date(u.searchParams.get("now")!) : new Date();
  return NextResponse.json({ ok: true, ...(await housekeeping(at)) });
}
