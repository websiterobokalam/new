import type { ContentPage } from "./types";
import { EXTERNAL } from "../company";
import { programmes } from "../site";

/** Learning pages, from old.robokalam.com (learn, electro, codo, advance, summercamp, AIMLbootcamp, ashaerlabs). */

export const programsIndex: ContentPage = {
  eyebrow: "Ashaer tracks",
  title: "From first circuit to first robot to first AI.",
  lede: "Four Ashaer tracks take learners from age 6 through electronics, robotics, code and advanced engineering, with camps and bootcamps in between. Every class ends with something that works.",
  description: "Robokalam's Ashaer tracks: Electro, Robo, CODO and Advance Ashaers, Robotics Summer Camp and the AIML Bootcamp.",
  actions: [{ href: "/learn#book", label: "Book a Free Build Session", primary: true }, { href: "/courses", label: "See courses with dates" }],
  index: true,
  blocks: [
    {
      kind: "cards", cols: 3,
      items: programmes.map((p) => ({ tag: p.age ? `Age ${p.age}+` : "Teens and college", title: p.name, body: p.outcome, href: `/programs/${p.slug}`, cta: "Explore", image: p.image })),
    },
  ],
};

export const bootcamps: ContentPage = {
  eyebrow: "Bootcamps and camps",
  title: "Learn today, lead tomorrow.",
  lede: "Short, intense programmes with a clear finish line: the AIML Bootcamp for older students and college learners, and the Robotics Summer Camp for the holidays.",
  description: "Robokalam's AIML Bootcamp and Robotics Summer Camp.",
  actions: [{ href: "/learn#book", label: "Ask about the next batch", primary: true }],
  index: true,
  blocks: [
    {
      kind: "cards", cols: 2,
      items: [
        { tag: "AIML Bootcamp", title: "Artificial intelligence and machine learning, hands-on", body: "A digital bootcamp run with Kalwings: live classes, recorded sessions, quizzes and assignments, and a community of past batches. Each cohort ends with a graduation.", href: "/programs/aiml-bootcamp", cta: "About the bootcamp" },
        { tag: "Robotics Summer Camp", title: "Electronics, robotics, IoT and virtual reality", body: "A holiday build sprint: circuits, robot programming and mechanical design, Python and VR, ending in a demo.", href: "/programs/robotics-summer-camp", cta: "About the camp", image: "/images/programs/robotics-summer-camp.webp" },
      ],
    },
    {
      kind: "prose", heading: "Code to Change",
      paras: ["Our first AIML Bootcamp cohort graduated with the Code to Change team, working towards a more inclusive future for women in technology. That work continues in every cohort."],
    },
    { kind: "cta", title: "Already enrolled?", body: "Class links, recordings, quizzes and assignments are on the learning portal.", actions: [{ href: EXTERNAL.learn.href, label: "Open the learning portal", primary: true }] },
  ],
};

export const internships: ContentPage = {
  eyebrow: "Internships",
  title: "Build for real clients, with Robokalam.",
  lede: "For college students in engineering, degree and master's programmes. Work on live products, curriculum and hardware, alongside our team, from anywhere.",
  description: "Internships at Robokalam for engineering, degree and master's students.",
  actions: [{ href: EXTERNAL.careers.href, label: "See open internships", primary: true }, { href: "/kalamites", label: "Or teach as a Kalamite" }],
  blocks: [
    {
      kind: "cards", cols: 3,
      items: [
        { title: "Software", body: "Work on AADHYA, 21cschool and the Robokalam app, with code review from our engineers." },
        { title: "Hardware and IoT", body: "Prototype on RK Brain, test kits, and build the projects learners will make next." },
        { title: "Curriculum and content", body: "Write activity cards, project guides and videos that real classes use." },
      ],
    },
  ],
};

export const kits: ContentPage = {
  eyebrow: "Kits",
  title: "The ASHAER Box. STEAM you can hold.",
  lede: "Our kits blend on-demand AI, IoT and coding classes with STEAM kits, because children learn best through play and remember it for longer. Each ASHAER pack is matched to an Ashaer level.",
  description: "ASHAER Box and Robokalam kits: activity cards, interactive labels, engaging projects and innovation challenges.",
  actions: [{ href: EXTERNAL.shop.href, label: "Shop kits", primary: true }, { href: EXTERNAL.ashaerLabs.href, label: "Visit ASHAER Labs" }],
  index: true,
  blocks: [
    {
      kind: "cards", heading: "What's in the box", lede: "STEAM: science, technology, engineering, arts and mathematics.", cols: 4,
      items: [
        { title: "Activity cards", body: "Skill-building cards that make each build fun, engaging and easy to follow." },
        { title: "Interactive labels", body: "An ever-growing range of labels that teach while you build." },
        { title: "Engaging projects", body: "STEAM challenges that build thinking skills and the ability to design and create." },
        { title: "Innovation challenges", body: "Real-world problems, so learners find answers that mean something to them." },
      ],
    },
    {
      kind: "cards", heading: "What children get from it", cols: 3,
      items: [
        { title: "Confidence", body: "Making something work, on their own, changes how a child sees themselves." },
        { title: "Thinking for themselves", body: "Challenges with more than one answer build independent thinking." },
        { title: "New technologies", body: "Sensors, motors, code and boards, met early and without fear." },
        { title: "Patience and perseverance", body: "Builds rarely work the first time. Fixing them is the lesson." },
        { title: "Personality", body: "Presenting a build, and explaining it, grows communication." },
        { title: "Science intuition", body: "Forces, circuits and energy, felt by hand before they are written down." },
      ],
    },
    { kind: "note", text: "Kits contain small parts and batteries. Children should build with an adult nearby." },
  ],
};
