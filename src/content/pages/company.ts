import type { ContentPage } from "./types";
import { CONTACT, EXTERNAL } from "../company";
import { faqs } from "../site";

/**
 * Company pages. Words carried over from old.robokalam.com (about-us, contact,
 * faq, forschools, gallery, blogs) and updated for today's Robokalam. Numbers and
 * proof statements from the old site (e.g. "75%+ improvement", "top 1% of
 * trainers", "since 2015", alumni lists) live in the Claims Register and stay
 * hidden until approved with evidence.
 */

export const about: ContentPage = {
  eyebrow: "About Robokalam",
  title: "Literature of Technologies.",
  lede: "Robokalam is a 21st-century EdTech company. We build the AI platform, school software, labs and curriculum that let schools teach technology by building it, and we do research and development in AI, IoT, coding and robotics.",
  description: "Who Robokalam is: a 21st-century EdTech company building AI, software, labs and curriculum for schools, with a vision to empower young minds.",
  actions: [{ href: "/21c-lab", label: "See what we build for schools", primary: true }, { href: EXTERNAL.film.href, label: EXTERNAL.film.label }],
  index: true,
  blocks: [
    {
      kind: "prose", heading: "Who we are",
      paras: [
        "Robokalam started with gamified, hands-on technical education: workshops, training, certifications and DIY kits for institutes, so students get real experience with the latest technologies instead of only reading about them.",
        "Today we are a technology company for schools. We build AADHYA, our AI learning platform, and 21cschool, our school ERP. We design and run 21C STEM & AI labs, write curriculum, train teachers, and build custom software for schools and EdTech companies.",
        "We have also run technical outreach programmes in government institutions, and our annual student innovation fest, SKOOL ENGINE, with Samaritans Stand Up Organization.",
      ],
    },
    { kind: "claim", id: "company.alumni" },
    {
      kind: "cards", cols: 2,
      items: [
        { tag: "Vision", title: "Empower young minds through high-quality, endless education.", body: "We stand between technology and students, adding what the syllabus leaves out: expert curriculum, the best training and emerging technologies, so learning shows up in their results." },
        { tag: "Mission", title: "Make experiential, gamified learning normal.", body: "Through workshops, training and innovation challenges at every level, we give students a platform to show their creativity and the feel of solving real problems, and how powerful and exciting that can be." },
      ],
    },
    {
      kind: "cards", heading: "What we believe", cols: 4,
      items: [
        { title: "Creation, not consumption", body: "Children use code to build their own games, animations and apps. They become creators of technology, not just its users." },
        { title: "Logic you can see", body: "Commands, loops, sequences and conditions turn abstract maths into something that moves on the desk." },
        { title: "Thinking in steps", body: "Decomposition, abstraction, pattern recognition and algorithms: the habits behind every hard problem." },
        { title: "Strength and confidence", body: "Analysis, attention to detail and persistence, learnt by making something that works, carry into every part of life." },
      ],
    },
    {
      kind: "people", heading: "The founders",
      items: [
        { name: "Mohammed Sajeed", role: "Co-founder and CEO", bio: "Web development leader with experience across hospitality, e-commerce, EdTech and healthcare, and a founder of other startups. On a mission to make problem-solving creative and fun for people of all ages and backgrounds." },
        { name: "Thota Raja Sekhar", role: "Co-founder and CTO", bio: "Leads product development. Has delivered STEAM curriculum (robotics, automation, IoT, game making and 3D printing) and consulted IoT startups on prototypes. Works on AI and ML projects." },
        { name: "Ashalatha", role: "Co-founder, HR", bio: "Runs recruitment and operations, from onboarding to retention, and leads programmes designed to help women become confident with technology." },
        { name: "Md. Tameem Ansari", role: "Operations and business development", bio: "Brings experience in IOTA, blockchain, Hyperledger Fabric and IoT, and a master's from the University of Liverpool, to pedagogy at global standards." },
      ],
    },
    {
      kind: "cta", title: "Work with us",
      body: "Schools, partners and people who want to build: we would like to hear from you.",
      actions: [{ href: "/contact", label: "Contact us", primary: true }, { href: "/careers", label: "We're hiring" }, { href: "/kalamites", label: "Become a Kalamite" }],
    },
  ],
};

export const contact: ContentPage = {
  eyebrow: "Contact",
  title: "Talk to Robokalam.",
  lede: "Call or write to us, or jump straight to what you need below. We answer Monday to Saturday.",
  description: "Contact Robokalam: offices in Hyderabad, Coimbatore and Essen, phone, email and hours.",
  index: true,
  blocks: [
    { kind: "contact" },
    {
      kind: "cards", heading: "The quickest way to what you need", cols: 3,
      items: [
        { tag: "Parents", title: "Book a Free Build Session", body: "Your child finishes one build with a vetted educator. Free, no card needed.", href: "/learn#book", cta: "Book a session" },
        { tag: "Schools", title: "Book a Turnkey Demo", body: "AI platform, ERP, lab, curriculum and training, planned for your school.", href: "/21c-lab#demo", cta: "Book a demo" },
        { tag: "Kalamites", title: "Teach with Robokalam", body: "College students 18+, anywhere in India and abroad.", href: "/kalamites/apply", cta: "Apply" },
        { tag: "Organisations", title: "Software and partnerships", body: "Custom EdTech software, CSR and government programmes.", href: "/studio", cta: "See Studio" },
        { tag: "Certificates", title: "Check a certificate", body: "Confirm a Robokalam certificate is genuine.", href: EXTERNAL.validate.href, cta: "Validate" },
        { tag: "Safety", title: "Report a concern", body: "Signed in? Use the Report button on any screen. It goes straight to our Safeguarding Lead.", href: "/child-safety#report", cta: "How reporting works" },
      ],
    },
  ],
};

export const faq: ContentPage = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  lede: "About Robokalam, our courses and kits, schools, and Kalamites. Can't find yours? Write to us.",
  description: "Frequently asked questions about Robokalam: courses, kits, ages, schools, Kalamites, fees and safety.",
  actions: [{ href: "/contact", label: "Ask us something else" }],
  index: true,
  blocks: [
    {
      kind: "faq", heading: "About Robokalam",
      items: [
        { q: "How is Robokalam different?", a: "We focus on gamified, activity-based learning through well-designed activity cards and real builds, and we build the platform, software and labs behind it. Learners make something that works in every class." },
        { q: "Why Robokalam?", a: "Robokalam prepares children for a world shaped by technology. We aim for quality and visible outcomes through expert curriculum and individual attention." },
        { q: "What makes Robokalam's courses a good way to learn STEAM?", a: "STEAM subjects need problem-solving, and problem-solving grows by doing. Our courses turn science, technology, engineering, arts and maths into projects learners build, test and fix." },
        { q: "What skills do learners build?", a: "21st-century skills: creativity, critical thinking, collaboration, communication and life skills, alongside the technology itself." },
      ],
    },
    {
      kind: "faq", heading: "Courses and kits",
      items: [
        { q: "What age can my child start?", a: "Our courses are designed for children aged 6 and up, with tracks that grow from first circuits to robotics, code, IoT and AI." },
        { q: "Tell me about your kits.", a: "Robokalam kits are made with high precision for consistency. Learners build working prototypes, from simple machines and vehicles to robots that solve real-life problems. ASHAER packs are matched to each level." },
        { q: "Where do I find my class links and recordings?", a: `Sign in to your account here, or on the learning portal at ${EXTERNAL.learn.href.replace("https://", "")}.` },
      ],
    },
    { kind: "faq", heading: "Schools, parents and Kalamites", items: faqs },
  ],
};

export const careers: ContentPage = {
  eyebrow: "Careers",
  title: "Build the technology behind future-ready schools.",
  lede: "We hire engineers, curriculum designers, trainers and operations people who want their work to show up in a classroom. Every open role is listed on our hiring page.",
  description: "Careers at Robokalam: open roles in engineering, curriculum, training and operations.",
  actions: [{ href: EXTERNAL.careers.href, label: "See open roles", primary: true }, { href: "/kalamites", label: "Teach as a Kalamite" }],
  index: true,
  blocks: [
    {
      kind: "cards", heading: "Where you could work", cols: 3,
      items: [
        { title: "Engineering", body: "AADHYA, 21cschool, this site and the Robokalam app, and the RK Brain hardware." },
        { title: "Curriculum", body: "Lessons, activity cards and projects from age 6 to college, in robotics, IoT, coding, AI and more." },
        { title: "Training", body: "Run 21C labs in schools and train the teachers who will run them next." },
        { title: "Schools and partnerships", body: "Help schools plan labs and platforms, and look after them once they are live." },
        { title: "Operations", body: "Kits, logistics, scheduling and support that keep classes running." },
        { title: "Kalamites", body: "College students who teach part-time. A separate path with its own terms.", href: "/kalamites", cta: "Learn more" },
      ],
    },
    { kind: "cta", title: "Don't see your role?", body: `Write to ${CONTACT.email} with what you would build here.`, actions: [{ href: EXTERNAL.careers.href, label: "Open roles on PyjamaHR", primary: true }] },
  ],
};

export const validate: ContentPage = {
  eyebrow: "Certificates",
  title: "Validate a Robokalam certificate.",
  lede: "Every Robokalam certificate carries a unique ID. Enter it on our validation site to confirm the certificate is genuine and see who it was issued to and for what.",
  description: "Check that a Robokalam certificate is genuine on validate.robokalam.com.",
  actions: [{ href: EXTERNAL.validate.href, label: "Go to validate.robokalam.com", primary: true }],
  index: true,
  blocks: [
    {
      kind: "prose", heading: "How it works",
      bullets: [
        "Find the certificate ID printed on the certificate.",
        "Open validate.robokalam.com and enter the ID.",
        "Check that the name, programme and date match the certificate you were given.",
      ],
      after: [`If the details don't match, or the ID isn't found, write to ${CONTACT.email} and we will check it for you.`],
    },
  ],
};

export const events: ContentPage = {
  eyebrow: "Events",
  title: "Where learners show what they built.",
  lede: "Code weeks, science fairs, workshops, summer camps and graduations, in schools and online.",
  description: "Robokalam events: Ashaers Code Week, science fairs, workshops, summer camps, bootcamp graduations and SKOOL ENGINE.",
  actions: [{ href: "/contact", label: "Bring an event to your school", primary: true }],
  blocks: [
    {
      kind: "cards", cols: 3,
      items: [
        { tag: "Code Weeks", title: "Ashaers Code Week", body: "A week of fun group activities in coding. Students get into code, explore it, and we showcase what they make." },
        { tag: "Science Fairs", title: "Science fairs", body: "When students compete, innovation follows. Our fairs bring out the best ideas in every school that takes part." },
        { tag: "Workshops", title: "Workshops", body: "Hands-on sessions in robotics, IoT, AI and coding that give students a real feel for problem-solving." },
        { tag: "Summer Camps", title: "Robotics Summer Camp", body: "Electronics, advanced robotics, IoT and virtual reality over the holidays, ending in a demo.", href: "/programs/robotics-summer-camp", cta: "About the camp" },
        { tag: "Graduation", title: "Bootcamp graduations", body: "Each AIML Bootcamp cohort ends with a graduation, online and in person.", href: "/bootcamps", cta: "About bootcamps" },
        { tag: "Fest", title: "SKOOL ENGINE", body: "Our annual student innovation fest with Samaritans Stand Up Organization." },
      ],
    },
    { kind: "note", text: "Photos of children appear here only with each parent's written consent." },
  ],
};

export const partners: ContentPage = {
  eyebrow: "Partners",
  title: "Partner with Robokalam.",
  lede: "We work with schools, colleges, CSR teams, governments and EdTech companies to put real technology education where it is missing.",
  description: "Partner with Robokalam: schools, colleges, CSR, government programmes and EdTech companies.",
  actions: [{ href: "/contact", label: "Talk to us", primary: true }],
  blocks: [
    {
      kind: "cards", cols: 2,
      items: [
        { tag: "Schools", title: "21C STEM & AI labs", body: "A lab built and run with you: design, kits, curriculum, a trained instructor, and AADHYA and 21cschool to run it.", href: "/21c-lab", cta: "See the lab" },
        { tag: "Labs", title: "Lab models that fit your campus", body: "Edu-Eve, a lab on wheels for two-day workshops; Ason Labs, which merges science labs with robotics in a small space; and KALWINGS, a full robotics lab of your own." },
        { tag: "CSR and government", title: "Programmes that reach more students", body: "Outreach in government institutions, early-coding programmes and teacher training, planned around your goals." },
        { tag: "Colleges", title: "Kalamites and Campus Ambassadors", body: "Your students teach, earn and lead with Robokalam, fully vetted and trained.", href: "/campus-ambassadors", cta: "Campus Ambassadors" },
      ],
    },
    { kind: "note", text: "Partner names and logos appear here only with each partner's permission." },
  ],
};

export const studio: ContentPage = {
  eyebrow: "Studio",
  title: "Software for education, built by people who teach.",
  lede: "Robokalam Studio builds custom software for schools, colleges and EdTech companies, on the same foundations as AADHYA and 21cschool.",
  description: "Robokalam Studio: custom EdTech software, integrations, apps and websites for schools and education companies.",
  actions: [{ href: "/contact", label: "Tell us what you need", primary: true }],
  blocks: [
    {
      kind: "cards", cols: 3,
      items: [
        { title: "Integrations", body: "Connect AADHYA and 21cschool to the software your school already uses." },
        { title: "Web and mobile apps", body: "Portals, learning apps and tools for parents, teachers and students." },
        { title: "Websites", body: "Fast, accessible websites for schools and education brands." },
        { title: "AI tools", body: "Assistants, assessment helpers and content tools, built with child-safety rules from day one." },
        { title: "Hardware and IoT", body: "Prototypes and devices on RK Brain and other boards." },
        { title: "Curriculum platforms", body: "Course delivery, quizzes and progress tracking for your own curriculum." },
      ],
    },
  ],
};

export const impact: ContentPage = {
  eyebrow: "Impact",
  title: "Impact, measured honestly.",
  lede: "Every number we publish has a definition, an as-of date, evidence and an owner. Until a number has all four, we don't show it.",
  description: "How Robokalam measures and publishes impact.",
  blocks: [
    {
      kind: "prose", heading: "What we will report",
      bullets: [
        "Schools with a running 21C lab, and how many students use it each week.",
        "Learners who finished a project, by programme.",
        "Kalamites trained and teaching, and the hours they have delivered.",
        "Parent satisfaction, from verified parents whose child attended.",
      ],
    },
    { kind: "note", text: "Figures appear here once they have been verified." },
  ],
};
