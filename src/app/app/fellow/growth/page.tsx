import { fellowContext } from "@/lib/fellows/context";
import { asAccount } from "@/lib/auth/session";
import { metrics, suggestTier, TIER_RULES } from "@/lib/fellows/tiers";
import { SITE } from "@/lib/site";
import { system } from "@/lib/db";
import { AutomatedNotices } from "@/components/fellow/AutomatedNotices";
import { tierLabel } from "@/lib/fellows/gigs";
import { CertificateList } from "@/components/app/CertificateList";

export const metadata = { title: "Growth" };

export default async function Growth() {
  const { account, fellow } = await fellowContext("/app/fellow/growth");
  const { m, hours, certificates } = await asAccount(account, async (c) => ({
    certificates: (await c.query("SELECT code, title, holder_name, issued_at, revoked_at FROM certificates WHERE fellow_id = $1 ORDER BY issued_at DESC", [account.id])).rows,
    m: await metrics(c, account.id),
    hours: (await c.query("SELECT coalesce(sum(g.duration_min),0) AS m FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id WHERE ga.fellow_id = $1 AND ga.status = 'delivered'", [account.id])).rows[0].m / 60,
  }));
  const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
  return (
    <section className="py-10"><div className="wrap grid gap-8 [&>*]:min-w-0">
      <header><p className="eyebrow">Growth · level: {tierLabel(fellow.tier)}</p><h1 className="display-lg mt-2">Rise on reliability, progress and feedback.</h1>
        <p className="lede mt-2">Not popularity. Not hours. Not how often you say yes.</p></header>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Sessions delivered", String(m.delivered)], ["Reliability", pct(m.reliability)], ["Builds per session", m.progress === null ? "—" : m.progress.toFixed(1)], ["Verified rating", m.rating === null ? "—" : `${m.rating} (${m.reviews})`]].map(([k, v]) => <div key={k} className="card p-5"><p className="text-sm text-muted">{k}</p><p className="mt-1 text-2xl font-bold text-heading">{v}</p></div>)}
      </div>
      <section className="card p-6" aria-labelledby="cert-h">
        <h2 id="cert-h" className="text-xl font-bold">Your Kalamite certificate</h2>
        <CertificateList rows={certificates} empty="Issued when you go live, after every check and Kalam Academy." />
      </section>
      <section id="formula" className="card p-6">
        <h2 className="text-xl font-bold">How tiers work (the formula)</h2>
        <p className="mt-1 text-sm text-muted">Reliability = sessions delivered ÷ sessions you committed to that went ahead. Declines and Exam Mode never count. A person confirms every tier change, and tiers are never lowered automatically. Draft thresholds.</p>
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Tier thresholds">
          <table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-line text-muted"><th className="py-2">Tier</th><th>Sessions</th><th>Reliability</th><th>Builds/session</th><th>Rating</th></tr></thead>
            <tbody>{TIER_RULES.map((r) => <tr key={r.tier} className="border-b border-line/60"><td className="py-2 font-semibold">{tierLabel(r.tier)}</td><td>{r.delivered}+</td><td>{Math.round(r.reliability * 100)}%+</td><td>{r.progress}+</td><td>{r.rating ? `${r.rating}+ from ${r.reviews}+ reviews` : "—"}</td></tr>)}</tbody></table>
        </div>
        <p className="mt-3 text-sm">Your numbers suggest: <strong>{tierLabel(suggestTier(m))}</strong></p>
        <h3 className="mt-6 font-bold">How gig matching works</h3>
        <p className="mt-1 text-sm text-muted">You see open gigs that match your tier, a language you teach in, and your city for in-person gigs. They are ordered by your worlds first, then earliest start. We do not collect or use religion, caste, gender, place of birth, disability or any similar characteristic, and declines are never used. Changes come with 14 days&apos; notice.</p>
      </section>
      <section className="card p-6">
        <h2 className="text-xl font-bold">Proof of teaching</h2>
        <p className="mt-2">This letter confirms that <strong>{fellow.full_name}</strong> of {fellow.college} has delivered <strong>{hours.toFixed(1)} verified teaching hours</strong> with {SITE.legalName} as a Kalamite, as of {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.</p>
        <p className="mt-2 text-sm text-muted">Signed letters and the Kalamite teaching certificate become verifiable at /validate once that service is connected. Kalamites with strong records get first look at Robokalam internships and jobs.</p>
      </section>
      <FlagsAboutMe fellowId={fellow.account_id} />
      <AutomatedNotices ids={["session-signals"]} />
    </div></section>
  );
}

/** Transparency: every flag about this Kalamite, and what a person decided. */
async function FlagsAboutMe({ fellowId }: { fellowId: string }) {
  const flags = await system(async (c) => (await c.query(
    "SELECT code, message, status, decision_note, created_at FROM quality_flags WHERE subject_type = 'fellow' AND fellow_id = $1 ORDER BY created_at DESC LIMIT 20", [fellowId])).rows);
  return (
    <section className="card p-6" aria-labelledby="flags-h">
      <h2 id="flags-h" className="text-xl font-bold">Quality signals about you</h2>
      {flags.length === 0 ? <p className="mt-2 text-muted">None. Nothing for you to do.</p> : (
        <ul className="mt-3 grid gap-2">
          {flags.map((f) => <li key={f.code} className="border-t border-line pt-2">{f.message} <span className="text-sm text-muted">({f.status === "open" ? "your point of contact will talk it through with you" : `${f.status === "dismissed" ? "cleared" : "discussed"}: ${f.decision_note}`})</span></li>)}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted">Signals never change your tier, pay or gigs by themselves. A person decides, with written reasons you can see here and dispute.</p>
    </section>
  );
}
