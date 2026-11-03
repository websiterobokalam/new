import { z } from "zod";
import { phone } from "@/lib/leads";
import { body, fail, handler, limit, ok } from "@/lib/api";
import { verifyOtp } from "@/lib/auth/otp";
import { startSession, setSessionCookie } from "@/lib/auth/session";
import { system } from "@/lib/db";

const msg = { expired: "That code has expired. Ask for a new one.", wrong: "That code is not right. Check and try again.", locked: "Too many wrong tries. Ask for a new code." };

export const POST = handler(async (req) => {
  limit(req, "otp-verify", 20, 15 * 60_000);
  const b = await body(req, z.object({ phone, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), adultDeclared: z.boolean().default(false), language: z.enum(["en", "te", "hi"]).optional(), region: z.enum(["ts-ap", "india", "intl"]).optional(), door: z.enum(["learner", "school", "educator"]).optional() }));
  const r = await verifyOtp(b.phone, b.code);
  if (!r.ok) return fail(401, msg[r.reason], { reason: r.reason });
  // School door: staff are added by their school admin. No sign-up here.
  if (b.door === "school") {
    const staff = await system(async (c) => (await c.query(
      "SELECT 1 FROM accounts a JOIN school_staff st ON st.account_id = a.id AND st.removed_at IS NULL JOIN schools s ON s.id = st.school_id AND s.status <> 'ended' WHERE a.phone_e164 = $1 AND a.erased_at IS NULL",
      [b.phone],
    )).rows[0]);
    if (!staff) return fail(403, "This number isn't on a school's staff list. Ask your school admin to add you.", { notStaff: true });
  }
  const { token, account } = await startSession(b.phone, { adultDeclared: b.adultDeclared, language: b.language, region: b.region });
  await setSessionCookie(token);
  return ok({ role: account.role });
});
