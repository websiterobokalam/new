import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { pages } from "@/content/pages";
import { programmes } from "@/content/site";
import { sortedPosts } from "@/content/blog";
import { cityList } from "@/content/cities";
import { upcomingEvents } from "@/lib/events";
import { listCourses } from "@/lib/learn/catalogue";

// Built per request (cached by the CDN), so new events and courses appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only finished, indexable pages. Drafts awaiting review are noindex and left out.
  const content = Object.entries(pages).filter(([, p]) => p.index).map(([slug]) => `/${slug}`);
  const paths = [...content, ...programmes.map((p) => `/programs/${p.slug}`), "/", "/learn", "/learn/build-session", "/courses", "/21c-lab", "/21c-lab/planner", "/kalamites", "/kalamites/apply", "/kalamites/safety", "/kalamites/earnings", "/campus-ambassadors", "/one-to-one", "/validate", "/newsletter", "/events"];
  const base: MetadataRoute.Sitemap = paths.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly", priority: p === "/" ? 1 : 0.8 }));
  const local: MetadataRoute.Sitemap = ["/locations", ...cityList.map((c) => `/locations/${c.id}`)].map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "monthly", priority: 0.9 }));
  const posts = sortedPosts();
  const blog: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/blog`, lastModified: posts[0]?.published, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: p.updated ?? p.published, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
  // Live listings. If the database is down the sitemap still serves the rest.
  const events = await upcomingEvents().catch(() => []);
  const courses = await listCourses({}).catch(() => []);
  const live: MetadataRoute.Sitemap = [
    ...events.map((e) => ({ url: `${SITE.url}/events/${e.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...courses.filter((c) => !c.sample).map((c) => ({ url: `${SITE.url}/courses/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
  return [...base, ...local, ...blog, ...live];
}
