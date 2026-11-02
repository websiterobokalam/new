import { Hero } from "@/components/home/Hero";
import {
  TrustBar, WorldsBento, LearnerLadder, LabAtNight, FellowsBand, ImpactBand,
  MadeByStudents, ParentTrust, ProjectStories, StudentVoices, Faq, DoorsAgain,
} from "@/components/home/Sections";
import { BotLoader } from "@/components/home/BotLoader";
import { KalamLineScope, LineNode } from "@/components/motion/KalamLine";
import { Section, SectionHead } from "@/components/Section";
import { JsonLd, faqLd } from "@/lib/jsonld";
import { faqs } from "@/content/site";

export default function Home() {
  return (
    <>
      <JsonLd data={faqLd(faqs)} />
      <Hero />
      <TrustBar />
      <KalamLineScope>
        <LineNode />
        <Section id="try-the-bot" label="Try the Bot">
          <div className="wrap">
            <SectionHead eyebrow="Try the Bot · no login, nothing saved" title="Snap blocks. Drive a robot. See the Python." lede="This is how every Robokalam learner starts: a real robot problem, solved with real code." />
            <div className="mt-10"><BotLoader /></div>
          </div>
        </Section>
        <LineNode />
        <WorldsBento />
        <LineNode />
        <LearnerLadder />
        <LineNode />
        <LabAtNight />
        <LineNode bot="wave" />
        <FellowsBand />
        <LineNode />
        <ImpactBand />
        <LineNode />
        <MadeByStudents />
        <ParentTrust />
        <LineNode />
        <ProjectStories />
        <StudentVoices />
        <Faq />
        <LineNode />
        <DoorsAgain />
        <LineNode />
      </KalamLineScope>
    </>
  );
}
