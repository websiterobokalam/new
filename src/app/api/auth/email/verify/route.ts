import { z } from "zod";
import { body, fail, handler, HttpError, limit, ok } from "@/lib/api";
import { loginEmail, verifyEmailOtp } from "@/lib/auth/emailOtp";
import { startEmailSession, setSessionCookie, LoginRefused } from "@/lib/auth/session";
import type { Tx } from "@/lib/db";

const msg = { expired: "That code has expired. Ask for a new one.", wrong: "That code is not right. Check and try again.", locked: "Too many wrong tries. Ask for a new code." };

/** School staff are added by their school admin (or Robokalam). No sign-up at the school door. */
async function mustBeStaff(c: Tx, accountId: string | null) {
  const ok = accountId && (await c.query(
    "SELECT 1 FROM school_staff st JOIN schools s ON s.id = st.school_id AND s.status <> 'ended' WHERE st.account_id = $1 AND st.removed_at IS NULL",
    [accountId],
  )).rows[0];
  if (!ok) throw new HttpError(403, "This email isn't on a school's staff list. Ask your school admin to add you.", { notStaff: true });
}

export const POST = handler(async (req) => {
  limit(req, "email-otp-verify", 20, 15 * 60_000);
  const b = await body(req, z.object({
    email: loginEmail, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), adultDeclared: z.boolean().default(false),
    language: z.enum(["en", "te", "hi"]).optional(), region: z.enum(["ts-ap", "india", "intl"]).optional(), door: z.enum(["learner", "school", "educator"]).optional(),
  }));
  const r = await verifyEmailOtp(b.email, b.code);
  if (!r.ok) return fail(401, msg[r.reason], { reason: r.reason });
  try {
    const { token, account } = await startEmailSession(b.email, { adultDeclared: b.adultDeclared, language: b.language, region: b.region, mustExist: b.door === "school" ? mustBeStaff : undefined });
    await setSessionCookie(token);
    return ok({ role: account.role });
  } catch (e) {
    if (e instanceof LoginRefused) return fail(403, e.message);
    throw e;
  }
});
