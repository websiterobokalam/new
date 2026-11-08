import { Hero, Doors } from "@/components/home/Hero";
import { Solutions, WhySchools, Consult } from "@/components/home/Company";
import {
  WorldsBento, LabAtNight, FellowsBand, ImpactBand,
  MadeByStudents, ParentTrust, ProjectStories, StudentVoices, Faq,
} from "@/components/home/Sections";
import { BotLoader } from "@/components/home/BotLoader";
import { Gallery3D } from "@/components/Gallery3D";
import { KalamLineScope, LineNode } from "@/components/motion/KalamLine";
import { Section, SectionHead } from "@/components/Section";
import { JsonLd, faqLd } from "@/lib/jsonld";
import { faqs } from "@/content/site";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Home: Robokalam first as an EdTech technology company for premium schools
 * (solutions, the flagship lab, why schools choose us), then the doors for
 * learners and college students.
 */
export default function Home() {
  return (
    <>
      <JsonLd data={faqLd(faqs)} />
      <Hero />
      <KalamLineScope>
        <LineNode />
        <Solutions />
        <LineNode />
        <LabAtNight />
        <Gallery3D title="Robokalam in the real world." lede="Real 21C Labs, real student builds and real events, from Hyderabad to Warangal. Swipe through." />
        <LineNode />
        <WhySchools />
        <LineNode />
        <ImpactBand />
        <Consult />
        <LineNode />
        <Doors />
        <LineNode />
        <Section id="try-the-bot" label="Try the Bot">
          <div className="wrap">
            <SectionHead eyebrow="See how students learn · no login, nothing saved" title="Snap blocks. Drive a robot. See the Python." lede="Every Robokalam learner starts like this: a real robot problem, solved with real code." />
            <div className="mt-10"><BotLoader /></div>
          </div>
        </Section>
        <LineNode />
        <WorldsBento />
        <LineNode bot="wave" />
        <FellowsBand />
        <MadeByStudents />
        <ParentTrust />
        <LineNode />
        <ProjectStories />
        <StudentVoices />
        <Faq />
        <LineNode />
      </KalamLineScope>
    </>
  );
}
