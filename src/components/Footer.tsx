import Link from "next/link";
import { Wordmark } from "./Logo";
import { SITE } from "@/lib/site";

const cols = [
  { title: "Learn", links: [["/learn", "Find a course"], ["/programs", "Ashaer tracks"], ["/bootcamps", "Bootcamps"], ["/internships", "Internships"], ["/kits", "Kits"]] },
  { title: "Schools", links: [["/21c-lab", "21C STEM & AI Lab"], ["/21c-lab/planner", "Lab Planner"], ["/impact", "Impact"], ["/partners", "Partners"]] },
  { title: "Kalamites", links: [["/kalamites", "Kalamites"], ["/kalamites/apply", "Apply"], ["/kalamites/earnings", "How pay works"], ["/kalamites/safety", "Rules for teaching children"], ["/campus-ambassadors", "Campus Ambassadors"]] },
  { title: "Robokalam", links: [["/about", "About"], ["/stories", "Stories"], ["/events", "Events"], ["/careers", "Careers"], ["/studio", "Studio"], ["/validate", "Validate a certificate"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
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
                  <li key={href}><Link href={href} className="text-sm hover:text-white">{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-[#8aa5b5] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.legalName}</p>
          <p>Safeguarding Lead and grievance contact: <span className="text-[#c9dbe5]">to be published before launch</span></p>
        </div>
      </div>
    </footer>
  );
}
