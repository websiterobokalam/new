import Link from "next/link";
import type { Action, Block, ContentPage } from "@/content/pages";
import { CONTACT, isExternal } from "@/content/company";
import { Claim } from "@/components/Claim";
import { SmartLink } from "@/components/SmartLink";
import { ContactForm, NewsletterForm } from "@/components/forms/Engage";
import { Gallery3D } from "@/components/Gallery3D";

function Actions({ actions }: { actions: Action[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((a) => <SmartLink key={a.href + a.label} href={a.href} className={`btn ${a.primary ? "btn-primary" : "btn-ghost"}`}>{a.label}</SmartLink>)}
    </div>
  );
}

const colsClass = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;

function BlockView({ b }: { b: Block }) {
  switch (b.kind) {
    case "prose":
      return (
        <section id={b.id} className="scroll-mt-24">
          {b.heading && <h2 className="text-2xl font-bold text-heading">{b.heading}</h2>}
          <div className="mt-3 grid gap-3 text-[1.05rem] leading-relaxed text-muted">
            {b.paras?.map((p) => <p key={p}>{p}</p>)}
            {b.bullets && (
              <ul className="grid gap-2 pl-5 [list-style:disc] marker:text-[var(--color-brand)]">
                {b.bullets.map((x) => <li key={x}>{x}</li>)}
              </ul>
            )}
            {b.after?.map((p) => <p key={p}>{p}</p>)}
          </div>
        </section>
      );
    case "cards":
      return (
        <section>
          {b.heading && <h2 className="text-2xl font-bold text-heading">{b.heading}</h2>}
          {b.lede && <p className="mt-2 text-muted">{b.lede}</p>}
          <ul className={`mt-5 grid gap-4 ${colsClass[b.cols ?? 3]}`}>
            {b.items.map((c) => {
              const inner = (
                <>
                  {c.image && <img src={c.image} alt="" loading="lazy" decoding="async" className="mb-4 aspect-[3/2] w-full rounded-xl bg-panel object-cover" />}
                  {c.tag && <p className="eyebrow !text-xs">{c.tag}</p>}
                  <h3 className="mt-1 text-lg font-semibold text-heading">{c.title}</h3>
                  <p className="mt-2 text-muted">{c.body}</p>
                  {c.href && <p className="mt-auto pt-4 font-semibold text-link">{c.cta ?? "Learn more"}{isExternal(c.href) ? " ↗" : " →"}</p>}
                </>
              );
              return (
                <li key={c.title} className="flex">
                  {c.href ? (
                    isExternal(c.href) ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="solution-card flex w-full flex-col p-6">{inner}<span className="sr-only"> (opens in a new tab)</span></a>
                    ) : (
                      <Link href={c.href} className="solution-card flex w-full flex-col p-6">{inner}</Link>
                    )
                  ) : (
                    <div className="solution-card flex w-full flex-col p-6">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      );
    case "faq":
      return (
        <section>
          {b.heading && <h2 className="text-2xl font-bold text-heading">{b.heading}</h2>}
          <div className="mt-4 grid gap-3">
            {b.items.map((f) => (
              <details key={f.q} className="group card px-5 py-4 open:shadow-[var(--shadow-lift)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-heading">
                  {f.q}
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      );
    case "people":
      return (
        <section>
          {b.heading && <h2 className="text-2xl font-bold text-heading">{b.heading}</h2>}
          {b.lede && <p className="mt-2 text-muted">{b.lede}</p>}
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {b.items.map((p) => (
              <li key={p.name} className="solution-card flex gap-4 p-6">
                <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold text-[var(--color-ink)]" style={{ background: "var(--kalam-gradient)" }}>
                  {p.name.replace(/^Md\.\s*/, "").split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-heading">{p.name}</h3>
                  <p className="text-sm font-semibold text-link">{p.role}</p>
                  <p className="mt-2 text-muted">{p.bio}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      );
    case "contact":
      return (
        <section aria-label="Contact details" className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="solution-card p-6">
            <h2 className="text-xl font-bold text-heading">Offices</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {CONTACT.offices.map((o) => (
                <li key={o.city}>
                  <p className="font-semibold text-heading">{o.city}{"main" in o && o.main ? <span className="ml-2 rounded-full bg-panel px-2 py-0.5 text-xs font-semibold text-link">Head office</span> : null}</p>
                  <address className="mt-1 not-italic text-muted">{o.line}</address>
                </li>
              ))}
            </ul>
          </div>
          <div className="consult-card p-6 text-[#c9dbe5]">
            <h2 className="text-xl font-bold !text-white">Call or write</h2>
            <ul className="mt-4 grid gap-3">
              {CONTACT.phones.map((p) => <li key={p.tel}><a className="text-lg font-semibold text-white hover:underline" href={`tel:${p.tel}`}>{p.label}</a></li>)}
              <li><a className="text-lg font-semibold text-white hover:underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li className="text-sm">{CONTACT.hours}</li>
            </ul>
          </div>
        </section>
      );
    case "claim":
      return <Claim id={b.id} as="p" className="lede" />;
    case "cta":
      return (
        <section className="consult-card flex flex-col gap-5 p-8 text-[#c9dbe5] sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold !text-white">{b.title}</h2>
            {b.body && <p className="mt-2 max-w-xl">{b.body}</p>}
          </div>
          <Actions actions={b.actions} />
        </section>
      );
    case "gallery":
      return <div className="-mx-4 sm:mx-0"><Gallery3D eyebrow="Photos" title={b.title} lede={b.lede} ids={b.ids} /></div>;
    case "form":
      return b.form === "contact" ? <ContactForm /> : <NewsletterForm source="page" />;
    case "note":
      return <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">{b.text}</p>;
  }
}

/** Just the blocks of a page, for pages that build their own top. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return <div className="grid gap-12">{blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>;
}

export function ContentPageView({ page }: { page: ContentPage }) {
  const toc = page.legal ? page.blocks.filter((b): b is Extract<Block, { kind: "prose" }> => b.kind === "prose" && !!b.id && !!b.heading) : [];
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-12 sm:pb-14 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className="wrap relative max-w-5xl">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1 className={`${page.legal ? "display-lg" : "display-xl"} mt-3 max-w-4xl`}>{page.title}</h1>
          <p className="lede mt-4 max-w-3xl">{page.lede}</p>
          {page.legal && (
            <p className="mt-4 text-sm text-muted">
              Last updated {page.legal.updated}. <span className="font-semibold text-heading">{page.legal.status}</span>
            </p>
          )}
          {page.actions && <div className="mt-8"><Actions actions={page.actions} /></div>}
        </div>
      </section>
      <div className={`wrap max-w-5xl pb-20 ${toc.length ? "grid gap-10 lg:grid-cols-[14rem_1fr]" : ""}`}>
        {toc.length > 0 && (
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">On this page</p>
            <ol className="mt-3 grid gap-1.5 text-sm">
              {toc.map((b) => <li key={b.id}><a className="text-muted hover:text-link" href={`#${b.id}`}>{b.heading}</a></li>)}
            </ol>
          </nav>
        )}
        <div className="grid gap-12">
          {page.blocks.map((b, i) => <BlockView key={i} b={b} />)}
        </div>
      </div>
    </>
  );
}
