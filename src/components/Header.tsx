import Link from "next/link";
import { Wordmark } from "./Logo";
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
  { href: "/gallery", label: "Gallery" },
  { href: "/blog", label: "Blog" },
  { href: "/partners", label: "Partners" },
  { href: "/studio", label: "Studio" },
  { href: EXTERNAL.shop.href, label: "Shop" },
  { href: "/contact", label: "Contact" },
];

/**
 * Minimal header: the wordmark, a few mono links, "Say hello", the region and
 * account, and a two-line menu button that opens a full-screen, numbered menu.
 * No JavaScript needed (details/summary).
 */
export function Header() {
  return (
    <header className="site-header sticky top-0 z-50" data-noprint>
      <div className="wrap flex h-16 items-center justify-between gap-3 sm:h-[4.5rem]">
        <Link href="/" aria-label="Robokalam home" className="shrink-0 rounded-lg">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="nav-mono">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/contact" className="nav-mono hidden items-center gap-1.5 md:inline-flex">
            Say hello <span aria-hidden>↗</span>
          </Link>
          <RegionPicker />
          <AccountLink />
          <details className="menu-sheet">
            <summary className="menu-button" aria-label="Menu">
              <span aria-hidden className="menu-lines" />
            </summary>
            <div className="menu-panel">
              <nav aria-label="Mobile menu" className="wrap grid gap-10 pb-16 pt-24 lg:grid-cols-[1.4fr_1fr]">
                <ol className="grid gap-2">
                  {nav.map((n, i) => (
                    <li key={n.href}>
                      <Link href={n.href} className="menu-big">
                        <span className="mono-tag">[{String(i + 1).padStart(2, "0")}]</span>
                        {n.label}
                      </Link>
                    </li>
                  ))}
                </ol>
                <ul className="grid content-start gap-3">
                  {small.map((n) => (
                    <li key={n.href}><SmartLink href={n.href} className="nav-mono !text-base">{n.label}</SmartLink></li>
                  ))}
                </ul>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
