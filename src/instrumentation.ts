/**
 * Runs once when the Node server starts. Sends queued email every 30 seconds
 * and queues reminders every 5 minutes. (Hostinger can also call
 * /api/cron/email; both are safe together.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.EMAIL_LOOP === "off") return;
  const g = globalThis as unknown as { __rkEmailLoop?: boolean };
  if (g.__rkEmailLoop) return;
  g.__rkEmailLoop = true;
  const { drain } = await import("./lib/email/outbox");
  const { scheduleReminders } = await import("./lib/email/notify");
  const quiet = (e: unknown) => { if (!/ECONNREFUSED|not configured/i.test(String((e as Error)?.message))) console.error("email loop", (e as Error)?.message); };
  setInterval(() => { drain().catch(quiet); }, Number(process.env.EMAIL_DRAIN_MS ?? 30_000)).unref?.();
  setInterval(() => { scheduleReminders().catch(quiet); }, 5 * 60_000).unref?.();
  setTimeout(() => { scheduleReminders().catch(quiet); drain().catch(quiet); }, 5_000).unref?.();
}
