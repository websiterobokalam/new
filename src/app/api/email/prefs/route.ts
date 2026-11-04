import { timingSafeEqual } from "node:crypto";
import { prefsToken } from "@/lib/email/outbox";
import { setUpdates } from "@/lib/email/verify";

/** One-click unsubscribe from reminders and summaries (also the List-Unsubscribe target). */
async function handle(req: Request) {
  const u = new URL(req.url);
  const a = u.searchParams.get("a") ?? "";
  const t = u.searchParams.get("t") ?? "";
  const want = prefsToken(a);
  const valid = /^[0-9a-f-]{36}$/.test(a) && t.length === want.length && timingSafeEqual(Buffer.from(t), Buffer.from(want));
  if (valid) await setUpdates(a, u.searchParams.get("updates") === "1");
  const msg = valid ? "Done. You won't get reminder and summary emails. Receipts, consent records, safety emails and one-to-one oversight emails still come." : "This link isn't valid. Change email settings from your account instead.";
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email settings</title></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#0b2b3d;background:#f6fbfd"><h1 style="color:#00445F">Email settings</h1><p>${msg}</p><p><a href="/app/email" style="color:#075a80">Open email settings</a></p></body></html>`, { status: valid ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } });
}
export const GET = handle;
export const POST = handle;
