import type { Metadata } from "next";
import { upcomingEvents } from "@/lib/events";
import { events as formats } from "@/content/pages/company";
import { Blocks } from "@/components/content/ContentBlocks";
import { EventCard } from "@/components/EventCard";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Events: Code Week, workshops and camps",
  description: "Upcoming Robokalam events in Hyderabad, Warangal and online: Ashaers Code Week, robotics workshops, summer camps, science fairs and teacher training. Free to attend.",
  alternates: { canonical: "/events" },
};

export default async function Events() {
  const list = await upcomingEvents().catch(() => []);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Events", path: "/events" }])} />
      <section className="relative overflow-hidden pb-10 pt-12 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className="wrap relative max-w-5xl">
          <p className="eyebrow">Events</p>
          <h1 className="display-xl mt-3 max-w-4xl">{formats.title}</h1>
          <p className="lede mt-4 max-w-3xl">{formats.lede} Every event is free to attend.</p>
        </div>
      </section>
      <section className="wrap max-w-5xl pb-14" aria-labelledby="upcoming-h">
        <h2 id="upcoming-h" className="text-2xl font-bold text-heading">Coming up</h2>
        {list.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line p-6 text-muted">No events open for registration right now. New dates are added here and in the newsletter.</p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">{list.map((e) => <li key={e.id} className="flex"><EventCard e={e} /></li>)}</ul>
        )}
      </section>
      <section className="wrap max-w-5xl pb-20" aria-label="What we run">
        <Blocks blocks={formats.blocks} />
      </section>
    </>
  );
}
