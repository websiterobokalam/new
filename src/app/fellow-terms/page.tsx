import type { Metadata } from "next";
import Link from "next/link";
import { anon } from "@/lib/db";
import { DbDown } from "@/components/app/DbDown";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kalam Fellow terms", description: "Plain terms for Kalam Fellows: pay, deductions, declining gigs, notice of changes, removal and disputes. In English, Telugu and Hindi." };

export default async function FellowTerms({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const q = (await searchParams).lang;
  const lang = q === "te" || q === "hi" ? q : "en";
  let docs;
  try {
    docs = await anon(async (c) => (await c.query(`SELECT id, kind, title, body, effective_at FROM (SELECT id, kind, title, body, effective_at, ROW_NUMBER() OVER (PARTITION BY kind ORDER BY effective_at DESC) AS rn FROM terms_versions WHERE language = $1 AND effective_at <= now()) t WHERE rn = 1 ORDER BY kind`, [lang])).rows);
  } catch { return <DbDown />; }
  return (
    <section className="py-12 sm:py-20"><div className="wrap grid max-w-3xl gap-6">
      <header><p className="eyebrow">Kalam Fellows</p><h1 className="display-lg mt-3">Fellow terms</h1>
        <p className="lede mt-3">Plain terms, published in full. Any change gives Fellows 14 days&apos; notice.</p>
        <p className="mt-2 text-sm text-muted">Draft pending legal review.</p></header>
      <nav aria-label="Language" className="flex gap-2">{[["en", "English"], ["te", "తెలుగు"], ["hi", "हिन्दी"]].map(([v, l]) => <Link key={v} href={`?lang=${v}`} lang={v} className="chip" aria-current={v === lang ? "true" : undefined}>{l}</Link>)}</nav>
      {docs.map((d) => (
        <article key={d.id} className="card p-6" lang={lang}>
          <h2 className="text-2xl font-bold">{d.title}</h2>
          <p className="mt-1 text-xs text-muted">Effective {new Date(d.effective_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          <dl className="mt-4 grid gap-4">{d.body.sections.map(([h, b]: [string, string]) => <div key={h}><dt className="font-semibold text-heading">{h}</dt><dd className="mt-1 text-muted">{b}</dd></div>)}</dl>
        </article>
      ))}
      <Link href="/fellows/apply" className="btn btn-primary justify-self-start">Become a Fellow</Link>
    </div></section>
  );
}
