import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { thread } from "@/lib/fellows/community";
import { Composer } from "@/components/app/Messaging";

export const metadata = { title: "Conversation" };

export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { account } = await appContext(`/app/messages/${id}`);
  const t = await thread(account, id);
  if (!t) notFound();
  return (
    <section className="py-10"><div className="wrap grid max-w-3xl gap-6">
      <header><p className="eyebrow">{t.title}</p><h1 className="display-md mt-2">With {account.role === "fellow" ? "the parent" : t.fellow_name}</h1></header>
      <ol className="grid gap-2" aria-label="Messages">
        {t.messages.length === 0 && <li className="text-muted">No messages yet.</li>}
        {t.messages.map((m: { id: string; body: string; blocked: boolean; mine: boolean; created_at: string }) => (
          <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.mine ? "justify-self-end bg-navy text-white dark:bg-aqua dark:text-night" : "justify-self-start border border-line bg-surface"}`}>
            {m.blocked ? <em>Not delivered: contained contact details.</em> : m.body}
            <span className="mt-1 block text-[0.7rem] opacity-75">{new Date(m.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</span>
          </li>
        ))}
      </ol>
      <Composer threadId={t.id} />
    </div></section>
  );
}
