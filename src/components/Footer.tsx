import Link from "next/link";
import { Wordmark } from "./Logo";
import { SITE } from "@/lib/site";
import { CONTACT, EXTERNAL, SOCIAL, PEOPLE } from "@/content/company";
import { SmartLink } from "./SmartLink";
import { ThemeToggle } from "./ThemeToggle";

const cols = [
  { title: "Learn", links: [["/learn", "Find a course"], ["/programs", "Ashaer tracks"], ["/bootcamps", "Bootcamps"], ["/internships", "Internships"], ["/kits", "ASHAER Box"], [EXTERNAL.learn.href, "Learning portal"], [EXTERNAL.shop.href, "Shop"]] },
  { title: "Schools", links: [["/21c-lab", "21C STEM & AI Lab"], ["/21c-lab/planner", "Lab Planner"], ["/impact", "Impact"], ["/partners", "Partners"], [EXTERNAL.school.href, "School portal"], [EXTERNAL.ashaerLabs.href, "ASHAER Labs"]] },
  { title: "Kalamites", links: [["/kalamites", "Kalamites"], ["/kalamites/apply", "Apply"], ["/kalamites/earnings", "How pay works"], ["/kalamites/safety", "Rules for teaching children"], ["/campus-ambassadors", "Campus Ambassadors"]] },
  { title: "Robokalam", links: [["/about", "About"], ["/blog", "Blog"], ["/events", "Events"], ["/careers", "We're hiring"], ["/studio", "Studio"], ["/validate", "Validate a certificate"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
  { title: "Trust", links: [["/child-safety", "Child safety"], ["/one-to-one", "One-to-one classes"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/refunds", "Refunds"], ["/kalamite-terms", "Kalamite terms"]] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-[#c9dbe5]" data-noprint>
      <div className="wrap py-16">
        {/* The Kalam Line ends with the name: bold letters that spring in, a rolling colour wave, and a spark. */}
        <div data-power className="mb-14">
          <p className="rk-sign" role="img" aria-label="Robokalam">
            {"ROBOKALAM".split("").map((ch, i) => (
              <span key={i} aria-hidden className="rk-letter" style={{ ["--i" as string]: i }}>{ch}</span>
            ))}
          </p>
          <div aria-hidden className="rk-fuse"><span className="rk-spark" /></div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-white/10 pb-8 sm:col-span-3 lg:col-span-5">
            <Wordmark tone="light" />
            <p className="max-w-md text-sm leading-relaxed text-[#a3bccb]">{SITE.positioning}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="font-mono text-xs uppercase tracking-[0.14em] !text-[#7FD0F2]">{c.title}</h2>
              <ul className="mt-3 grid gap-2">
                {c.links.map(([href, label]) => (
                  <li key={href}><SmartLink href={href} className="text-sm hover:text-white">{label}</SmartLink></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] !text-[#7FD0F2]">Visit</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {CONTACT.offices.map((o) => <li key={o.city}><address className="not-italic">{o.line}</address></li>)}
            </ul>
            <p className="mt-4 text-sm">
              <Link href="/locations/hyderabad" className="hover:text-white">Robokalam Hyderabad</Link> · <Link href="/locations/warangal" className="hover:text-white">Robokalam Warangal</Link>
            </p>
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] !text-[#7FD0F2]">Get in touch</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {CONTACT.phones.map((p) => <li key={p.tel}><a href={`tel:${p.tel}`} className="hover:text-white">{p.label}</a></li>)}
              <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>
              <li className="text-[#8aa5b5]">{CONTACT.hours}</li>
            </ul>
          </div>
          <nav aria-label="Follow Robokalam">
            <h2 className="font-mono text-xs uppercase tracking-[0.14em] !text-[#7FD0F2]">Follow us</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SOCIAL.map((x) => (
                <li key={x.name}><SmartLink href={x.href} arrow={false} className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-3.5 text-sm hover:border-[#7FD0F2] hover:text-white">{x.name}</SmartLink></li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#8aa5b5] sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-4"><p>© {new Date().getFullYear()} {SITE.legalName}</p><ThemeToggle /></div>
          <p>
            Safeguarding Lead: <a href={`mailto:${PEOPLE.safeguardingLead.email}`} className="text-[#c9dbe5] hover:text-white">{PEOPLE.safeguardingLead.named ? PEOPLE.safeguardingLead.name : PEOPLE.safeguardingLead.email}</a>
            {" · "}Grievance Officer: <a href={`mailto:${PEOPLE.grievanceOfficer.email}`} className="text-[#c9dbe5] hover:text-white">{PEOPLE.grievanceOfficer.named ? PEOPLE.grievanceOfficer.name : PEOPLE.grievanceOfficer.email}</a>
            {" · "}<Link href="/child-safety#report" className="text-[#c9dbe5] hover:text-white">Report a concern</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
