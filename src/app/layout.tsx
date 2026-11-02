import type { Metadata, Viewport } from "next";
import "./globals.css";
import { bricolage, instrument, jetbrains, anekTe, anekHi } from "./fonts";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRuntime } from "@/components/motion/MotionRuntime";
import { DoorTransitionProvider } from "@/components/motion/DoorTransition";
import { SITE } from "@/lib/site";
import { JsonLd, organizationLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Robokalam: Pick your door. Start building.", template: "%s | Robokalam" },
  description:
    "Robokalam, Literature of Technologies. Hands-on robotics, IoT, AI, coding, financial literacy and space education for learners from age 6, turnkey 21C labs for schools, and Kalam Fellows for college students who teach.",
  applicationName: "Robokalam",
  manifest: "/manifest.webmanifest",
  openGraph: { siteName: "Robokalam", type: "website", locale: "en_IN" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6FBFD" },
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Runs before paint: sets theme and marks JS so motion-hidden states apply. */
const bootScript = `(function(){try{var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');var t=localStorage.getItem('rk-theme');if(t==='light'||t==='dark'){d.setAttribute('data-theme',t)}else if(matchMedia('(prefers-color-scheme: dark)').matches){d.setAttribute('data-theme','dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`no-js ${bricolage.variable} ${instrument.variable} ${jetbrains.variable} ${anekTe.variable} ${anekHi.variable}`}
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
