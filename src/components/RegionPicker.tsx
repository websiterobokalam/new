"use client";
import { useEffect, useState } from "react";
import { regions, type RegionId } from "@/content/site";

/**
 * Region sets language options, batches, offline availability and prices.
 * Phase 1 stores the choice (cookie, read by server in Phase 2) and shows what
 * it changes. Language switching ships in Phase 2.
 */
export function RegionPicker() {
  const [region, setRegion] = useState<RegionId>("ts-ap");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )rk_region=([^;]+)/);
    if (m && regions.some((r) => r.id === m[1])) setRegion(m[1] as RegionId);
  }, []);
  function choose(id: RegionId) {
    setRegion(id);
    document.cookie = `rk_region=${id}; path=/; max-age=31536000; samesite=lax`;
  }
  const current = regions.find((r) => r.id === region)!;
  return (
    <details className="relative hidden sm:block">
      <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-semibold text-heading" aria-label={`Region: ${current.name}. Change region`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        {current.id === "ts-ap" ? "TS · AP" : current.id === "india" ? "India" : "Intl"}
      </summary>
      <div className="card absolute right-0 top-12 w-72 p-3" role="group" aria-label="Choose your region">
        <p className="px-2 pb-2 text-sm text-muted">Sets language, batches, offline options and prices.</p>
        {regions.map((r) => (
          <button key={r.id} type="button" onClick={() => choose(r.id)} aria-pressed={r.id === region}
            className="flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-panel aria-pressed:bg-panel">
            <span>
              <span className="block font-semibold text-heading">{r.name}</span>
              <span className="block text-xs text-muted">{r.languages.join(" · ")}{r.offline ? " · offline labs" : " · online"}</span>
            </span>
            {r.id === region && <span aria-hidden className="text-link">✓</span>}
          </button>
        ))}
      </div>
    </details>
  );
}
