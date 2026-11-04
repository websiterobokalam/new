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
    areaServed: [{ "@type": "City", name: "Hyderabad" }, { "@type": "City", name: "Warangal" }, { "@type": "State", name: "Telangana" }, { "@type": "Country", name: "India" }],
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

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}${it.path}` })),
  };
}

export function blogPostingLd(p: { slug: string; title: string; description: string; published: string; updated?: string; author: string; keywords: string[]; tag: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    datePublished: `${p.published}T09:00:00+05:30`,
    dateModified: `${p.updated ?? p.published}T09:00:00+05:30`,
    author: { "@type": "Organization", name: p.author, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: `${SITE.url}/brand/robokalam-logo.png` } },
    mainEntityOfPage: `${SITE.url}/blog/${p.slug}`,
    image: `${SITE.url}/og.png`,
    articleSection: p.tag,
    keywords: p.keywords.join(", "),
    inLanguage: "en-IN",
  };
}

/** Local business markup for a city page. Only a city with an office gets an address. */
export function cityLd(c: { id: string; name: string; region: string; description: string; geo: { lat: number; lng: number }; areas: string[]; office?: { street: string; locality: string; postalCode?: string } }) {
  const areaServed = [{ "@type": "City", name: c.name }, ...c.areas.map((a) => ({ "@type": "Place", name: `${a}, ${c.name}` }))];
  return {
    "@context": "https://schema.org",
    "@type": c.office ? ["EducationalOrganization", "LocalBusiness"] : "EducationalOrganization",
    "@id": `${SITE.url}/locations/${c.id}#org`,
    name: `${SITE.name} ${c.name}`,
    parentOrganization: { "@type": "Organization", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/locations/${c.id}`,
    description: c.description,
    logo: `${SITE.url}/brand/robokalam-logo.png`,
    image: `${SITE.url}/og.png`,
    email: CONTACT.email,
    telephone: CONTACT.phones[0].tel,
    areaServed,
    ...(c.office
      ? {
          address: { "@type": "PostalAddress", streetAddress: c.office.street, addressLocality: c.office.locality, postalCode: c.office.postalCode, addressRegion: c.region, addressCountry: "IN" },
          geo: { "@type": "GeoCoordinates", latitude: c.geo.lat, longitude: c.geo.lng },
          openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "09:00", closes: "19:00" }],
          priceRange: "₹₹",
        }
      : {}),
    sameAs: SOCIAL.map((s) => s.href),
  };
}
