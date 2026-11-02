import type { Metadata } from "next";
import Link from "next/link";
import { currentAccount } from "@/lib/auth/session";
import { dict, getLocale } from "@/i18n";
import { ReportButton } from "@/components/app/ReportButton";
import { LangSwitch, LogoutButton } from "@/components/app/LangSwitch";

export const dynamic = "force-dynamic";

const FELLOW_NAV = [["/app/fellow", "Home"], ["/app/fellow/gigs", "Gig board"], ["/app/fellow/earnings", "Earnings"], ["/app/fellow/growth", "Growth"], ["/app/messages", "Messages"], ["/app/fellow/support", "Support"]];
const OPS_NAV = [["/app/ops", "Refunds and sessions"], ["/app/ops/fellows", "Fellows"], ["/app/ops/gigs", "Gigs"], ["/app/ops/payouts", "Payouts"], ["/app/ops/cases", "Disputes and cases"]];
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
            {(a.role === "fellow" ? FELLOW_NAV : a.role === "ops" ? OPS_NAV : a.role === "safeguarding" ? [["/app/safeguarding", "Safeguarding queue"]] : [["/app", t.app_home], ["/app/consent", t.consent_centre], ["/app/orders", t.orders], ["/app/messages", "Messages"], ["/courses", t.browse_courses]]).map(([href, label]) => (
              <Link key={href} href={href} className="text-heading hover:underline">{label}</Link>
            ))}
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
