import { z } from "zod";
import { phone } from "@/lib/leads";
import { body, fail, handler, limit, ok } from "@/lib/api";
import { sendOtp, OtpNotConfigured, OtpRateLimited } from "@/lib/auth/otp";

export const POST = handler(async (req) => {
  limit(req, "otp-send", 6, 15 * 60_000);
  const { phone: p } = await body(req, z.object({ phone }));
  try {
    await sendOtp(p);
  } catch (e) {
    if (e instanceof OtpNotConfigured) return fail(503, "Login by OTP is not switched on yet.", { notLive: true });
    if (e instanceof OtpRateLimited) return fail(429, "Too many codes requested. Try again in 15 minutes.");
    throw e;
  }
  return ok({ sentTo: p.slice(0, 3) + "•••••" + p.slice(-3) });
});
