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

export const SITE = {
  name: "Robokalam",
  tagline: "Literature of Technologies",
  legalName: "Robokalam Technologies Private Limited",
  positioning: "Where India stops watching technology and starts building it.",
  url: siteUrl(),
};
