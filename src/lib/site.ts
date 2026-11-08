const DEFAULT_URL = "https://robokalam.com";

/**
 * The public site URL, from NEXT_PUBLIC_SITE_URL. Hosting dashboards sometimes
 * hold a placeholder ("check") or a bare domain ("new.robokalam.com"); a bad
 * value must never break the build. Bare domains get https://, anything
 * unusable falls back to the default with a warning.
 */
export function siteUrl(raw = process.env.NEXT_PUBLIC_SITE_URL): string {
  const v = raw?.trim();
  if (!v) return DEFAULT_URL;
  const candidate = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(candidate);
    if (!u.hostname.includes(".") && u.hostname !== "localhost") throw new Error("no domain");
    return u.origin;
  } catch {
    console.warn(`[robokalam] NEXT_PUBLIC_SITE_URL is not a valid URL (${JSON.stringify(v)}). Using ${DEFAULT_URL}.`);
    return DEFAULT_URL;
  }
}

/** Cut a meta description at a word, to the ~160 characters search results show. */
export function metaClip(s: string, max = 158) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "") + "…";
}

/** The share image, for pages that set their own openGraph (which would otherwise drop it). */
export const OG_IMAGES = [{ url: "/og.png", width: 1200, height: 630, alt: "Robokalam: robotics, coding and AI for kids and schools" }];

export const SITE = {
  name: "Robokalam",
  tagline: "Literature of Technologies",
  /** Registered company name, confirmed by Robokalam on 4 November 2026. LEGAL_NAME overrides it. */
  legalName: process.env.LEGAL_NAME?.trim() || "Robokalam Technologies Private Limited",
  positioning: "Where India stops watching technology and starts building it.",
  url: siteUrl(),
};
