/**
 * Content pages (about, contact, privacy, terms and the rest) are data. One
 * route renders them all from these blocks, so editors change words here, not
 * components. The shape mirrors the CMS "pages" collection.
 */

export type Action = { href: string; label: string; primary?: boolean };

export type Block =
  /** Headed text. Paragraphs, then optional bullets. Legal pages are built from these. */
  | { kind: "prose"; id?: string; heading?: string; paras?: string[]; bullets?: string[]; after?: string[] }
  /** A grid of cards. Cards with href link out (external links open in a new tab). */
  | { kind: "cards"; heading?: string; lede?: string; cols?: 2 | 3 | 4; items: { title: string; body: string; tag?: string; href?: string; cta?: string; image?: string }[] }
  /** Questions and answers. */
  | { kind: "faq"; heading?: string; items: { q: string; a: string }[] }
  /** People with a short bio. */
  | { kind: "people"; heading?: string; lede?: string; items: { name: string; role: string; bio: string }[] }
  /** Offices, phones, email and hours from content/company.ts. */
  | { kind: "contact" }
  /** A sentence from the Claims Register. Renders only once that claim is approved. */
  | { kind: "claim"; id: string }
  /** A highlighted band with actions. */
  | { kind: "cta"; title: string; body?: string; actions: Action[] }
  /** A form: the contact form or the newsletter sign-up. */
  | { kind: "form"; form: "contact" | "newsletter" }
  /** A short notice, e.g. "Draft pending legal review". */
  | { kind: "note"; text: string };

export type ContentPage = {
  eyebrow: string;
  title: string;
  lede: string;
  /** Meta description. Defaults to the lede. */
  description?: string;
  actions?: Action[];
  /** Legal documents get a contents list and an updated date. */
  legal?: { updated: string; status: string };
  /** Only finished, approved pages are indexed. */
  index?: boolean;
  blocks: Block[];
};
