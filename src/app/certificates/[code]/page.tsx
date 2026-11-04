import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findCertificate, certificateUrl } from "@/lib/certificates";
import { SITE } from "@/lib/site";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificate", robots: { index: false, follow: false } };

const longDate = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const c = await findCertificate((await params).code);
  if (!c) notFound();
  return (
    <section className="py-10 print:py-0">
      <div className="wrap max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden" data-noprint>
          <Link href="/validate" className="text-sm font-semibold text-link underline">Check another certificate</Link>
          {!c.revoked && <PrintButton label="Print or save as PDF" />}
        </div>
        {c.revoked && (
          <p role="alert" className="mb-6 rounded-xl border border-[#F3B4AF] bg-[#FDF1F0] p-4 font-semibold text-[#8A1C14]">
            This certificate was revoked by Robokalam{c.revokeReason ? `: ${c.revokeReason}` : ""}. It is not valid.
          </p>
        )}
        <article aria-label="Certificate" className={`relative overflow-hidden rounded-[1.75rem] border-[6px] border-double border-[#0098D6] bg-white p-8 text-center text-[#04202F] shadow-[var(--shadow-lift)] sm:p-14 print:shadow-none ${c.revoked ? "opacity-50" : ""}`}>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2" style={{ background: "var(--kalam-gradient)" }} />
          <img src="/brand/robokalam-logo-400.png" alt="Robokalam, literature of technologies" width={200} height={56} className="mx-auto h-12 w-auto" />
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-[#00445F]">{c.kind === "kalamite" ? "Certificate of qualification" : "Certificate of completion"}</p>
          <p className="mt-6 text-lg text-[#3d5a6c]">This certifies that</p>
          <p className="mt-2 font-[family-name:var(--font-brand)] text-4xl font-bold text-[#00445F] sm:text-5xl">{c.holder}</p>
          <p className="mt-4 text-lg text-[#3d5a6c]">{c.kind === "kalamite" ? "has qualified as a" : "has successfully completed"}</p>
          <h1 className="mt-2 text-2xl font-bold !text-[#04202F] sm:text-3xl">{c.title}</h1>
          {c.detail && <p className="mx-auto mt-3 max-w-xl text-sm text-[#3d5a6c]">{c.detail}</p>}
          <dl className="mx-auto mt-10 grid max-w-2xl gap-4 text-sm sm:grid-cols-3">
            <div><dt className="font-mono text-xs uppercase tracking-wider text-[#3d5a6c]">Issued</dt><dd className="mt-1 font-semibold">{longDate(c.issuedAt)}</dd></div>
            <div><dt className="font-mono text-xs uppercase tracking-wider text-[#3d5a6c]">Certificate ID</dt><dd className="mt-1 font-mono font-semibold">{c.code}</dd></div>
            <div><dt className="font-mono text-xs uppercase tracking-wider text-[#3d5a6c]">Issued by</dt><dd className="mt-1 font-semibold">{SITE.legalName}</dd></div>
          </dl>
          <p className="mt-10 text-xs text-[#3d5a6c]">Check this certificate at {certificateUrl(c.code).replace(/^https?:\/\//, "")} or at {SITE.url.replace(/^https?:\/\//, "")}/validate</p>
        </article>
      </div>
    </section>
  );
}
