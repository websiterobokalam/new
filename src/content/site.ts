/**
 * Site content for Phase 1. Shape mirrors the CMS collections (pages, courses,
 * programmes, faqs, stories). Copy marked `draft: true` was written for this
 * rebuild and needs a curriculum or legal owner to sign it off.
 */

export type DoorId = "learner" | "school" | "educator";

export const doors: {
  id: DoorId;
  name: string;
  who: string;
  line: string;
  cta: string;
  href: string;
  login: string;
  accent: string;
}[] = [
  {
    id: "learner",
    name: "Learner",
    who: "Students and parents",
    line: "Build real tech, from age 6",
    cta: "Book a Free Build Session",
    href: "/learn",
    login: "/login/learner",
    accent: "var(--color-sky)",
  },
  {
    id: "school",
    name: "School",
    who: "Schools, colleges, CSR and government",
    line: "A lab that runs itself",
    cta: "Book Turnkey Demo",
    href: "/21c-lab",
    login: "/login/school",
    accent: "var(--color-aqua)",
  },
  {
    id: "educator",
    name: "Educator",
    who: "Kalam Fellows: college students who teach",
    line: "Teach what you love. Earn while you study",
    cta: "Become a Fellow",
    href: "/fellows",
    login: "/login/educator",
    accent: "var(--color-leaf)",
  },
];

export type WorldId = "robotics" | "iot" | "ai" | "finlit" | "space" | "coding";

export const worlds: {
  id: WorldId;
  name: string;
  line: string;
  shape: string;
  accent: string;
  ink: string;
  href: string;
  note?: string;
}[] = [
  { id: "robotics", name: "Robotics", line: "Wire it, code it, watch it move.", shape: "circuit", accent: "#1AB0E2", ink: "#075a80", href: "/courses?world=robotics" },
  { id: "iot", name: "IoT", line: "Make everyday things sense and talk.", shape: "pulse", accent: "#1590BC", ink: "#0B5C7A", href: "/courses?world=iot" },
  { id: "ai", name: "AI", line: "Train a model. Then question it.", shape: "neural", accent: "#F7A21C", ink: "#8A4B00", href: "/courses?world=ai" },
  { id: "finlit", name: "Financial Literacy", line: "Money basics: earn, save, plan, start up.", shape: "growth", accent: "#97BC3D", ink: "#4d6418", href: "/courses?world=financial-literacy", note: "Money basics only. No stock tips, trading or crypto." },
  { id: "space", name: "Space Education", line: "Orbits, satellites and safe model rockets.", shape: "orbit", accent: "#0B4168", ink: "#0B4168", href: "/courses?world=space", note: "Safe models only." },
  { id: "coding", name: "Coding", line: "The shared skill under every world: blocks to Python.", shape: "code", accent: "#0B4168", ink: "#0B4168", href: "/courses?world=coding" },
];

/** Names and ages reused exactly from the brief. Outcome lines are draft. */
export const programmes = [
  { slug: "electro-ashaers", name: "Electro Ashaers", age: 6, outcome: "First circuits: make light, sound and motion happen.", draft: true },
  { slug: "robo-ashaers", name: "Robo Ashaers", age: 7, outcome: "Build and program a robot that follows your rules.", draft: true },
  { slug: "codo-ashaers", name: "CODO Ashaers", age: 8, outcome: "From blocks to real code, one working project at a time.", draft: true },
  { slug: "advance-ashaers", name: "Advance Ashaers", age: 9, outcome: "Sensors, IoT and AI projects that solve a real problem.", draft: true },
  { slug: "robotics-summer-camp", name: "Robotics Summer Camp", age: 7, outcome: "A focused holiday build sprint that ends in a demo day.", draft: true },
  { slug: "aiml-bootcamp", name: "AIML Bootcamp", age: null, outcome: "Hands-on machine learning for older students and college learners.", draft: true },
] as const;

export const ladder = [
  { stage: "Age 6+", title: "Electro Ashaers", detail: "Circuits you can touch." },
  { stage: "Age 7+", title: "Robo Ashaers", detail: "Your first robot moves." },
  { stage: "Age 8+", title: "CODO Ashaers", detail: "Blocks become code." },
  { stage: "Age 9+", title: "Advance Ashaers", detail: "Sensors, IoT and AI." },
  { stage: "Teens", title: "Bootcamps and camps", detail: "AIML Bootcamp, Robotics Summer Camp." },
  { stage: "College", title: "Internships, or become a Fellow", detail: "Build for real clients. Teach the next batch." },
];

export const platform = [
  { name: "AADHYA", line: "AI cloud platform where learners build and save work." },
  { name: "21cschool", line: "ERP for school operations and lab scheduling." },
  { name: "RK Brain", line: "Robokalam's own microcontroller chips." },
  { name: "ASHAER packs", line: "Kits matched to each Ashaer level." },
  { name: "RKuiz", line: "Quick checks that show what a learner has mastered." },
];

export const gigs = [
  { name: "Live Batch", where: "Online", format: "4 to 8 learners, Robokalam curriculum" },
  { name: "Campus Session", where: "Partner school or lab near your college", format: "A trainer or teacher is always present" },
  { name: "Weekend Workshop", where: "School, centre or event", format: "Teach as a team of Fellows" },
  { name: "Doubt Desk", where: "Online group room", format: "Short, recorded help sessions" },
  { name: "Project Mentor", where: "Online", format: "Project reviews parents can see, 2+ learners" },
  { name: "Fellow's Own Course", where: "Online", format: "Reviewed and approved before it goes live" },
];

export const fellowJourney = [
  { title: "Apply", detail: "Phone OTP plus your college email or ID." },
  { title: "Pick your worlds", detail: "Choose subjects and the hours you are free." },
  { title: "Subject test", detail: "Show you know the material." },
  { title: "Recorded demo", detail: "Teach a short lesson on camera." },
  { title: "Verification", detail: "Identity, background check and references." },
  { title: "Kalam Academy", detail: "Teaching craft plus a mandatory child-safety and POCSO course. Paid training hours." },
  { title: "Terms and code of conduct", detail: "Plain terms on pay, deductions and rules." },
  { title: "Shadow, then co-teach", detail: "Watch one class. Co-teach one class. Both paid." },
  { title: "Go live", detail: "Accept the gigs you want." },
];

export const fellowSteps = [
  { title: "Apply in minutes", detail: "Phone, college, the worlds you love and the hours you are free." },
  { title: "Get vetted, get trained", detail: "Subject test, recorded demo, checks, then Kalam Academy. Training hours are paid." },
  { title: "Pick your gigs", detail: "See pay, duration and subject before you accept. Declining costs you nothing." },
  { title: "Teach, get paid weekly", detail: "Every session, deduction and payout shown line by line." },
];

export const fellowRules = [
  "Fellows are 18+ and fully vetted before any contact with a child.",
  "No home visits, ever. One-to-one with under-18s only online on Robokalam, recorded, with the parent's consent and a notice to them before and after every session.",
  "All contact stays on the platform. No personal numbers, social media or private chats.",
  "Every online class is recorded. Parents can see your profile and class schedule.",
  "In-person gigs only at a partner school or centre, with a responsible adult present.",
  "Any credible safety concern means access is suspended at once and reported as the law requires.",
];

export const parentTrust = [
  { title: "Vetted educators", detail: "Every Fellow passes identity, background and reference checks, a subject test and a child-safety course before teaching." },
  { title: "Classes stay on the platform", detail: "Recorded online classes. No personal numbers or private chats. Contact details in messages are blocked." },
  { title: "Fees before you pay", detail: "The full fee is shown before payment. No loans, no financing, no multi-year lock-ins." },
  { title: "Self-serve refunds", detail: "Published refund terms and a refund button in your account." },
  { title: "Your child's data", detail: "Parental consent first. Portfolios private by default. Delete data any time." },
  { title: "One-tap report", detail: "Every learner screen has a report button that goes to a named Safeguarding Lead." },
  { title: "One-to-one, with you in the loop", detail: "Only online and recorded, only with your specific consent. You get an email before and a written summary after every session, and you can join any time." },
];

export const faqs = [
  {
    q: "What happens in a Free Build Session?",
    a: "Your child gets a mini mission, joins a small live session with a vetted Fellow or trainer, and finishes one build. You get the build, plain feedback and a suggested next step with the full fee shown. We follow up once, only if you agree.",
  },
  {
    q: "Who teaches my child?",
    a: "A Robokalam trainer or a Kalam Fellow. Fellows are college students aged 18+ who pass a subject test, a recorded demo, identity and background checks, references, and Kalam Academy, including a mandatory child-safety and POCSO course.",
  },
  {
    q: "Are classes one to one?",
    a: "Most classes are small groups. We also offer one-to-one classes online, with you in the loop: they need your specific consent and a confirmed email, every session is recorded, you get a notice before and a written summary after each one, and you can join any session. There are never home visits.",
  },
  {
    q: "Do you offer loans or long plans?",
    a: "No. Fees are shown before you pay. We do not offer loans, financing or multi-year lock-ins, and refund requests are self-serve.",
  },
  {
    q: "How does a school get a 21C lab?",
    a: "Book a Turnkey Demo or try the Lab Planner. We suggest a package and a rollout plan for your board, classes, student numbers and room.",
  },
  {
    q: "How do Kalam Fellows get paid?",
    a: "Robokalam-curriculum gigs pay a fixed amount per session, shown before you accept. Payouts are weekly, with every deduction listed. Earnings examples are estimates, not promises.",
  },
  {
    q: "What does Financial Literacy cover?",
    a: "Money basics: earning, saving, budgeting, planning and starting a small venture. No stock tips, trading calls, crypto promotion or investment advice.",
  },
];

export const initiatives = [
  { claim: "initiative.tita", title: "Telangana Early Coders", line: "Bringing early coding to classrooms across Telangana." },
  { claim: "initiative.code-week", title: "Ashaers Code Week", line: "A week where students ship something real." },
  { claim: "initiative.code-to-change", title: "Code to Change Jr.", line: "Young builders tackle problems in their own communities." },
];

export const regions = [
  { id: "ts-ap", name: "Telangana and Andhra Pradesh", languages: ["English", "తెలుగు", "हिन्दी"], offline: true },
  { id: "india", name: "Rest of India", languages: ["English", "हिन्दी"], offline: false },
  { id: "intl", name: "International", languages: ["English"], offline: false },
] as const;

export type RegionId = (typeof regions)[number]["id"];
