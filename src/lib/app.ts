import { redirect } from "next/navigation";
import { currentAccount, type Account } from "./auth/session";
import { dict, getLocale, type Locale } from "@/i18n";
import type { Dict } from "@/i18n/en";

/** For /app pages: the signed-in account, its locale and dictionary, or a redirect to login. */
export async function appContext(next: string): Promise<{ account: Account; locale: Locale; t: Dict }> {
  const account = await currentAccount();
  if (!account) redirect(`/login/learner?next=${encodeURIComponent(next)}`);
  const locale = await getLocale(account.language);
  return { account, locale, t: dict(locale) };
}

export const fmtDate = (d: string | Date, locale: Locale) =>
  new Date(d).toLocaleString(locale === "en" ? "en-IN" : `${locale}-IN`, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
