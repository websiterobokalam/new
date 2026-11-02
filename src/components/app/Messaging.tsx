"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";

export function Composer({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [note, setNote] = useState<string>();
  const [busy, setBusy] = useState(false);
  // Uncontrolled on purpose: text typed before the page finishes loading on a slow phone is kept.
  return (
    <form className="grid gap-2" onSubmit={async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const body = String(new FormData(form).get("body") ?? "").trim();
      if (!body) return setNote("Write a message first.");
      setBusy(true);
      const r = await post<{ delivered: boolean }>(`/api/messages/${threadId}`, { body });
      setBusy(false);
      if (!r.ok) return setNote(r.error);
      setNote(r.delivered ? undefined : "Not sent: it looked like it had contact details (a number, email, link or social handle). Please keep all contact on Robokalam.");
      form.reset(); router.refresh();
    }}>
      <label className="field"><span className="sr-only">Message</span><textarea name="body" className="input min-h-20" maxLength={2000} placeholder="Write a message" /></label>
      {note && <p role="alert" className="rounded-xl bg-[#FEEBD0] p-3 text-sm font-semibold text-[#6B3F00]">{note}</p>}
      <button className="btn btn-primary justify-self-start" disabled={busy}>Send</button>
    </form>
  );
}

export function MessageEducator({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string>();
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className="text-sm font-semibold text-link underline" onClick={async () => {
        const r = await post<{ threadId: string }>("/api/messages/open", { bookingId });
        if (r.ok) router.push(`/app/messages/${r.threadId}`); else setErr(r.error);
      }}>Message educator</button>
      {err && <span className="text-xs text-muted">{err}</span>}
    </span>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string>();
  return (
    <form className="mt-2 grid gap-2" onSubmit={async (e) => {
      e.preventDefault();
      const r = await post("/api/app/reviews", { bookingId, rating, body: body || undefined });
      if (!r.ok) return setMsg(r.error);
      setMsg("Thanks. Your review is verified because your child attended."); router.refresh();
    }}>
      <fieldset className="flex items-center gap-1"><legend className="mr-2 text-sm font-semibold">Rate the educator</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer text-2xl" title={`${n} of 5`}>
            <input type="radio" name={`rate-${bookingId}`} className="sr-only" checked={rating === n} onChange={() => setRating(n)} aria-label={`${n} of 5`} />
            <span aria-hidden className={n <= rating ? "text-[#D9870A]" : "text-line"}>★</span>
          </label>
        ))}
      </fieldset>
      <label className="field"><span className="sr-only">Comment</span><input className="input" placeholder="Optional comment" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} /></label>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <button className="btn btn-ghost !min-h-10 justify-self-start text-sm" disabled={!rating}>Submit review</button>
    </form>
  );
}
