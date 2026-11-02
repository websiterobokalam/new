import Link from "next/link";
import { appContext } from "@/lib/app";
import { threadsFor } from "@/lib/fellows/community";

export const metadata = { title: "Messages" };

export default async function Messages() {
  const { account } = await appContext("/app/messages");
  const threads = await threadsFor(account);
  return (
    <section className="py-10"><div className="wrap grid max-w-3xl gap-6">
      <header><p className="eyebrow">Messages</p><h1 className="display-lg mt-2">Messages</h1>
        <p className="lede mt-2">Between parents and their child&apos;s educator, about a class. Contact details are always blocked; Robokalam staff can review threads for safety.</p></header>
      {threads.length === 0 ? <p className="card p-6 text-muted">No conversations yet. Parents can message the educator from an upcoming class on the family home.</p> : (
        <ul className="grid gap-3">{threads.map((t) => (
          <li key={t.id}><Link href={`/app/messages/${t.id}`} className="card block p-5 hover:shadow-[var(--shadow-lift)]">
            <p className="font-semibold text-heading">{t.title} · {t.i_am_parent ? t.fellow_name : "Parent"}</p>
            <p className="truncate text-sm text-muted">{t.last ?? "No messages yet"}</p>
          </Link></li>
        ))}</ul>
      )}
    </div></section>
  );
}
