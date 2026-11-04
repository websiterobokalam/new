import type { Metadata, Viewport } from "next";
import "./globals.css";
import { poppins, jetbrains, anekTe, anekHi, brand } from "./fonts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { DoorTransitionProvider } from "@/components/motion/DoorTransition";
import { SITE } from "@/lib/site";
import { JsonLd, organizationLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Robokalam: AI, software and labs for future-ready schools", template: "%s | Robokalam" },
  description:
    "Robokalam is an EdTech technology company in Hyderabad: the AADHYA AI platform, 21cschool ERP, turnkey STEM & AI labs and curriculum for schools, and live robotics, coding and AI classes for kids from age 6 in Hyderabad, Warangal and across India.",
  keywords: ["Robokalam", "robotics classes for kids Hyderabad", "coding classes Hyderabad", "AI classes for kids", "STEM lab for schools Hyderabad", "robotics lab Warangal", "STEM education Telangana", "EdTech company Hyderabad", "21C STEM & AI lab", "AADHYA AI platform"],
  category: "education",
  other: { "geo.region": "IN-TG", "geo.placename": "Hyderabad", "geo.position": "17.4474;78.3762", ICBM: "17.4474, 78.3762" },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  applicationName: "Robokalam",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Robokalam", type: "website", locale: "en_IN", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Robokalam: AI, software and labs for future-ready schools" }] },
  icons: { icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#F2F6FF",
  width: "device-width",
  initialScale: 1,
};

/** Runs before paint: light theme unless the visitor chose dark in the footer; marks JS so motion-hidden states apply. */
const bootScript = `(function(){try{var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');d.setAttribute('data-theme','light');if(localStorage.getItem('rk-theme')==='dark'){d.setAttribute('data-theme','dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`no-js ${brand.variable} ${poppins.variable} ${jetbrains.variable} ${anekTe.variable} ${anekHi.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <JsonLd data={organizationLd()} />
      </head>
      <body className="min-h-dvh overflow-x-clip">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] btn btn-primary">
          Skip to content
        </a>
        <DoorTransitionProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </DoorTransitionProvider>
        <MotionRuntime />
      </body>
    </html>
  );
}
