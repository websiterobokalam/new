import Link from "next/link";
import { Wordmark } from "./Logo";
import { SITE } from "@/lib/site";
import { CONTACT, EXTERNAL, SOCIAL, PEOPLE } from "@/content/company";
import { SmartLink } from "./SmartLink";
import { ThemeToggle } from "./ThemeToggle";
import { CookieSettingsLink } from "./Analytics";
import { FooterFriends } from "./FooterFriends";

const cols = [
  { title: "Learn", links: [["/learn", "Find a course"], ["/programs", "Ashaer tracks"], ["/bootcamps", "Bootcamps"], ["/internships", "Internships"], ["/kits", "ASHAER Box"], [EXTERNAL.learn.href, "Learning portal"], [EXTERNAL.shop.href, "Shop"]] },
  { title: "Schools", links: [["/21c-lab", "21C STEM & AI Lab"], ["/21c-lab/planner", "Lab Planner"], ["/impact", "Impact"], ["/partners", "Partners"], [EXTERNAL.school.href, "School portal"], [EXTERNAL.ashaerLabs.href, "ASHAER Labs"]] },
  { title: "Kalamites", links: [["/kalamites", "Kalamites"], ["/kalamites/apply", "Apply"], ["/kalamites/earnings", "How pay works"], ["/kalamites/safety", "Rules for teaching children"], ["/campus-ambassadors", "Campus Ambassadors"]] },
  { title: "Robokalam", links: [["/about", "About"], ["/blog", "Blog"], ["/newsletter", "Newsletter"], ["/events", "Events"], ["/careers", "We're hiring"], ["/studio", "Studio"], ["/validate", "Validate a certificate"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
  { title: "Trust", links: [["/child-safety", "Child safety"], ["/one-to-one", "One-to-one classes"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/refunds", "Refunds"], ["/kalamite-terms", "Kalamite terms"]] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-[#c9dbe5]" data-noprint>
      <div className="wrap pb-12 pt-16">
        {/* The Kalam Line ends with the name: bold letters that spring in, a rolling colour wave, and a spark. */}
        <div data-power>
          <p className="rk-sign" role="img" aria-label="Robokalam">
            {"ROBOKALAM".split("").map((ch, i) => (
              <span key={i} aria-hidden className="rk-letter" style={{ ["--i" as string]: i }}>{ch}</span>
            ))}
          </p>
          <div aria-hidden className="rk-fuse"><span className="rk-spark" /></div>
        </div>
      </div>
      <div className="footer-ground">
        {/* Kiko on the left, the Robokalam mascot on the right: eyes follow the pointer, tap to say hi. */}
        <FooterFriends />
        <div className="wrap relative pb-40 pt-14 md:pb-56">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-white/15 pb-8 sm:col-span-3 lg:col-span-5">
            <span className="rounded-xl bg-white px-3 py-2"><Wordmark /></span>
            <p className="max-w-md text-sm leading-relaxed text-[#E3F4F8]">{SITE.positioning}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2>{c.title}</h2>
              <ul className="mt-3 grid gap-2">
                {c.links.map(([href, label]) => (
                  <li key={href}><SmartLink href={href} className="text-sm">{label}</SmartLink></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2>Visit</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {CONTACT.offices.map((o) => <li key={o.city}><address className="not-italic">{o.line}</address></li>)}
            </ul>
            <p className="mt-4 text-sm">
              <Link href="/locations/hyderabad" className="">Robokalam Hyderabad</Link> · <Link href="/locations/warangal" className="">Robokalam Warangal</Link>
            </p>
          </div>
          <div>
            <h2>Get in touch</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {CONTACT.phones.map((p) => <li key={p.tel}><a href={`tel:${p.tel}`} className="">{p.label}</a></li>)}
              <li><a href={`mailto:${CONTACT.email}`} className="">{CONTACT.email}</a></li>
              <li className="text-[#C9E3EC]">{CONTACT.hours}</li>
            </ul>
          </div>
          <nav aria-label="Follow Robokalam">
            <h2>Follow us</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SOCIAL.map((x) => (
                <li key={x.name}><SmartLink href={x.href} arrow={false} className="inline-flex min-h-10 items-center rounded-full border border-white/30 bg-white/5 px-3.5 text-sm hover:border-[#FFD31D]">{x.name}</SmartLink></li>
              ))}
            </ul>
          </nav>
        </div>
        </div>
      </div>
      <div className="footer-legal">
        <div className="wrap flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center gap-4"><p>© {new Date().getFullYear()} {SITE.legalName}</p><ThemeToggle /><CookieSettingsLink className="underline hover:no-underline" /></div>
          <p>
            Safeguarding Lead: <a href={`mailto:${PEOPLE.safeguardingLead.email}`} className="hover:underline">{PEOPLE.safeguardingLead.named ? PEOPLE.safeguardingLead.name : PEOPLE.safeguardingLead.email}</a>
            {" · "}Grievance Officer: <a href={`mailto:${PEOPLE.grievanceOfficer.email}`} className="hover:underline">{PEOPLE.grievanceOfficer.named ? PEOPLE.grievanceOfficer.name : PEOPLE.grievanceOfficer.email}</a>
            {" · "}<Link href="/child-safety#report" className="hover:underline">Report a concern</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
