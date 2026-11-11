"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { post } from "./client";

const LANGS = [["en", "English"], ["te", "తెలుగు"], ["hi", "हिन्दी"]] as const;
const HTML: Record<string, string> = { en: "en-IN", te: "te-IN", hi: "hi-IN" };

export function LangSwitch({ current, label }: { current: string; label: string }) {
  const router = useRouter();
  // Keep <html lang> in step so screen readers use the right voice.
  useEffect(() => { document.documentElement.lang = HTML[current] ?? "en-IN"; }, [current]);
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select className="input !min-h-10 !py-1.5" value={current} onChange={async (e) => { await post("/api/app/language", { lang: e.target.value }); router.refresh(); }}>
        {LANGS.map(([v, n]) => <option key={v} value={v} lang={v}>{n}</option>)}
      </select>
    </label>
  );
}

export function LogoutButton({ label }: { label: string }) {
  return <button type="button" className="text-sm font-semibold text-link underline-offset-4 hover:underline" onClick={async () => { await post("/api/auth/logout", {}); window.location.assign("/"); }}>{label}</button>;
}
