import { notFound } from "next/navigation";
import { appContext } from "@/lib/app";
import { system } from "@/lib/db";
import { JsonForm } from "@/components/app/JsonForm";
import { findAccounts, CREATABLE_ROLES, ROLE_LABEL } from "@/lib/auth/accounts";
import { maskContact } from "@/lib/auth/mask";

export const metadata = { title: "Accounts and logins" };
export const dynamic = "force-dynamic";

const when = (x: Date | null) => (x ? new Date(x).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "never");

export default async function OpsAccounts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { account } = await appContext("/app/ops/accounts");
  if (account.role !== "ops") notFound();
  const q = (await searchParams).q?.slice(0, 80);
  const [people, schools] = await Promise.all([
    findAccounts(q),
    system(async (c) => (await c.query("SELECT id, name, city FROM schools WHERE status <> 'ended' ORDER BY name")).rows),
  ]);
  return (
    <section className="py-10">
      <div className="wrap grid gap-8 [&>*]:min-w-0">
        <header>
          <h1 className="display-lg">Accounts and logins</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Create a login for anyone who shouldn&apos;t sign themselves up: Robokalam staff, school staff, CSR partners or a parent who needs help. They sign in at their door with a one-time code sent to the email you enter, which also confirms it. Kalamites always apply and pass vetting, so they can&apos;t be created here.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <section className="card p-6" aria-labelledby="new-h">
            <h2 id="new-h" className="mb-4 text-xl font-bold">Create a login</h2>
            <JsonForm url="/api/ops/accounts" submit="Create login" done="Created. We emailed them how to sign in." fields={[
              { name: "name", label: "Full name" },
              { name: "email", label: "Email", type: "email", hint: "Their sign-in codes go here" },
              { name: "phone", label: "Mobile number (optional)", optional: true },
              { name: "role", label: "Role", type: "select", options: CREATABLE_ROLES.map((r) => [r, ROLE_LABEL[r]] as [string, string]) },
              { name: "schoolId", label: "School (for school admins and trainers)", type: "select", optional: true, options: [["", "Not a school role"], ...schools.map((s) => [s.id, `${s.name}, ${s.city}`] as [string, string])] },
            ]} />
          </section>
          <section aria-labelledby="list-h" className="grid content-start gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="list-h" className="text-xl font-bold">{q ? `Matching "${q}"` : "Newest accounts"}</h2>
              <form className="flex gap-2" role="search">
                <label className="sr-only" htmlFor="q">Find by email, phone or name</label>
                <input id="q" name="q" defaultValue={q} className="input !min-h-10" placeholder="Email, phone or name" />
                <button className="btn btn-ghost !min-h-10">Find</button>
              </form>
            </div>
            <ul className="grid gap-3">
              {people.map((p) => (
                <li key={p.id} className="card grid gap-2 p-4">
                  <p>
                    <strong className="text-heading">{p.display_name ?? "No name yet"}</strong> · {ROLE_LABEL[p.role] ?? p.role}{p.school ? ` at ${p.school}` : ""}
                    {p.disabled_at && <span className="ml-2 rounded-full bg-[#FDE2E1] px-2 py-0.5 text-xs font-bold text-[#8A1C14]">Switched off</span>}
                  </p>
                  <p className="text-sm text-muted">
                    {maskContact(p.login_email ?? p.email)}{p.phone_e164 ? ` · ${maskContact(p.phone_e164)}` : ""} · created {when(p.created_at)}{p.created_by ? " by ops or a school" : ""} · last sign-in {when(p.last_login)}
                  </p>
                  {p.id !== account.id && (
                    <JsonForm compact tone={p.disabled_at ? "primary" : "danger"} url={`/api/ops/accounts/${p.id}`} fixed={{ disabled: !p.disabled_at }}
                      submit={p.disabled_at ? `Switch on ${p.display_name ?? "login"}` : `Switch off ${p.display_name ?? "login"}`} done="Saved"
                      fields={[{ name: "reason", label: "Reason", hint: "Kept in the audit log" }]} />
                  )}
                </li>
              ))}
              {people.length === 0 && <li className="text-muted">No accounts found.</li>}
            </ul>
          </section>
        </div>
      </div>
    </section>
  );
}
