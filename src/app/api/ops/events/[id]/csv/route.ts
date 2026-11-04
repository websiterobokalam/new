import { z } from "zod";
import { handler, HttpError, requireAccount } from "@/lib/api";
import { registrationsFor } from "@/lib/events";
import { audit, system } from "@/lib/db";

/** Who's coming, for running the event: first name, age band and the parent's email. */
export const GET = handler(async (_req, { params }) => {
  const a = await requireAccount();
  if (a.role !== "ops") throw new HttpError(403, "Not allowed");
  const id = z.string().uuid().parse((await params).id);
  const rows = await registrationsFor(id);
  await system((c) => audit(c, a.id, "event_registrations_exported", "event", id, { count: rows.length }));
  const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = ["name,age_band,contact_email,registered_at", ...rows.map((r) => [r.name, r.age_band ?? "adult", r.contact ?? "", new Date(r.created_at).toISOString()].map(esc).join(","))].join("\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="registrations.csv"', "cache-control": "no-store" } });
});
