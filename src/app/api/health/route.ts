import { NextResponse } from "next/server";
import { system } from "@/lib/db";
import { launchReport } from "@/lib/launch";

export const dynamic = "force-dynamic";

/**
 * Uptime check. Public: { ok, db } only; 200 when the database answers, 503 when not.
 * With ?key=CRON_SECRET it also returns the email queue and launch blockers, for monitoring.
 */
export async function GET(req: Request) {
  const started = Date.now();
  let db = false;
  let queue: { queued: number; failed: number } | null = null;
  try {
    queue = await system(async (c) => {
      const r = (await c.query("SELECT SUM(status = 'queued') AS queued, SUM(status = 'failed' AND created_at > UTC_TIMESTAMP(3) - INTERVAL 1 DAY) AS failed FROM email_outbox")).rows[0];
      return { queued: Number(r.queued ?? 0), failed: Number(r.failed ?? 0) };
    });
    db = true;
  } catch { db = false; }
  const body: Record<string, unknown> = { ok: db, db, ms: Date.now() - started };
  const key = new URL(req.url).searchParams.get("key");
  if (process.env.CRON_SECRET && key === process.env.CRON_SECRET) {
    const r = await launchReport();
    Object.assign(body, { email: queue, launch: { ready: r.ready, live: r.live, blockers: r.blockers.map((b) => b.id), warnings: r.warnings.map((w) => w.id) } });
  }
  return NextResponse.json(body, { status: db ? 200 : 503, headers: { "cache-control": "no-store" } });
}
