import { NextResponse } from "next/server";
import { drain } from "@/lib/email/outbox";
import { scheduleReminders } from "@/lib/email/notify";

/** For an external scheduler (Hostinger cron): GET /api/cron/email?key=CRON_SECRET every few minutes. */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const reminders = await scheduleReminders();
  const sent = await drain(100);
  return NextResponse.json({ ok: true, reminders, ...sent });
}
