import Link from "next/link";
import { fellowContext } from "@/lib/fellows/context";
import { asAccount } from "@/lib/auth/session";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Kalamite terms" };

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { account, steps } = await fellowContext("/app/fellow/terms");
  const lang = ["en", "te", "hi"].includes((await searchParams).lang ?? "") ? (await searchParams).lang! : "en";
  const { docs, upcoming, accepted } = await asAccount(account, async (c) => ({
    docs: (await c.query(
      `SELECT id, kind, title, body, effective_at FROM (SELECT id, kind, title, body, effective_at, ROW_NUMBER() OVER (PARTITION BY kind ORDER BY effective_at DESC) AS rn FROM terms_versions WHERE language = $1 AND effective_at <= now()) t WHERE rn = 1 ORDER BY kind`, [lang])).rows,
    // Published but not yet in effect: shown during the 14-day notice.
    upcoming: (await c.query("SELECT id, kind, title, body, effective_at FROM terms_versions WHERE language = $1 AND effective_at > now() ORDER BY effective_at", [lang])).rows,
    accepted: new Set((await c.query("SELECT terms_id FROM terms_acceptances WHERE fellow_id = $1", [account.id])).rows.map((r) => r.terms_id as string)),
  }));
  const needsAccept = steps.terms.status !== "passed" || docs.some((d) => !accepted.has(d.id));
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Step 5 · Terms and code of conduct</p><h1 className="display-lg mt-2">Plain terms. No small print.</h1>
        <p className="mt-2 text-sm text-muted">Draft pending legal review. Any change gives you 14 days&apos; notice.</p></header>
      <nav aria-label="Language" className="flex gap-2">{[["en", "English"], ["te", "తెలుగు"], ["hi", "हिन्दी"]].map(([v, l]) => <Link key={v} href={`?lang=${v}`} className="chip" aria-current={v === lang ? "true" : undefined} lang={v}>{l}</Link>)}</nav>
      {upcoming.map((d) => (
        <article key={d.id} className="card border-heading p-6" lang={lang} aria-label={`Coming: ${d.title}`}>
          <p className="font-semibold text-heading">Coming on {new Date(d.effective_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}: you&apos;ll be asked to accept this then.</p>
          <h2 className="mt-2 text-2xl font-bold">{d.title}</h2>
          <dl className="mt-4 grid gap-4">{d.body.sections.map(([h, b]: [string, string]) => <div key={h}><dt className="font-semibold text-heading">{h}</dt><dd className="mt-1 text-muted">{b}</dd></div>)}</dl>
        </article>
      ))}
      {docs.map((d) => (
        <article key={d.id} className="card p-6" lang={lang}>
          <h2 className="text-2xl font-bold">{d.title}</h2>
          <dl className="mt-4 grid gap-4">{d.body.sections.map(([h, b]: [string, string]) => <div key={h}><dt className="font-semibold text-heading">{h}</dt><dd className="mt-1 text-muted">{b}</dd></div>)}</dl>
        </article>
      ))}
      {!needsAccept ? <p className="card p-6 font-semibold">Accepted. You can read these here any time.</p> : (
        <div className="card p-6"><JsonForm url="/api/fellow/terms" fixed={{ termIds: docs.map((d) => d.id) }} redirect="/app/fellow" submit="I accept the terms and the code of conduct" fields={[]} /></div>
      )}
    </div></section>
  );
}
