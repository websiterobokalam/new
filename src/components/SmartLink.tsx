import Link from "next/link";
import { isExternal } from "@/content/company";

/** A link that opens our other sites and social pages in a new tab, and says so to screen readers. */
export function SmartLink({ href, className, children, arrow = true }: { href: string; className?: string; children: React.ReactNode; arrow?: boolean }) {
  if (isExternal(href))
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}{arrow && <span aria-hidden>&nbsp;↗</span>}<span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return <Link href={href} className={className}>{children}</Link>;
}
