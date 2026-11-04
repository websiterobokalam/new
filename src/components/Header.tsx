import Link from "next/link";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { RegionPicker } from "./RegionPicker";
import { AccountLink } from "./AccountLink";
import { SmartLink } from "./SmartLink";
import { EXTERNAL } from "@/content/company";

// Schools first: Robokalam leads as a technology partner for schools.
const nav = [
  { href: "/21c-lab", label: "Schools" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/learn", label: "Learn" },
  { href: "/kalamites", label: "Kalamites" },
];
const small = [
  { href: "/partners", label: "Partners" },
  { href: "/studio", label: "Studio" },
  { href: EXTERNAL.shop.href, label: "Shop" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 glass" data-noprint>
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <Link href="/" aria-label="Robokalam home" className="shrink-0 rounded-lg">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 font-semibold text-heading hover:bg-panel">
              {n.label}
            </Link>
          ))}
          <span className="mx-2 hidden h-5 w-px bg-line lg:block" aria-hidden />
          {small.map((n) => (
            <SmartLink key={n.href} href={n.href} className="hidden rounded-full px-3 py-2 text-sm text-muted hover:text-heading lg:inline-flex">
              {n.label}
            </SmartLink>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <RegionPicker />
          <ThemeToggle />
          <AccountLink />
          <details className="relative lg:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-surface" aria-label="Menu">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </summary>
            <nav aria-label="Mobile menu" className="card absolute right-0 top-12 grid w-56 gap-1 p-2">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-xl px-4 py-3 font-semibold text-heading hover:bg-panel md:hidden">
                  {n.label}
                </Link>
              ))}
              {small.map((n) => (
                <SmartLink key={n.href} href={n.href} className="rounded-xl px-4 py-3 font-semibold text-heading hover:bg-panel">
                  {n.label}
                </SmartLink>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
