import type { Metadata } from "next";
import Link from "next/link";
import { sortedPosts, readingMinutes, fmtDate } from "@/content/blog";
import { cities } from "@/content/cities";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { SITE } from "@/lib/site";
import { NewsletterForm } from "@/components/forms/Engage";

export const metadata: Metadata = {
  title: "Blog: robotics, AI and STEM education",
  description: "The Robokalam blog: robotics projects, AI for kids, STEM labs for schools, and guides for parents and college students in Hyderabad, Warangal and across India.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": [{ url: "/blog/rss.xml", title: "Robokalam blog" }] } },
  openGraph: { type: "website", url: "/blog", title: "The Robokalam blog", description: "Robotics projects, AI for kids, STEM labs and guides for parents, schools and college students." },
};

export default function BlogIndex() {
  const [featured, ...rest] = sortedPosts();
  const tags = [...new Set(sortedPosts().map((p) => p.tag))];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Blog", name: "The Robokalam blog", url: `${SITE.url}/blog`, inLanguage: "en-IN", publisher: { "@type": "Organization", name: SITE.name } }} />
      <section className="relative overflow-hidden pb-10 pt-12 sm:pb-14 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className="wrap relative">
          <p className="eyebrow">Blog</p>
          <h1 className="display-xl mt-3 max-w-4xl">Build notes from Robokalam.</h1>
          <p className="lede mt-4 max-w-3xl">Robotics projects, AI for kids, STEM labs for schools, and plain guides for parents and college students, in Hyderabad, Warangal and across India.</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
            {tags.map((t) => <li key={t}><a className="chip" href={`#${t.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{t}</a></li>)}
            <li><a className="chip" href="/blog/rss.xml">RSS feed</a></li>
          </ul>
        </div>
      </section>

      <section className="wrap pb-12" aria-label="Featured post">
        <Link href={`/blog/${featured.slug}`} className="consult-card grid gap-4 p-8 text-[#c9dbe5] sm:p-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#7FD0F2]">Latest · {featured.tag}</p>
            <h2 className="mt-3 text-3xl font-bold !text-white sm:text-4xl">{featured.title}</h2>
            <p className="mt-3 max-w-2xl">{featured.excerpt}</p>
          </div>
          <p className="text-sm lg:text-right"><time dateTime={featured.published}>{fmtDate(featured.published)}</time> · {readingMinutes(featured)} min read<span className="mt-3 block font-semibold text-white">Read the post →</span></p>
        </Link>
      </section>

      <section className="wrap pb-16" aria-label="All posts">
        {tags.map((t) => {
          const list = rest.filter((p) => p.tag === t);
          if (!list.length) return null;
          return (
            <div key={t} id={t.toLowerCase().replace(/[^a-z]+/g, "-")} className="scroll-mt-24 pb-10">
              <h2 className="text-2xl font-bold text-heading">{t}</h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <li key={p.slug} className="flex">
                    <Link href={`/blog/${p.slug}`} className="solution-card flex w-full flex-col p-6">
                      <p className="eyebrow !text-xs">{p.tag}{p.cities?.length ? ` · ${p.cities.map((c) => cities[c].name).join(" & ")}` : ""}</p>
                      <h3 className="mt-2 text-lg font-semibold text-heading">{p.title}</h3>
                      <p className="mt-2 text-muted">{p.excerpt}</p>
                      <p className="mt-auto pt-4 text-sm text-muted"><time dateTime={p.published}>{fmtDate(p.published)}</time> · {readingMinutes(p)} min read</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="wrap pb-12"><NewsletterForm source="blog" /></section>

      <section className="wrap pb-20" aria-labelledby="near-you">
        <h2 id="near-you" className="text-2xl font-bold text-heading">Robokalam near you</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {Object.values(cities).map((c) => <li key={c.id}><Link className="chip" href={`/locations/${c.id}`}>{c.name} <span lang="te">({c.te})</span></Link></li>)}
        </ul>
      </section>
    </>
  );
}
