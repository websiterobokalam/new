import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cities, cityList, type CityId } from "@/content/cities";
import { posts, readingMinutes } from "@/content/blog";
import { CONTACT } from "@/content/company";
import { Gallery3D } from "@/components/Gallery3D";
import { JsonLd, breadcrumbLd, cityLd, faqLd } from "@/lib/jsonld";

export const dynamicParams = false;
export function generateStaticParams() {
  return cityList.map((c) => ({ city: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const c = cities[(await params).city as CityId];
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    keywords: [`robotics classes in ${c.name}`, `coding classes for kids ${c.name}`, `AI classes ${c.name}`, `STEM lab for schools ${c.name}`, `robotics lab ${c.name}`, `STEM education ${c.region}`],
    alternates: { canonical: `/locations/${c.id}` },
    openGraph: { type: "website", url: `/locations/${c.id}`, title: `Robokalam ${c.name}`, description: c.description, locale: "en_IN" },
    other: { "geo.region": "IN-TG", "geo.placename": c.name, "geo.position": `${c.geo.lat};${c.geo.lng}`, ICBM: `${c.geo.lat}, ${c.geo.lng}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const c = cities[(await params).city as CityId];
  if (!c) notFound();
  const local = posts.filter((p) => p.cities?.includes(c.id));
  const tiles = [
    { tag: "For parents", title: `Classes for kids in ${c.name}`, body: c.learners, href: "/learn#book", cta: "Book a Free Build Session" },
    { tag: "For schools", title: `STEM & AI labs for ${c.name} schools`, body: c.schools, href: "/21c-lab#demo", cta: "Book a Turnkey Demo" },
    { tag: "For college students", title: `Teach from ${c.name}`, body: c.colleges, href: "/kalamites/apply", cta: "Become a Kalamite" },
  ];
  return (
    <>
      <JsonLd data={cityLd(c)} />
      <JsonLd data={faqLd(c.faqs)} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }, { name: c.name, path: `/locations/${c.id}` }])} />
      <section className="relative overflow-hidden pb-12 pt-12 sm:pb-16 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.18), transparent 70%)" }} />
        <div className="wrap relative">
          <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link className="hover:text-link" href="/locations">Locations</Link> / <span className="text-heading">{c.name}</span></nav>
          <p className="eyebrow mt-4">{c.name}, {c.region} · <span lang="te">{c.te}</span></p>
          <h1 className="display-xl mt-3 max-w-4xl">{c.h1}</h1>
          <p className="lede mt-4 max-w-3xl">{c.lede}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/learn#book" className="btn btn-primary">Book a Free Build Session</Link>
            <Link href="/21c-lab#demo" className="btn btn-ghost">Book a Turnkey Demo</Link>
          </div>
        </div>
      </section>

      <section className="wrap pb-16" aria-label={`Robokalam in ${c.name}`}>
        <ul className="grid gap-4 lg:grid-cols-3">
          {tiles.map((t) => (
            <li key={t.title} className="flex">
              <Link href={t.href} className="solution-card flex w-full flex-col p-6">
                <p className="eyebrow !text-xs">{t.tag}</p>
                <h2 className="mt-2 text-xl font-semibold text-heading">{t.title}</h2>
                <p className="mt-2 text-muted">{t.body}</p>
                <p className="mt-auto pt-4 font-semibold text-link">{t.cta} →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Gallery3D eyebrow={`Robokalam in ${c.name}`} title={c.id === "warangal" ? "Building in Warangal." : "Building in Hyderabad."} ids={c.id === "warangal" ? ["science-day-warangal", "space-zone", "robot-soccer", "iot-sensor-project"] : ["t-hub-event", "tgic-innovation-panchayat", "robotics-zone", "coding-zone"]} />
      <section className="bg-panel/50 py-16" aria-labelledby="areas">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="areas" className="display-lg">Areas we serve in and around {c.name}</h2>
            <ul className="mt-5 flex flex-wrap gap-2">{c.areas.map((a) => <li key={a} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">{a}</li>)}</ul>
            <p className="mt-5 text-muted">Live classes are online, so every neighbourhood is covered. In-person sessions happen only at partner schools and centres, with a responsible adult present.</p>
          </div>
          <div className="solution-card p-6">
            <h2 className="text-xl font-bold text-heading">{c.office ? `Visit us in ${c.name}` : `Talk to our team about ${c.name}`}</h2>
            {c.office && <address className="mt-3 not-italic text-muted">{c.office.street}, {c.office.locality}, {c.region} {c.office.postalCode}</address>}
            <ul className="mt-3 grid gap-1.5">
              {CONTACT.phones.map((p) => <li key={p.tel}><a className="font-semibold text-link" href={`tel:${p.tel}`}>{p.label}</a></li>)}
              <li><a className="font-semibold text-link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li className="text-sm text-muted">{CONTACT.hours}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="city-faq">
        <div className="wrap max-w-3xl">
          <h2 id="city-faq" className="display-lg">{c.name}: common questions</h2>
          <div className="mt-6 grid gap-3">
            {c.faqs.map((f) => (
              <details key={f.q} className="group card px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-heading">{f.q}<span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {local.length > 0 && (
        <section className="wrap pb-20" aria-labelledby="city-posts">
          <h2 id="city-posts" className="text-2xl font-bold text-heading">From the blog</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {local.map((p) => (
              <li key={p.slug} className="flex">
                <Link href={`/blog/${p.slug}`} className="solution-card flex w-full flex-col p-6">
                  <p className="eyebrow !text-xs">{p.tag}</p>
                  <h3 className="mt-2 text-lg font-semibold text-heading">{p.title}</h3>
                  <p className="mt-auto pt-3 text-sm text-muted">{readingMinutes(p)} min read</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
