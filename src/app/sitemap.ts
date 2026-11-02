import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Phase 1: only built, indexable pages. Placeholder pages are noindex and left out.
  const paths = ["/", "/learn", "/learn/build-session", "/courses", "/21c-lab", "/21c-lab/planner", "/fellows", "/fellows/apply", "/fellows/safety", "/fellows/earnings"];
  return paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.8 }));
}
