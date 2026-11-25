import type { Metadata } from "next";
import Link from "next/link";
import { PhotoGallery } from "@/components/PhotoGallery";
import { JsonLd, breadcrumbLd } from "@/lib/jsonld";
import { SITE, OG_IMAGES } from "@/lib/site";
import { publicPhotos } from "@/content/photos";

export const metadata: Metadata = {
  title: "Gallery: labs, robots and events",
  description: "Photos from Robokalam's 21C STEM & AI labs, student robotics and IoT builds, and events across Hyderabad and Warangal. Tap any photo to see it full size.",
  alternates: { canonical: "/gallery" },
  openGraph: { type: "website", url: "/gallery", title: "Robokalam gallery", images: OG_IMAGES },
};

export default function GalleryPage() {
  const photos = publicPhotos();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: "Robokalam gallery",
          url: `${SITE.url}/gallery`,
          image: photos.map((p) => ({ "@type": "ImageObject", contentUrl: `${SITE.url}${p.src}.webp`, caption: p.caption, width: p.width, height: p.height })),
        }}
      />
      <section className="pb-2 pt-12 sm:pt-16">
        <div className="wrap max-w-5xl">
          <p className="eyebrow">Gallery</p>
          <h1 className="display-xl mt-3">Labs, robots and events.</h1>
          <p className="lede mt-4 max-w-3xl">Real 21C Labs, real student builds and real events, from Hyderabad to Warangal. Tap any photo to see it full size.</p>
        </div>
      </section>
      <div className="[&_.photo-gallery]:pt-6">
        <PhotoGallery eyebrow="All photos" title="Everything we can share." lede="Photos of children appear only with their parents' written consent." />
      </div>
      <section className="pb-20">
        <div className="wrap flex flex-wrap gap-3">
          <Link href="/21c-lab" className="btn btn-primary">See the 21C Lab</Link>
          <Link href="/events" className="btn btn-ghost">Upcoming events</Link>
        </div>
      </section>
    </>
  );
}
