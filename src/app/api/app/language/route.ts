import { z } from "zod";
import { cookies } from "next/headers";
import { body, handler, ok } from "@/lib/api";
import { currentAccount, asAccount } from "@/lib/auth/session";
import { LANG_COOKIE } from "@/i18n";

export const POST = handler(async (req) => {
  const { lang } = await body(req, z.object({ lang: z.enum(["en", "te", "hi"]) }));
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  const a = await currentAccount();
  if (a) await asAccount(a, (c) => c.query("UPDATE accounts SET language = $1 WHERE id = $2", [lang, a.id]));
  return ok();
});
