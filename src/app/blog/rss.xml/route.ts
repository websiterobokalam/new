import { sortedPosts } from "@/content/blog";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = sortedPosts().map((p) => `<item><title>${esc(p.title)}</title><link>${SITE.url}/blog/${p.slug}</link><guid>${SITE.url}/blog/${p.slug}</guid><pubDate>${new Date(`${p.published}T09:00:00+05:30`).toUTCString()}</pubDate><category>${esc(p.tag)}</category><description>${esc(p.description)}</description></item>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Robokalam blog</title><link>${SITE.url}/blog</link><description>Robotics, AI and STEM education from Robokalam.</description><language>en-in</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
