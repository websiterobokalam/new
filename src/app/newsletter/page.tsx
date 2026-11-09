import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms/Engage";
import { Mascot } from "@/components/art/Mascot";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter", description: "The Robokalam newsletter: new projects, guides for parents and schools, and events. Adults only, confirmed by email.", alternates: { canonical: "/newsletter" } };

const STATES: Record<string, { title: string; body: string }> = {
  confirmed: { title: "You're subscribed.", body: "Thanks! The next newsletter will reach your inbox. Every one has a one-click unsubscribe." },
  unsubscribed: { title: "You're unsubscribed.", body: "You won't get the newsletter any more. Emails about your account, bookings and child safety are separate and continue while you have an account." },
  invalid: { title: "That link didn't work.", body: "It may be old or already used. Sign up again below and we'll send a fresh link." },
};

export default async function Newsletter({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const s = STATES[(await searchParams).s ?? ""];
  return (
    <section className="py-12 sm:py-20">
      <div className="wrap grid max-w-2xl gap-6">
        <Mascot className="w-28" sizes="112px" />
        <header>
          <p className="eyebrow">Newsletter</p>
          <h1 className="display-lg mt-3">{s?.title ?? "Build notes, twice a month."}</h1>
          <p className="lede mt-3">{s?.body ?? "New projects to try at home, guides for parents and schools, and events near you. For adults only; we confirm every sign-up by email."}</p>
        </header>
        {(!s || s === STATES.invalid || s === STATES.unsubscribed) && <NewsletterForm source="newsletter" />}
        <p className="text-sm text-muted">We use your email only to send the newsletter. See our <Link className="underline" href="/privacy">privacy notice</Link>.</p>
      </div>
    </section>
  );
}
