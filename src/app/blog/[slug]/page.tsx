import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { posts, postBySlug, sortedPosts, readingMinutes, fmtDate } from "@/content/blog";
import { cities } from "@/content/cities";
import { JsonLd, blogPostingLd, breadcrumbLd } from "@/lib/jsonld";
import { NewsletterForm } from "@/components/forms/Engage";

export const dynamicParams = false;
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = postBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    keywords: p.keywords,
    authors: [{ name: p.author }],
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", url: `/blog/${p.slug}`, title: p.title, description: p.description, publishedTime: p.published, modifiedTime: p.updated ?? p.published, section: p.tag, tags: p.keywords },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = postBySlug((await params).slug);
  if (!p) notFound();
  const related = sortedPosts().filter((x) => x.slug !== p.slug && (x.tag === p.tag || x.cities?.some((c) => p.cities?.includes(c)))).concat(sortedPosts().filter((x) => x.slug !== p.slug)).filter((x, i, a) => a.findIndex((y) => y.slug === x.slug) === i).slice(0, 3);
  return (
    <article>
      <JsonLd data={blogPostingLd(p)} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }])} />
      <header className="relative overflow-hidden pb-8 pt-10 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className="wrap relative max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap gap-1.5">
              <li><Link className="hover:text-link" href="/">Home</Link> /</li>
              <li><Link className="hover:text-link" href="/blog">Blog</Link> /</li>
              <li aria-current="page" className="text-heading">{p.tag}</li>
            </ol>
          </nav>
          <h1 className="display-lg mt-4">{p.title}</h1>
          <p className="lede mt-4">{p.excerpt}</p>
          <p className="mt-4 text-sm text-muted">By {p.author} · <time dateTime={p.published}>{fmtDate(p.published)}</time>{p.updated ? <> · updated <time dateTime={p.updated}>{fmtDate(p.updated)}</time></> : null} · {readingMinutes(p)} min read</p>
        </div>
      </header>

      <div className="wrap max-w-3xl pb-12">
        <nav aria-label="In this post" className="rounded-xl border border-line p-4 text-sm">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">In this post</p>
          <ol className="mt-2 grid gap-1">{p.sections.map((s) => <li key={s.h2}><a className="text-link hover:underline" href={`#${anchor(s.h2)}`}>{s.h2}</a></li>)}</ol>
        </nav>
        <div className="mt-10 grid gap-10 text-[1.08rem] leading-relaxed text-muted">
          {p.sections.map((s) => (
            <section key={s.h2} id={anchor(s.h2)} className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-heading">{s.h2}</h2>
              <div className="mt-3 grid gap-3">
                {s.paras?.map((t) => <p key={t}>{t}</p>)}
                {s.bullets && <ul className="grid gap-2 pl-5 [list-style:disc] marker:text-[var(--color-brand)]">{s.bullets.map((t) => <li key={t}>{t}</li>)}</ul>}
                {s.steps && <ol className="grid gap-2 pl-5 [list-style:decimal] marker:font-semibold marker:text-[var(--color-brand)]">{s.steps.map((t) => <li key={t}>{t}</li>)}</ol>}
                {s.code && (
                  <pre className="overflow-x-auto rounded-xl bg-night p-4 text-sm leading-relaxed text-[#e6f4fb]" tabIndex={0} aria-label={`${s.code.lang} code`}><code>{s.code.text}</code></pre>
                )}
                {s.after?.map((t) => <p key={t}>{t}</p>)}
              </div>
            </section>
          ))}
        </div>

        <aside className="consult-card mt-12 flex flex-col gap-4 p-8 text-[#c9dbe5] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xl font-bold !text-white">Ready to build?</p>
          <Link href={p.cta.href} className="btn btn-primary">{p.cta.label}</Link>
        </aside>

        <div className="mt-10"><NewsletterForm source={`blog:${p.slug}`.slice(0, 40)} /></div>

        {p.cities?.length ? (
          <p className="mt-8 text-sm text-muted">
            Robokalam in {p.cities.map((c, i) => <span key={c}>{i ? " and " : ""}<Link className="text-link underline" href={`/locations/${c}`}>{cities[c].name}</Link></span>)}.
          </p>
        ) : null}
      </div>

      <section className="bg-panel/50 py-14" aria-labelledby="more-posts">
        <div className="wrap">
          <h2 id="more-posts" className="text-2xl font-bold text-heading">Keep reading</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug} className="flex">
                <Link href={`/blog/${r.slug}`} className="solution-card flex w-full flex-col p-6">
                  <p className="eyebrow !text-xs">{r.tag}</p>
                  <h3 className="mt-2 text-lg font-semibold text-heading">{r.title}</h3>
                  <p className="mt-auto pt-3 text-sm text-muted">{readingMinutes(r)} min read</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/blog" className="btn btn-ghost mt-6">All posts</Link>
        </div>
      </section>
    </article>
  );
}
