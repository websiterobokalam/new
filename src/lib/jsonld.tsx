import { SITE } from "./site";
import { CONTACT, SOCIAL } from "@/content/company";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for </script> safety below.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.legalName,
    slogan: SITE.tagline,
    url: SITE.url,
    logo: `${SITE.url}/brand/robokalam-logo.png`,
    email: CONTACT.email,
    sameAs: SOCIAL.map((s) => s.href),
    address: { "@type": "PostalAddress", streetAddress: "T-Hub Phase 2, Hitec City", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
    contactPoint: CONTACT.phones.map((p) => ({ "@type": "ContactPoint", telephone: p.tel, contactType: "customer support", email: CONTACT.email, areaServed: "IN", availableLanguage: ["English", "Hindi", "Telugu"] })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
