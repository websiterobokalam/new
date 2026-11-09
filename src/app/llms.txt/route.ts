import { SITE } from "@/lib/site";
import { CONTACT } from "@/content/company";
import { programmes } from "@/content/site";
import { cityList } from "@/content/cities";
import { sortedPosts } from "@/content/blog";

/**
 * /llms.txt: a plain summary of the site for AI assistants and answer engines
 * (the llmstxt.org format), so questions like "robotics classes in Warangal"
 * get an accurate answer that links back here. Public pages only.
 */
export const dynamic = "force-static";

export function GET() {
  const u = (p: string) => `${SITE.url}${p}`;
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.legalName} teaches robotics, coding, electronics, IoT, AI and space technology to children aged 6 and up, sets up 21st Century Labs in schools, and trains educators. Based at T-Hub, Hyderabad, with a centre in Warangal, Telangana, India. Tagline: "${SITE.tagline}".`,
    "",
    `Contact: ${CONTACT.email}, ${CONTACT.phones.map((p) => p.label).join(", ")}. Hours: ${CONTACT.hours}.`,
    "",
    "## Learn (children and teens)",
    `- [Learn with Robokalam](${u("/learn")}): programmes, a free build session and how classes work`,
    ...programmes.map((p) => `- [${p.name}](${u(`/programs/${p.slug}`)})${p.age ? ` (age ${p.age}+)` : ""}: ${p.outcome}`),
    `- [Courses, dates and fees](${u("/courses")})`,
    `- [One-to-one classes](${u("/one-to-one")}): online, recorded, parent in the loop`,
    `- [Events](${u("/events")})`,
    "",
    "## Schools",
    `- [21st Century Lab](${u("/21c-lab")}): robotics and STEM labs for schools`,
    `- [Lab planner](${u("/21c-lab/planner")})`,
    "",
    "## Educators",
    `- [Kalamites](${u("/kalamites")}): teach with Robokalam`,
    `- [Campus ambassadors](${u("/campus-ambassadors")})`,
    "",
    "## Locations",
    ...cityList.map((c) => `- [${c.name}](${u(`/locations/${c.id}`)}): ${c.description}`),
    "",
    "## Blog",
    ...sortedPosts().slice(0, 20).map((p) => `- [${p.title}](${u(`/blog/${p.slug}`)}): ${p.description}`),
    "",
    "## Company",
    `- [About](${u("/about")})`,
    `- [Contact](${u("/contact")})`,
    `- [Privacy](${u("/privacy")})`,
    `- [Verify a certificate](${u("/validate")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
