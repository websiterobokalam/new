import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eventBySlug, EVENT_KINDS, ageLabel, seatsLeft, isOpen, ist } from "@/lib/events";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = await eventBySlug((await params).slug).catch(() => null);
  if (!e) return { robots: { index: false } };
  return { title: e.title, description: e.summary, alternates: { canonical: `/events/${e.slug}` }, robots: e.status === "cancelled" ? { index: false } : undefined, openGraph: { type: "website", title: e.title, description: e.summary, url: `/events/${e.slug}` } };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = await eventBySlug((await params).slug).catch(() => null);
  if (!e) notFound();
  const left = seatsLeft(e);
  const open = isOpen(e);
  const ld = {
    "@context": "https://schema.org", "@type": "Event", name: e.title, description: e.summary,
    startDate: new Date(e.starts_at).toISOString(), endDate: new Date(new Date(e.starts_at).getTime() + e.duration_min * 60_000).toISOString(),
    eventStatus: e.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: e.mode === "online" ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: e.mode === "online" ? { "@type": "VirtualLocation", url: `${SITE.url}/events/${e.slug}` } : { "@type": "Place", name: e.venue, address: { "@type": "PostalAddress", addressLocality: e.city ?? undefined, addressCountry: "IN" } },
    organizer: { "@type": "Organization", name: SITE.name, url: SITE.url },
    offers: { "@type": "Offer", price: 0, priceCurrency: "INR", availability: left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${SITE.url}/events/${e.slug}` },
    ...(e.age_min != null ? { typicalAgeRange: e.age_max ? `${e.age_min}-${e.age_max}` : `${e.age_min}-` } : {}),
  };
  return (
    <>
      <JsonLd data={ld} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Events", path: "/events" }, { name: e.title, path: `/events/${e.slug}` }])} />
      <section className="py-12 sm:py-20">
        <div className="wrap grid max-w-5xl gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link className="hover:text-link" href="/events">Events</Link> / <span className="text-heading">{EVENT_KINDS[e.kind]}</span></nav>
            <p className="eyebrow mt-4">{EVENT_KINDS[e.kind]} · {ageLabel(e)} · Free</p>
            <h1 className="display-lg mt-3">{e.title}</h1>
            {e.status === "cancelled" && <p role="alert" className="mt-4 rounded-xl border border-[#F3B4AF] bg-[#FDF1F0] p-4 font-semibold text-[#8A1C14]">This event is cancelled: {e.cancel_reason}</p>}
            <p className="lede mt-4">{e.summary}</p>
            {e.description && <div className="mt-6 grid gap-3 whitespace-pre-line text-muted">{e.description}</div>}
          </div>
          <aside className="card grid content-start gap-3 p-6">
            <dl className="grid gap-3 text-sm">
              <div><dt className="text-muted">When</dt><dd className="font-semibold text-heading">{ist(e.starts_at)} · {e.duration_min >= 120 ? `${Math.round(e.duration_min / 60)} hours` : `${e.duration_min} minutes`}</dd></div>
              <div><dt className="text-muted">Where</dt><dd className="font-semibold text-heading">{e.mode === "online" ? "Online, on Robokalam" : `${e.venue}${e.city ? `, ${e.city}` : ""}`}</dd></div>
              {e.mode === "in_person" && e.responsible_adult && <div><dt className="text-muted">Responsible adult on site</dt><dd className="font-semibold text-heading">{e.responsible_adult}</dd></div>}
              <div><dt className="text-muted">Places</dt><dd className="font-semibold text-heading">{left > 0 ? `${left} of ${e.capacity} left` : "Full"}</dd></div>
            </dl>
            {open ? (
              <Link className="btn btn-primary" href={`/app/events/${e.slug}`}>{e.audience === "learners" ? "Register your child" : "Register"}</Link>
            ) : e.status !== "cancelled" ? <p className="font-semibold text-muted">{left === 0 ? "This event is full." : "Registration has closed."}</p> : null}
            {e.status === "published" && <a className="text-sm font-semibold text-link underline" href={`/api/events/${e.slug}/calendar`} download>Add to calendar</a>}
            {e.audience === "learners" && <p className="text-xs text-muted">Parents register children already on their Robokalam account. All contact stays on Robokalam.</p>}
          </aside>
        </div>
      </section>
    </>
  );
}
