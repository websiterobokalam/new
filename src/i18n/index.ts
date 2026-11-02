import { cookies } from "next/headers";
import { en, type Dict } from "./en";
import { te } from "./te";
import { hi } from "./hi";

export const LOCALES = { en, te, hi } as const;
export type Locale = keyof typeof LOCALES;
export const LANG_COOKIE = "rk_lang";

/** Account language wins; then cookie; then English. */
export async function getLocale(accountLang?: string | null): Promise<Locale> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  const pick = (accountLang ?? c) as Locale | undefined;
  return pick && pick in LOCALES ? pick : "en";
}

export function dict(l: Locale): Dict {
  return LOCALES[l];
}

export const htmlLang: Record<Locale, string> = { en: "en-IN", te: "te-IN", hi: "hi-IN" };
