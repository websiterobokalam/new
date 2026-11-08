"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Google Analytics 4, consent first.
 *
 * - Nothing loads unless NEXT_PUBLIC_GA_ID is set AND the visitor taps "Allow".
 * - Never on the signed-in app, sign-in pages or the children's booking flow,
 *   and never with Google's advertising features (signals, ad personalisation,
 *   ad storage): our privacy notice promises no tracking of children and no
 *   advertising cookies.
 * - The choice is remembered on this device; "Cookie settings" in the footer
 *   reopens it. Declining removes the analytics cookies.
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "rk-analytics";
type Choice = "granted" | "denied" | null;

/** Pages where analytics never runs, whatever the visitor chose. */
const EXCLUDED = [/^\/app(\/|$)/, /^\/login(\/|$)/, /^\/learn\/build-session/, /^\/kalamites\/apply/, /^\/certificates\//, /^\/api\//];
export const analyticsAllowedOn = (path: string) => !EXCLUDED.some((r) => r.test(path));

type Gtag = (...args: unknown[]) => void;
declare global { interface Window { dataLayer?: unknown[]; gtag?: Gtag; rkTrack?: (event: string, params?: Record<string, string | number>) => void } }

const read = (): Choice => { try { const v = localStorage.getItem(KEY); return v === "granted" || v === "denied" ? v : null; } catch { return null; } };
const save = (v: Exclude<Choice, null>) => { try { localStorage.setItem(KEY, v); } catch {} };

function load() {
  if (!GA_ID || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer!.push(arguments); } as Gtag;
  // Consent mode: everything advertising stays denied for good.
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (/^_ga/.test(name)) for (const d of [location.hostname, `.${location.hostname.replace(/^www\./, "")}`]) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${d}`;
  }
}

export function Analytics() {
  const path = usePathname() || "/";
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    const c = read();
    setChoice(c);
    if (c === null && analyticsAllowedOn(location.pathname)) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener("rk-cookie-settings", reopen);
    return () => window.removeEventListener("rk-cookie-settings", reopen);
  }, []);

  // A page view per route, only with consent and only where allowed.
  useEffect(() => {
    if (!GA_ID || choice !== "granted" || !analyticsAllowedOn(path)) return;
    load();
    window.gtag?.("event", "page_view", { page_path: path, page_location: location.href, page_title: document.title });
  }, [path, choice]);

  // Conversions (no personal data): forms call window.rkTrack("generate_lead", { form: "school_demo" }).
  useEffect(() => {
    window.rkTrack = (event, params) => { if (choice === "granted" && analyticsAllowedOn(location.pathname)) window.gtag?.("event", event, params); };
  }, [choice]);

  if (!GA_ID || !open || !analyticsAllowedOn(path)) return null;
  const decide = (v: Exclude<Choice, null>) => {
    save(v); setChoice(v); setOpen(false);
    if (v === "denied") clearCookies();
  };
  return (
    <div role="dialog" aria-modal="false" aria-labelledby="ck-h" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-lift)] sm:bottom-5" data-noprint>
      <p id="ck-h" className="font-semibold text-heading">Help us improve robokalam.com?</p>
      <p className="mt-1 text-sm text-muted">
        With your OK we use Google Analytics to count visits and see which pages help. No advertising, no tracking across other sites, and never on your account or children&apos;s pages. For adults only. <Link className="underline" href="/privacy#cookies">Details</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary !min-h-10" onClick={() => decide("granted")}>Allow analytics</button>
        <button type="button" className="btn btn-ghost !min-h-10" onClick={() => decide("denied")}>No thanks</button>
      </div>
    </div>
  );
}

/** Footer link that reopens the choice. */
export function CookieSettingsLink({ className = "" }: { className?: string }) {
  if (!GA_ID) return null;
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("rk-cookie-settings"))}>Cookie settings</button>;
}
