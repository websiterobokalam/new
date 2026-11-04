import { z } from "zod";
import { phone } from "../leads";
import { loginEmail } from "./emailOtp";

/** Blank form fields become "not given". */
const blank = z.literal("").transform(() => undefined);
export const optionalPhone = z.union([blank, phone]).optional();
export const optionalEmail = z.union([blank, loginEmail]).optional();

/** A login needs an email (the default way in) or a mobile number. */
export const needsEmailOrPhone = (v: { email?: string; phone?: string }) => !!(v.email || v.phone);
export const EMAIL_OR_PHONE = { message: "Add an email address (or a mobile number)", path: ["email"] };
