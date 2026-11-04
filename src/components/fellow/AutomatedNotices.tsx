import { system } from "@/lib/db";

/** Fair work: tell Kalamites about every automated check, 14 days before it takes effect. */
export async function AutomatedNotices({ ids }: { ids?: string[] }) {
  const rows = await system(async (c) => (await c.query(
    `SELECT id, name, description, affects, notice_at, effective_at FROM automated_systems ${ids ? "WHERE id IN ($1)" : ""} ORDER BY effective_at`, ids ? [ids] : [])).rows);
  if (!rows.length) return null;
  const d = (x: Date) => new Date(x).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <section className="card p-6" aria-labelledby="auto-h">
      <h2 id="auto-h" className="text-xl font-bold">Automated checks, and what they can and can&apos;t do</h2>
      <ul className="mt-3 grid gap-3">
        {rows.map((r) => (
          <li key={r.id} className="border-t border-line pt-3">
            <p className="font-semibold text-heading">{r.name} · {new Date(r.effective_at) > new Date() ? `starts ${d(r.effective_at)} (notice given ${d(r.notice_at)})` : `in use since ${d(r.effective_at)}`}</p>
            <p className="mt-1">{r.description}</p>
            <p className="mt-1 text-sm text-muted">{r.affects}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
