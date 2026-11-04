import type { ContentPage } from "./types";
import { privacy, terms, refunds, childSafety } from "./legal";
import { about, contact, faq, careers, validate, events, partners, studio, impact } from "./company";
import { programsIndex, bootcamps, internships, kits } from "./learn";

export type { ContentPage, Block, Action } from "./types";

/** Every content page, by URL slug. One route renders them all. */
export const pages: Record<string, ContentPage> = {
  about, contact, faq, careers, validate, events, partners, studio, impact,
  programs: programsIndex, bootcamps, internships, kits,
  privacy, terms, refunds, "child-safety": childSafety,
};
