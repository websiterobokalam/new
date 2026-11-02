/**
 * 301 map from old.robokalam.com / robokalam.com URLs to the new site map.
 * ONLY /forschools.html is confirmed from the brief. The rest are common
 * static-site patterns and MUST be checked against a crawl of the old site
 * before launch (open question in the Phase 1 review).
 */
export type Redirect = { from: string; to: string; verified: boolean };

export const legacyRedirects: Redirect[] = [
  { from: "/forschools.html", to: "/21c-lab", verified: true },
  { from: "/index.html", to: "/", verified: false },
  { from: "/about.html", to: "/about", verified: false },
  { from: "/contact.html", to: "/contact", verified: false },
  { from: "/careers.html", to: "/careers", verified: false },
  { from: "/programs.html", to: "/programs", verified: false },
  { from: "/courses.html", to: "/courses", verified: false },
  { from: "/forstudents.html", to: "/learn", verified: false },
  { from: "/forparents.html", to: "/learn", verified: false },
  { from: "/impact.html", to: "/impact", verified: false },
  { from: "/faq.html", to: "/faq", verified: false },
  { from: "/turnkey-lab", to: "/21c-lab", verified: false },
];
