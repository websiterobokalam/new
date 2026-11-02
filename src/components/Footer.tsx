import Link from "next/link";
import { LogoMark } from "./Logo";
import { SITE } from "@/lib/site";

const cols = [
  { title: "Learn", links: [["/learn", "Find a course"], ["/programs", "Ashaer tracks"], ["/bootcamps", "Bootcamps"], ["/internships", "Internships"], ["/kits", "Kits"]] },
  { title: "Schools", links: [["/21c-lab", "21C STEM & AI Lab"], ["/21c-lab/planner", "Lab Planner"], ["/impact", "Impact"], ["/partners", "Partners"]] },
  { title: "Fellows", links: [["/fellows", "Kalam Fellows"], ["/fellows/apply", "Apply"], ["/fellows/earnings", "How pay works"], ["/fellows/safety", "Rules for teaching children"]] },
  { title: "Robokalam", links: [["/about", "About"], ["/stories", "Stories"], ["/events", "Events"], ["/careers", "Careers"], ["/studio", "Studio"], ["/validate", "Validate a certificate"], ["/contact", "Contact"], ["/faq", "FAQ"]] },
  { title: "Trust", links: [["/child-safety", "Child safety"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/refunds", "Refunds"], ["/fellow-terms", "Fellow terms"]] },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-[#c9dbe5]" data-noprint>
      <div className="wrap py-16">
        {/* The Kalam Line ends by signing the name */}
        <div data-power className="mb-12" aria-hidden>
          <svg viewBox="0 0 900 140" className="h-auto w-full max-w-3xl draw-on-power">
            <defs>
              <linearGradient id="sig-g" x1="0" x2="1">
                <stop offset="0" stopColor="#0098D6" /><stop offset=".5" stopColor="#00CBD6" /><stop offset="1" stopColor="#98B844" />
              </linearGradient>
            </defs>
            <path data-draw pathLength={1} d="M6 70 C 40 70, 60 20, 90 60" fill="none" stroke="url(#sig-g)" strokeWidth="3" strokeLinecap="round" />
            <text x="96" y="104" className="sign-text" fontFamily="var(--font-display)" fontWeight="700" fontSize="110" fill="none" stroke="url(#sig-g)" strokeWidth="2">Robokalam</text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <LogoMark className="h-10 w-10" />
            <p className="mt-3 text-sm leading-relaxed text-[#a3bccb]">{SITE.tagline}. {SITE.positioning}</p>
          </div>
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="font-mono text-xs uppercase tracking-[0.14em] !text-[#6fd7f0]">{c.title}</h2>
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
