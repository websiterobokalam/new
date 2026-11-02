"use client";
/** Small JSON POST helper for app forms. */
export async function post<T = Record<string, unknown>>(url: string, data: unknown): Promise<{ ok: boolean; error?: string; fields?: Record<string, string> } & T> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    return await r.json();
  } catch {
    return { ok: false, error: "You seem to be offline. Please try again." } as never;
  }
}
