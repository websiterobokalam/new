import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pages } from "@/content/pages";
import { ContentPageView } from "@/components/content/ContentBlocks";
import { JsonLd, faqLd } from "@/lib/jsonld";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = pages[(await params).slug];
  if (!p) return {};
  return { title: p.title.replace(/\.$/, ""), description: p.description ?? p.lede, robots: p.index ? undefined : { index: false }, alternates: { canonical: `/${(await params).slug}` } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const page = pages[(await params).slug];
  if (!page) notFound();
  const qa = page.blocks.flatMap((b) => (b.kind === "faq" ? b.items : []));
  return (
    <>
      {qa.length > 0 && <JsonLd data={faqLd(qa)} />}
      <ContentPageView page={page} />
    </>
  );
}
