import { appContext } from "@/lib/app";
import { asAccount } from "@/lib/auth/session";
import { currentConsents, getNotice, REQUIRED } from "@/lib/learn/consent";
import { ConsentToggle, DeleteLearner } from "@/components/app/ConsentControls";

export const metadata = { title: "Consent centre" };

export default async function ConsentCentre({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const { account, t } = await appContext("/app/consent");
  const deleted = (await searchParams).deleted === "1";
  const d = await asAccount(account, async (c) => {
    const notice = await getNotice(c, account.language);
    const learners = (await c.query("SELECT id, first_name, age_band FROM learners WHERE erased_at IS NULL ORDER BY created_at")).rows;
    const states = await Promise.all(learners.map(async (l) => ({ ...l, consents: await currentConsents(c, l.id) })));
    const history = (await c.query("SELECT e.purpose, e.granted, e.created_at, l.first_name FROM consent_events e JOIN learners l ON l.id = e.learner_id ORDER BY e.id DESC LIMIT 30")).rows;
    const requests = (await c.query("SELECT kind, status, created_at FROM data_requests ORDER BY created_at DESC LIMIT 10")).rows;
    return { notice, learners: states, history, requests };
  });
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <p className="eyebrow">{t.consent_centre}</p>
          <h1 className="display-lg mt-2">Your family&apos;s data, your call.</h1>
          <p className="lede mt-2">Turn each item on or off at any time. Withdrawing is as easy as agreeing.</p>
        </header>
        {deleted && <p role="status" className="rounded-2xl bg-leafmist p-4 font-semibold text-navy dark:bg-panel-2 dark:text-heading">{t.delete_requested}</p>}
        {d.learners.length === 0 && <p className="text-muted">No learners yet.</p>}
        {d.learners.map((l) => (
          <section key={l.id} className="card overflow-hidden" aria-labelledby={`c-${l.id}`}>
            <h2 id={`c-${l.id}`} className="border-b border-line p-5 text-2xl font-bold">{l.first_name} <span className="text-base font-normal text-muted">· {l.age_band}</span></h2>
            <ul className="divide-y divide-line">
              {d.notice.body.items.map((it) => (
                <li key={it.purpose} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-heading">{it.why}</p>
                    <p className="text-sm text-muted">{it.what} {it.keep}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{REQUIRED.includes(it.purpose) ? t.consent_required : t.consent_optional}</p>
                  </div>
                  <ConsentToggle learnerId={l.id} purpose={it.purpose} granted={l.consents[it.purpose]} label={`${l.first_name}: ${it.why}`} t={t} />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-5">
              <p className="text-sm text-muted">{t.consent_withdraw_note}</p>
              <DeleteLearner learnerId={l.id} t={t} />
            </div>
          </section>
        ))}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-bold">Your data</h2>
            <p className="mt-2 text-muted">Download everything we hold about your family as a file.</p>
            <a href="/api/app/export" className="btn btn-ghost mt-4">{t.download_data}</a>
            {d.requests.length > 0 && <ul className="mt-4 text-sm">{d.requests.map((r, i) => <li key={i}>{r.kind === "erase" ? "Deletion request" : "Export"} · {r.status} · {new Date(r.created_at).toLocaleDateString("en-IN")}</li>)}</ul>}
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-bold">Consent history</h2>
            <ul className="mt-3 grid gap-1 text-sm">{d.history.map((h, i) => <li key={i}>{new Date(h.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {h.first_name} · {h.purpose.replace("_", " ")} · <strong>{h.granted ? t.consent_on : t.consent_off}</strong></li>)}</ul>
          </div>
        </section>
        <p className="text-sm text-muted">{d.notice.body.grievance}</p>
      </div>
    </section>
  );
}
