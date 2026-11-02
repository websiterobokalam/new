import Link from "next/link";
import { fellowContext } from "@/lib/fellows/context";
import { academy } from "@/content/fellows/academy";
import { asAccount } from "@/lib/auth/session";

export const metadata = { title: "Kalam Academy" };

export default async function Academy() {
  const { account } = await fellowContext("/app/fellow/academy");
  const done = await asAccount(account, async (c) => new Set((await c.query("SELECT module_id FROM academy_progress WHERE fellow_id = $1", [account.id])).rows.map((r) => r.module_id)));
  return (
    <section className="py-10"><div className="wrap max-w-3xl grid gap-6">
      <header><p className="eyebrow">Step 4 · Kalam Academy · paid training</p><h1 className="display-lg mt-2">Learn how we teach.</h1>
        <p className="lede mt-2">Five short modules. The child-safety and POCSO modules need every answer right. Each module you pass is paid training time.</p></header>
      <ol className="grid gap-3">
        {academy.map((m, i) => (
          <li key={m.id} className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <span><span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")} · {m.minutes} min{m.passAll ? " · all answers right" : ""}</span><span className="block text-lg font-semibold text-heading">{m.title}</span></span>
            {done.has(m.id) ? <span className="rounded-full bg-leafmist px-3 py-1 text-sm font-semibold text-navy">Done</span> : <Link className="btn btn-primary !min-h-10 text-sm" href={`/app/fellow/academy/${m.id}`}>Start</Link>}
          </li>
        ))}
      </ol>
    </div></section>
  );
}
