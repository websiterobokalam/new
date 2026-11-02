import { notFound } from "next/navigation";
import { fellowContext } from "@/lib/fellows/context";
import { teach } from "@/lib/fellows/gigs";
import { inr } from "@/lib/money";
import { TeachForm, HelpButtons } from "@/components/fellow/GigActions";

export const metadata = { title: "Teach mode" };

export default async function TeachMode({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { account } = await fellowContext(`/app/fellow/gigs/${id}`);
  const t = await teach(account, id);
  if (!t) notFound();
  const g = t.gig;
  return (
    <section className="py-10"><div className="wrap grid gap-6 [&>*]:min-w-0">
      <header>
        <p className="eyebrow">Teach mode</p>
        <h1 className="display-lg mt-2">{g.title}</h1>
        <p className="lede mt-2">{new Date(g.starts_at).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" })} · {g.duration_min} min · {g.mode === "online" ? "Online (recorded on the platform)" : `${g.location} · responsible adult: ${g.responsible_adult}`} · {inr(g.pay_paise)}</p>
      </header>
      <div className="card p-5"><h2 className="text-lg font-bold">One-tap help</h2><p className="mb-3 text-sm text-muted">Reaches your point of contact. Safety goes straight to the Safeguarding Lead.</p><HelpButtons gigId={g.id} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5"><h2 className="text-lg font-bold">Lesson plan</h2><p className="mt-2 whitespace-pre-line text-muted">{g.lesson_plan ?? "Open with the build, demo it, let everyone try, debug together, show and tell, then one plain next step."}</p></div>
        <div className="card p-5"><h2 className="text-lg font-bold">Kit list</h2><p className="mt-2 whitespace-pre-line text-muted">{g.kit_list ?? "No kit needed."}</p></div>
      </div>
      <div className="card p-5">
        <h2 className="text-lg font-bold">Attendance and builds</h2>
        <p className="mb-4 text-sm text-muted">You see first name, age band and progress only.</p>
        <TeachForm gigId={g.id} roster={t.roster} projects={t.projects} delivered={g.my_status === "delivered"} opensAt={new Date(new Date(g.starts_at).getTime() - 15 * 60_000).toISOString()} />
      </div>
    </div></section>
  );
}
