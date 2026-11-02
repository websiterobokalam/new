import { z } from "zod";
import { phone } from "@/lib/leads";
import { body, fail, handler, limit, ok } from "@/lib/api";
import { verifyOtp } from "@/lib/auth/otp";
import { startSession, setSessionCookie } from "@/lib/auth/session";

const msg = { expired: "That code has expired. Ask for a new one.", wrong: "That code is not right. Check and try again.", locked: "Too many wrong tries. Ask for a new code." };

export const POST = handler(async (req) => {
  limit(req, "otp-verify", 20, 15 * 60_000);
  const b = await body(req, z.object({ phone, code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"), adultDeclared: z.boolean().default(false), language: z.enum(["en", "te", "hi"]).optional(), region: z.enum(["ts-ap", "india", "intl"]).optional() }));
  const r = await verifyOtp(b.phone, b.code);
  if (!r.ok) return fail(401, msg[r.reason], { reason: r.reason });
  const { token, account } = await startSession(b.phone, { adultDeclared: b.adultDeclared, language: b.language, region: b.region });
  await setSessionCookie(token);
  return ok({ role: account.role });
});
