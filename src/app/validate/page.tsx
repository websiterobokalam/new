import type { Metadata } from "next";
import Link from "next/link";
import { findCertificate, normaliseCode } from "@/lib/certificates";
import { CONTACT, EXTERNAL } from "@/content/company";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Validate a Robokalam certificate",
  description: "Check that a Robokalam certificate is genuine: enter the certificate ID printed on it.",
  alternates: { canonical: "/validate" },
};

const longDate = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function Validate({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const raw = (await searchParams).code?.slice(0, 40) ?? "";
  const asked = raw.trim().length > 0;
  const valid = asked ? normaliseCode(raw) : null;
  const cert = valid ? await findCertificate(valid) : null;
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Validate a certificate", path: "/validate" }])} />
      <section className="relative overflow-hidden pb-16 pt-12 sm:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 70% at 85% 0%, rgba(0,152,214,.16), transparent 70%)" }} />
        <div className="wrap relative max-w-3xl">
          <p className="eyebrow">Certificates</p>
          <h1 className="display-xl mt-3">Validate a Robokalam certificate.</h1>
          <p className="lede mt-4">Every certificate Robokalam issues has a unique ID, like <span className="font-mono">RK-7KQ2M-9XB4D</span>. Enter it to check the certificate is genuine and see who it was issued to and for what.</p>

          <form method="get" action="/validate" className="card mt-8 grid gap-3 p-6 sm:grid-cols-[1fr_auto] sm:items-end" role="search">
            <label className="grid gap-1.5" htmlFor="code">
              <span className="font-semibold text-heading">Certificate ID</span>
              <input id="code" name="code" defaultValue={raw} className="input font-mono uppercase" placeholder="RK-XXXXX-XXXXX" autoComplete="off" spellCheck={false} aria-describedby={asked ? "result" : undefined} />
            </label>
            <button className="btn btn-primary">Check</button>
          </form>

          {asked && (
            <div id="result" role="status" className="mt-6">
              {cert && !cert.revoked ? (
                <div className="rounded-2xl border border-[#9AD9B5] bg-leafmist p-6 text-navy">
                  <p className="text-lg font-bold">✓ Genuine Robokalam certificate</p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div><dt className="text-sm">Issued to</dt><dd className="font-semibold">{cert.holder}</dd></div>
                    <div><dt className="text-sm">For</dt><dd className="font-semibold">{cert.title}</dd></div>
                    <div><dt className="text-sm">Issued on</dt><dd className="font-semibold">{longDate(cert.issuedAt)}</dd></div>
                    <div><dt className="text-sm">ID</dt><dd className="font-mono font-semibold">{cert.code}</dd></div>
                  </dl>
                  <Link className="mt-4 inline-block font-semibold underline" href={`/certificates/${cert.code}`}>View the certificate</Link>
                </div>
              ) : cert && cert.revoked ? (
                <div className="rounded-2xl border border-[#F3B4AF] bg-[#FDF1F0] p-6 text-[#8A1C14]">
                  <p className="text-lg font-bold">This certificate was revoked</p>
                  <p className="mt-1">ID {cert.code} was issued by Robokalam but is no longer valid{cert.revokeReason ? `: ${cert.revokeReason}` : "."}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-panel p-6">
                  <p className="text-lg font-bold text-heading">{valid ? "We couldn't find that certificate" : "That doesn't look like a Robokalam certificate ID"}</p>
                  <p className="mt-1 text-muted">
                    Check the ID on the certificate and try again. Certificates issued before November 2026 are checked on{" "}
                    <a className="font-semibold text-link underline" href={EXTERNAL.validate.href} target="_blank" rel="noopener noreferrer">validate.robokalam.com<span className="sr-only"> (opens in a new tab)</span></a>.
                    Still stuck? Write to <a className="font-semibold text-link underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="solution-card p-6">
              <h2 className="text-lg font-semibold text-heading">Older certificates</h2>
              <p className="mt-2 text-muted">Certificates from workshops, camps and bootcamps before November 2026 are on our earlier validation site.</p>
              <a className="mt-3 inline-block font-semibold text-link" href={EXTERNAL.validate.href} target="_blank" rel="noopener noreferrer">validate.robokalam.com ↗<span className="sr-only"> (opens in a new tab)</span></a>
            </div>
            <div className="solution-card p-6">
              <h2 className="text-lg font-semibold text-heading">What we show</h2>
              <p className="mt-2 text-muted">Only what's printed on the certificate. A learner's certificate shows their first name only, and families decide who gets the ID.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
