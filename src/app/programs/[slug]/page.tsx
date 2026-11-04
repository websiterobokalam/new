import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programmes } from "@/content/site";
import { EXTERNAL } from "@/content/company";

export const dynamicParams = false;
export function generateStaticParams() {
  return programmes.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = programmes.find((x) => x.slug === slug);
  return { title: p ? `${p.name}${p.age ? ` (${p.age}+)` : ""}` : undefined, description: p ? `${p.outcome} ${p.intro}` : undefined };
}

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = programmes.find((x) => x.slug === slug);
  if (!p) notFound();
  const others = programmes.filter((x) => x.slug !== p.slug);
  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-12 sm:pb-16 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className={`wrap relative ${p.image ? "grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]" : "max-w-4xl"}`}>
          <div>
            <p className="eyebrow">{p.age ? `Ashaer track · age ${p.age}+` : "Bootcamp · teens and college"}</p>
            <h1 className="display-xl mt-3">{p.name}</h1>
            <p className="lede mt-4 font-semibold !text-heading">{p.outcome}</p>
            <p className="lede mt-3">{p.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn#book" className="btn btn-primary">Book a Free Build Session</Link>
              <Link href="/courses" className="btn btn-ghost">See dates and fees</Link>
            </div>
          </div>
          {p.image && <img src={p.image} alt="" width={720} height={480} className="w-full rounded-[1.5rem] bg-panel object-cover shadow-[var(--shadow-lift)]" />}
        </div>
      </section>

      <section className="pb-16" aria-labelledby="outcomes">
        <div className="wrap">
          <h2 id="outcomes" className="display-lg">What learners get</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.outcomes.map((o) => (
              <li key={o.title} className="solution-card p-6">
                <h3 className="text-lg font-semibold text-heading">{o.title}</h3>
                <p className="mt-2 text-muted">{o.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-panel/50 py-16" aria-labelledby="courses">
        <div className="wrap">
          <h2 id="courses" className="display-lg">Courses in {p.name}</h2>
          <ol className="mt-6 grid gap-4 lg:grid-cols-3">
            {p.courses.map((c, i) => (
              <li key={c.name} className="solution-card flex flex-col p-6">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Course {i + 1}{p.age ? ` · ages ${p.age}+` : ""}</p>
                <h3 className="mt-2 text-lg font-semibold text-heading">{c.name}</h3>
                <p className="mt-2 text-muted">{c.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">Dates, fees and the kit for each course are shown on <Link className="text-link underline" href="/courses">Courses</Link> before you pay. Already enrolled? Your class links are on the <a className="text-link underline" href={EXTERNAL.learn.href} target="_blank" rel="noopener noreferrer">learning portal<span className="sr-only"> (opens in a new tab)</span></a>.</p>
        </div>
      </section>

      <section className="py-16" aria-labelledby="more">
        <div className="wrap">
          <h2 id="more" className="text-2xl font-bold text-heading">More from Robokalam</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {others.map((o) => <li key={o.slug}><Link className="chip" href={`/programs/${o.slug}`}>{o.name}</Link></li>)}
            <li><Link className="chip" href="/kits">ASHAER Box</Link></li>
          </ul>
        </div>
      </section>
    </>
  );
}
