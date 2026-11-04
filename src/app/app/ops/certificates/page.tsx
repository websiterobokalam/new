import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { JsonForm } from "@/components/app/JsonForm";
import { recentCertificates } from "@/lib/certificates";

export const metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

const when = (d: Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function OpsCertificates() {
  const { account } = await appContext("/app/ops/certificates");
  if (account.role !== "ops") notFound();
  const rows = await recentCertificates();
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Certificates</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Issued on their own: a course certificate when a learner has attended every session, and the Kalamite certificate when a Kalamite goes live. Anyone can check one at <Link className="text-link underline" href="/validate">/validate</Link>. Revoke one only if it was issued in error; the public check will say so.
          </p>
        </header>
        <section className="card max-w-xl p-6" aria-labelledby="issue-h">
          <h2 id="issue-h" className="mb-4 text-xl font-bold">Issue for a booking</h2>
          <JsonForm url="/api/ops/certificates" submit="Issue certificate" done="Issued. The parent has been emailed." fields={[{ name: "bookingId", label: "Booking ID", hint: "For an attended booking of a course, for example after an offline class" }]} />
        </section>
        <section aria-labelledby="list-h">
          <h2 id="list-h" className="text-xl font-bold">Recently issued</h2>
          <ul className="mt-3 grid gap-3">
            {rows.map((r) => (
              <li key={r.code} className="card grid gap-2 p-4">
                <p>
                  <Link className="font-mono font-semibold text-link underline" href={`/certificates/${r.code}`}>{r.code}</Link> · <strong className="text-heading">{r.holder_name}</strong> · {r.title} · {r.kind === "kalamite" ? "Kalamite" : "Course"} · {when(r.issued_at)}
                  {r.revoked_at && <span className="ml-2 rounded-full bg-[#FDE2E1] px-2 py-0.5 text-xs font-bold text-[#8A1C14]">Revoked: {r.revoke_reason}</span>}
                </p>
                {!r.revoked_at && (
                  <JsonForm compact tone="danger" url={`/api/ops/certificates/${r.code}`} submit={`Revoke ${r.code}`} done="Revoked" fields={[{ name: "reason", label: "Reason", hint: "Shown on the public check" }]} />
                )}
              </li>
            ))}
            {rows.length === 0 && <li className="text-muted">No certificates yet.</li>}
          </ul>
        </section>
      </div>
    </section>
  );
}
