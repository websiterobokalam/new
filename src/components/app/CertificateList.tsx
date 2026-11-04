import Link from "next/link";

type Row = { code: string; title: string; holder_name: string; issued_at: Date; revoked_at: Date | null };

/** A person's own certificates, with a link to view, print and share each one. */
export function CertificateList({ rows, empty }: { rows: Row[]; empty: string }) {
  if (rows.length === 0) return <p className="mt-2 text-muted">{empty}</p>;
  return (
    <ul className="mt-3 grid gap-2">
      {rows.map((r) => (
        <li key={r.code} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
          <span>
            <strong className="text-heading">{r.title}</strong>
            <span className="block font-mono text-xs text-muted">{r.code} · {new Date(r.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}{r.revoked_at ? " · revoked" : ""}</span>
          </span>
          {!r.revoked_at && <Link className="font-semibold text-link underline" href={`/certificates/${r.code}`}>View and print<span className="sr-only">: {r.title}</span></Link>}
        </li>
      ))}
    </ul>
  );
}
