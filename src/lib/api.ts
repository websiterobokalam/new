import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAccount, type Account } from "./auth/session";
import { DbUnavailable } from "./db";
import { rateLimit, clientIp } from "./rateLimit";
import { BookingError } from "./learn/booking";
import { RefundError } from "./learn/refunds";
import { PaymentsNotConfigured } from "./payments";
import { FellowError } from "./fellows/core";

export const ok = (data: object = {}, init?: ResponseInit) => NextResponse.json({ ok: true, ...data }, init);
export const fail = (status: number, error: string, extra: object = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: object = {}) { super(message); }
}

export async function requireAccount(): Promise<Account> {
  const a = await currentAccount();
  if (!a) throw new HttpError(401, "Please log in");
  return a;
}

export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.output<T>> {
  const raw = await req.json().catch(() => null);
  const p = schema.safeParse(raw);
  if (!p.success) {
    const fields: Record<string, string> = {};
    for (const i of p.error.issues) fields[i.path.join(".")] ??= i.message;
    throw new HttpError(422, "Please check the highlighted fields", { fields });
  }
  return p.data;
}

export function limit(req: Request, key: string, n: number, windowMs: number) {
  // Tests share one IP; they raise the multiplier. Production leaves it at 1.
  const r = rateLimit(`${key}:${clientIp(req)}`, n * Number(process.env.RATE_LIMIT_MULTIPLIER ?? 1), windowMs);
  if (!r.ok) throw new HttpError(429, "Too many requests. Please wait a moment.");
}

/** Wraps a handler: maps known errors to clean JSON, never leaks internals. */
export function handler(fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.status, e.message, e.extra);
      if (e instanceof DbUnavailable) return fail(503, "We're having trouble right now. Please try again shortly.");
      if (e instanceof BookingError) return fail(409, e.message, { code: e.code });
      if (e instanceof RefundError) return fail(409, e.message);
      if (e instanceof FellowError) return fail(e.status, e.message);
      if ((e as { code?: string }).code === "42501") return fail(403, "Not allowed");
      if (e instanceof PaymentsNotConfigured) return fail(503, "Online payment is not available yet.");
      console.error("api error", (e as Error).message);
      return fail(500, "Something went wrong on our side.");
    }
  };
}
