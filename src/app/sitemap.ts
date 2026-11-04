import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { pages } from "@/content/pages";
import { programmes } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only finished, indexable pages. Drafts awaiting review are noindex and left out.
  const content = Object.entries(pages).filter(([, p]) => p.index).map(([slug]) => `/${slug}`);
  const paths = [...content, ...programmes.map((p) => `/programs/${p.slug}`), "/", "/learn", "/learn/build-session", "/courses", "/21c-lab", "/21c-lab/planner", "/kalamites", "/kalamites/apply", "/kalamites/safety", "/kalamites/earnings", "/campus-ambassadors", "/one-to-one"];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.8 }));
}
