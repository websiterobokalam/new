import { schoolContext, ist } from "@/lib/schools/context";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";

export const metadata = { title: "Staff" };

const mask = (p: string) => p.slice(0, 3) + "•••••" + p.slice(-3);

export default async function SchoolStaff() {
  const { staff, account } = await schoolContext("/app/school/staff", "school_admin");
  const people = await system(async (c) => (await c.query(
    "SELECT st.account_id, st.display_name, st.role, st.added_at, a.phone_e164 FROM school_staff st JOIN accounts a ON a.id = st.account_id WHERE st.school_id = $1 AND st.removed_at IS NULL ORDER BY st.role, st.display_name",
    [staff.schoolId],
  )).rows);

  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Staff</h1>
          <p className="mt-2 max-w-2xl text-muted">Only people on this list can sign in at the school door. Removing someone signs them out at once.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="card p-6" aria-labelledby="add-h">
            <h2 id="add-h" className="mb-4 text-xl font-bold">Add someone</h2>
            <JsonForm url="/api/school/staff" submit="Add to staff" done="Added. They can sign in now." fields={[
              { name: "name", label: "Full name" },
              { name: "phone", label: "Mobile number", type: "text", hint: "They sign in with a code sent to this number" },
              { name: "email", label: "Email (optional)", type: "email", optional: true, hint: "We send a confirmation link, then ticket and booking updates" },
              { name: "role", label: "Role", type: "select", options: [["trainer", "Trainer or lab instructor"], ["school_admin", "School admin"]] },
            ]} />
          </section>
          <section aria-labelledby="list-h">
            <h2 id="list-h" className="text-xl font-bold">On the list</h2>
            <ul className="mt-3 grid gap-3">
              {people.map((p) => (
                <li key={p.account_id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                  <span><strong className="text-heading">{p.display_name}</strong> · {p.role === "school_admin" ? "School admin" : "Trainer"} · {mask(p.phone_e164)} · since {ist(p.added_at, { day: "numeric", month: "short", year: "numeric" })}</span>
                  {p.account_id !== account.id && <JsonForm compact tone="danger" url="/api/school/staff/remove" fixed={{ accountId: p.account_id }} submit={`Remove ${p.display_name}`} done="Removed" fields={[]} />}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
