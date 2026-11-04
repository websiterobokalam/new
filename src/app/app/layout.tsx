import type { Metadata } from "next";
import Link from "next/link";
import { currentAccount } from "@/lib/auth/session";
import { dict, getLocale } from "@/i18n";
import { ReportButton } from "@/components/app/ReportButton";
import { LangSwitch, LogoutButton } from "@/components/app/LangSwitch";

export const dynamic = "force-dynamic";

const FELLOW_NAV = [["/app/fellow", "Home"], ["/app/fellow/gigs", "Gig board"], ["/app/fellow/earnings", "Earnings"], ["/app/fellow/growth", "Growth"], ["/app/fellow/courses", "My course"], ["/app/fellow/ambassador", "Ambassador"], ["/app/messages", "Messages"], ["/app/fellow/support", "Support"]];
const OPS_NAV = [["/app/ops", "Refunds and sessions"], ["/app/ops/fellows", "Fellows"], ["/app/ops/gigs", "Gigs"], ["/app/ops/schools", "Schools"], ["/app/ops/tickets", "Hardware tickets"], ["/app/ops/payouts", "Payouts"], ["/app/ops/cases", "Disputes and cases"], ["/app/ops/marketplace", "Marketplace"], ["/app/ops/courses", "Course reviews"], ["/app/ops/quality", "Quality flags"], ["/app/ops/ambassadors", "Ambassadors"]];
const SCHOOL_NAV = [["/app/school", "School home"], ["/app/school/timetable", "Timetable"], ["/app/school/tickets", "Hardware tickets"], ["/app/school/fellows", "Kalam Fellows"], ["/app/school/staff", "Staff"]];
const TRAINER_NAV = [["/app/trainer", "My week"], ["/app/school/tickets", "Kit issues"], ["/app/school/fellows", "Fellow mentoring"]];
export const metadata: Metadata = { title: { default: "Family home", template: "%s | Robokalam" }, robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const a = await currentAccount().catch(() => null);
  const locale = await getLocale(a?.language);
  const t = dict(locale);
  return (
    <div className="min-h-[70vh] bg-bg pb-24">
      {a && (
        <nav aria-label={a.role === "school_admin" || a.role === "trainer" ? "School portal" : "Family app"} className="border-b border-line bg-surface">
          <div className="wrap flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm font-semibold">
            {(a.role === "fellow" ? FELLOW_NAV : a.role === "ops" ? OPS_NAV : a.role === "school_admin" ? SCHOOL_NAV : a.role === "trainer" ? TRAINER_NAV : a.role === "safeguarding" ? [["/app/safeguarding", "Safeguarding queue"]] : [["/app", t.app_home], ["/app/consent", t.consent_centre], ["/app/orders", t.orders], ["/app/messages", "Messages"], ["/courses", t.browse_courses]]).map(([href, label]) => (
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
