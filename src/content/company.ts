/**
 * Company details and the external links robokalam.com has always pointed to.
 * Taken from old.robokalam.com (footer, contact page, header menus), November 2026.
 * Change them here and every page, the header and the footer follow.
 */

export const CONTACT = {
  email: "info@robokalam.com",
  phones: [
    { label: "+91 96662 87717", tel: "+919666287717" },
    { label: "+91 99492 79869", tel: "+919949279869" },
  ],
  hours: "Monday to Saturday, 9:00 to 19:00 IST",
  offices: [
    { city: "Hyderabad", line: "T-Hub Phase 2, Hitec City, Hyderabad, Telangana, India", main: true },
    { city: "Coimbatore", line: "Coimbatore, Tamil Nadu, India" },
    { city: "Essen", line: "Essen, Germany" },
  ],
} as const;

/** Robokalam's own sites and services that live outside this app. */
export const EXTERNAL = {
  learn: { href: "https://learn.robokalam.com", label: "Learning portal", line: "Sign in to your courses, class links and recordings." },
  shop: { href: "https://shop.robokalam.com", label: "Shop", line: "ASHAER Box, kits and parts." },
  school: { href: "https://school.robokalam.com", label: "School portal", line: "Robokalam's school solutions site." },
  validate: { href: "https://validate.robokalam.com", label: "Certificate validation", line: "Check that a Robokalam certificate is genuine." },
  ashaerLabs: { href: "https://robokalam.com/ashaerlabs/", label: "ASHAER Labs", line: "Classes blended with STEAM kits, and lab bookings." },
  careers: { href: "https://app.pyjamahr.com/careers?company=Robokalam&company_uuid=71BA5814DB", label: "Open roles on PyjamaHR", line: "Every open role at Robokalam." },
  film: { href: "https://www.youtube.com/watch?v=OnH2-on5O6o", label: "Watch the Robokalam film", line: "On YouTube." },
} as const;

export const SOCIAL = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/robokalam" },
  { name: "Instagram", href: "https://www.instagram.com/robokalam" },
  { name: "Facebook", href: "https://www.facebook.com/robokalam" },
  { name: "YouTube", href: "https://www.youtube.com/watch?v=OnH2-on5O6o" },
  { name: "Pinterest", href: "https://www.pinterest.com/robokalam" },
] as const;

export const COMPANY = "Robokalam Technologies Private Limited";

/**
 * The people the law and our safeguarding policy require us to publish.
 * Robokalam's decision (4 November 2026): published under the company's name at
 * info@robokalam.com until named individuals are set in the server settings.
 */
const person = (role: string, name?: string, email?: string) => ({
  name: name?.trim() || `${role}, ${COMPANY}`,
  email: email?.trim() || CONTACT.email,
  named: !!name?.trim(),
});
export const PEOPLE = {
  safeguardingLead: person("Safeguarding Lead", process.env.SAFEGUARDING_LEAD_NAME, process.env.SAFEGUARDING_EMAIL),
  grievanceOfficer: person("Grievance Officer", process.env.GRIEVANCE_OFFICER_NAME, process.env.GRIEVANCE_OFFICER_EMAIL),
};

/** Legal pages approved by Robokalam on 4 November 2026. LEGAL_PAGES_APPROVED=0 puts the draft notices back. */
export const LEGAL_APPROVED = process.env.LEGAL_PAGES_APPROVED !== "0";

export const isExternal = (href: string) => /^https?:\/\//.test(href);
