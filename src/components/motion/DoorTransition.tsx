"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type Go = (href: string, from: HTMLElement) => void;
const Ctx = createContext<Go | null>(null);

/**
 * Page change: a tapped door expands into the next page's hero using the View
 * Transitions API. The target hero carries `view-transition-name: door-hero`.
 * Falls back to a normal client navigation when unsupported or reduced motion.
 */
export function DoorTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const done = useRef<(() => void) | null>(null);

  useEffect(() => {
    done.current?.();
    done.current = null;
  }, [pathname]);

  const go = useCallback<Go>(
    (href, from) => {
      const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown };
      if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(href);
        return;
      }
      from.style.viewTransitionName = "door-hero";
      doc.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const t = setTimeout(resolve, 2500);
            done.current = () => {
              clearTimeout(t);
              from.style.viewTransitionName = "";
              requestAnimationFrame(() => resolve());
            };
            router.push(href);
          }),
      );
    },
    [router],
  );

  return <Ctx.Provider value={go}>{children}</Ctx.Provider>;
}

export function DoorLink({ href, className, children, ...rest }: React.ComponentProps<typeof Link> & { href: string }) {
  const go = useContext(Ctx);
  return (
    <Link
      href={href}
      className={className}
      {...rest}
      onClick={(e) => {
        if (!go || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const card = (e.currentTarget.closest("[data-door-card]") as HTMLElement) ?? e.currentTarget;
        go(href, card);
      }}
    >
      {children}
    </Link>
  );
}
