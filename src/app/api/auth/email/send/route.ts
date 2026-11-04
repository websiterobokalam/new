import { z } from "zod";
import { body, fail, handler, limit, ok } from "@/lib/api";
import { loginEmail, sendEmailOtp, EmailLoginNotConfigured, EmailOtpRateLimited } from "@/lib/auth/emailOtp";
import { maskContact } from "@/lib/auth/mask";

export const POST = handler(async (req) => {
  limit(req, "email-otp-send", 6, 15 * 60_000);
  const { email } = await body(req, z.object({ email: loginEmail }));
  try {
    await sendEmailOtp(email);
  } catch (e) {
    if (e instanceof EmailLoginNotConfigured) return fail(503, "Sign-in by email isn't switched on yet.", { notLive: true });
    if (e instanceof EmailOtpRateLimited) return fail(429, "Too many codes requested. Try again in 15 minutes.");
    throw e;
  }
  return ok({ sentTo: maskContact(email) });
});
