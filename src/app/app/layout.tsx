import type { Metadata } from "next";
import Link from "next/link";
import { currentAccount } from "@/lib/auth/session";
import { dict, getLocale } from "@/i18n";
import { ReportButton } from "@/components/app/ReportButton";
import { LangSwitch, LogoutButton } from "@/components/app/LangSwitch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Family home", template: "%s | Robokalam" }, robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const a = await currentAccount().catch(() => null);
  const locale = await getLocale(a?.language);
  const t = dict(locale);
  return (
    <div className="min-h-[70vh] bg-bg pb-24">
      {a && (
        <nav aria-label="Family app" className="border-b border-line bg-surface">
          <div className="wrap flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm font-semibold">
            <Link href="/app" className="text-heading hover:underline">{t.app_home}</Link>
            <Link href="/app/consent" className="text-heading hover:underline">{t.consent_centre}</Link>
            <Link href="/app/orders" className="text-heading hover:underline">{t.orders}</Link>
            <Link href="/courses" className="text-heading hover:underline">{t.browse_courses}</Link>
            <span className="ml-auto flex items-center gap-4">
              <LangSwitch current={locale} label={t.language} />
              <LogoutButton label={t.logout} />
            </span>
          </div>
        </nav>
      )}
      <div lang={locale === "en" ? undefined : locale}>{children}</div>
      <ReportButton t={t} />
    </div>
  );
}
