/**
 * The Robokalam blog. Posts are data (mirrors the CMS "posts" collection).
 * Rules: no unverified numbers or results (Claims Register), no children's names
 * or photos without written parent consent, no earnings promises.
 */

export type PostSection = {
  h2: string;
  paras?: string[];
  bullets?: string[];
  steps?: string[];
  code?: { lang: string; text: string };
  after?: string[];
};

export type Post = {
  slug: string;
  title: string;
  /** Meta description: 140-160 characters, says what the reader gets. */
  description: string;
  excerpt: string;
  tag: "Parents" | "Schools" | "Projects" | "Electronics" | "AI & ML" | "Kalamites" | "Safety";
  /** Local pages this post supports. */
  cities?: ("hyderabad" | "warangal")[];
  keywords: string[];
  published: string; // ISO date
  updated?: string;
  author: string;
  sections: PostSection[];
  cta: { href: string; label: string };
};

const team = "Robokalam curriculum team";

export const posts: Post[] = [
  {
    slug: "robotics-classes-for-kids-in-hyderabad",
    title: "Robotics classes for kids in Hyderabad: a parent's checklist",
    description: "What to look for in robotics, coding and AI classes for children in Hyderabad: age fit, real builds, vetted teachers, safety, fees and kits.",
    excerpt: "Hyderabad has no shortage of robotics classes. Here is how to tell the ones where your child builds something real from the ones that only look good in a brochure.",
    tag: "Parents",
    cities: ["hyderabad"],
    keywords: ["robotics classes for kids in Hyderabad", "coding classes Hyderabad", "STEM classes Hyderabad", "AI classes for kids Hyderabad"],
    published: "2026-11-02",
    author: team,
    sections: [
      { h2: "Start with your child, not the brochure", paras: ["A good robotics class matches your child's age and what they already enjoy. A six-year-old who loves taking toys apart needs circuits they can touch. A twelve-year-old who plays games all day may be ready to make one. Ask the provider which track fits your child's age and why."] },
      {
        h2: "The checklist",
        bullets: [
          "Every class ends with a build. Ask what your child will have made at the end of the first class, and at the end of the month.",
          "Small groups. Your child should get hands-on time, not watch a demo.",
          "Vetted teachers. Ask how teachers are checked: identity, background, references and a child-safety course should all be part of it.",
          "Recorded online classes, and no private chats. Contact should stay on the provider's platform.",
          "The full fee before you pay, including the kit and GST. Walk away from loans, financing or multi-year lock-ins.",
          "A published refund policy you can use yourself.",
          "A clear path forward: from circuits to robots to code to AI, not the same course repackaged.",
        ],
      },
      { h2: "Online, at school, or both?", paras: ["Across Hyderabad, from Hitec City and Gachibowli to Secunderabad, Kukatpally and LB Nagar, traffic makes online classes the easiest option for most families. Live online classes work well for robotics when the kit is at home and the group is small. If your child's school runs a 21C STEM & AI lab, in-school periods and online classes can follow the same curriculum, so nothing is learnt twice."] },
      { h2: "Try before you commit", paras: ["The best test is one real class. Robokalam's Free Build Session puts your child in a small live session with a vetted educator, and they finish one build. You get plain feedback and a suggested next step with the full fee shown. If it's not right, you've lost nothing."] },
    ],
    cta: { href: "/learn#book", label: "Book a Free Build Session" },
  },
  {
    slug: "stem-ai-lab-for-schools-in-warangal",
    title: "Setting up a STEM & AI lab in a Warangal school: a practical plan",
    description: "A step-by-step plan for schools in Warangal, Hanamkonda and Kazipet setting up a robotics, STEM and AI lab: room, kits, curriculum, teachers and timetable.",
    excerpt: "A lab is more than a room of kits. This is the plan we walk schools through, from the first conversation to the first lab period.",
    tag: "Schools",
    cities: ["warangal"],
    keywords: ["STEM lab for schools in Warangal", "robotics lab Warangal", "AI lab for schools Telangana", "ATL lab Warangal"],
    published: "2026-10-28",
    author: team,
    sections: [
      { h2: "Begin with the timetable", paras: ["Most labs that fail do so because there is no lab period. Before choosing kits, decide which classes get a weekly period and who teaches it. A lab that is used every week by every section is worth far more than an impressive one that opens for visitors."] },
      {
        h2: "The plan, step by step",
        steps: [
          "Share your board, classes, student numbers and the room you have. Our Lab Planner suggests a package in a few minutes.",
          "Agree the curriculum by class: electronics and robotics for younger students, code, IoT and AI as they grow.",
          "Prepare the room: power points at every table, storage, a projector and stable internet for the AADHYA platform.",
          "Install kits and devices, then train your teachers on the first term's lessons before students arrive.",
          "Run the first lab periods with support, and review after the first month.",
        ],
      },
      { h2: "Teachers come first", paras: ["Teachers who feel unsure about new kit quietly stop using it. Training, lesson plans for every period, and someone to call when a sensor stops working keep the lab running. Ask any provider exactly what support looks like after installation, in writing."] },
      { h2: "Schools across Warangal district", paras: ["We work with schools in Warangal, Hanamkonda, Kazipet and the surrounding district. Planning, teacher training and the AADHYA platform work fully online, and installation and in-school sessions are arranged with each school. Classes are available in English and Telugu."] },
    ],
    cta: { href: "/21c-lab#demo", label: "Book a Turnkey Demo" },
  },
  {
    slug: "build-a-line-following-robot",
    title: "Build a line-following robot: parts, wiring and code",
    description: "A beginner's guide to building a line-following robot with an Arduino, two IR sensors and a motor driver. Parts list, wiring and complete code.",
    excerpt: "The line follower is the classic first autonomous robot. Two sensors, two motors and about thirty lines of code.",
    tag: "Projects",
    keywords: ["line following robot", "Arduino line follower code", "robotics project for students"],
    published: "2026-10-20",
    author: team,
    sections: [
      { h2: "How it works", paras: ["Two infrared sensors look down at the floor. A black line reflects less infrared light than the white floor around it. If the left sensor sees the line, the robot is drifting right, so it turns left. If the right sensor sees it, it turns right. If neither does, it drives straight."] },
      { h2: "Parts", bullets: ["An Arduino Uno or RK Brain board", "2 IR sensor modules", "L298N motor driver", "2 geared DC motors with wheels, plus a caster wheel", "A chassis, a battery pack (7.4V) and jumper wires", "Black electrical tape for the track"] },
      { h2: "Wiring", bullets: ["Left sensor OUT to pin 2, right sensor OUT to pin 3. Sensor VCC to 5V, GND to GND.", "Motor driver IN1 to IN4 to pins 5, 6, 9 and 10.", "Battery to the driver's 12V input; driver 5V out to the Arduino's 5V; join all grounds."], after: ["Always connect grounds together, and check the polarity before switching on."] },
      {
        h2: "Code",
        code: {
          lang: "cpp",
          text: `const int L = 2, R = 3;          // IR sensors: LOW = line seen (most modules)
const int M[] = {5, 6, 9, 10};   // motor driver IN1..IN4

void drive(int a, int b, int c, int d) {
  digitalWrite(M[0], a); digitalWrite(M[1], b);
  digitalWrite(M[2], c); digitalWrite(M[3], d);
}

void setup() {
  pinMode(L, INPUT); pinMode(R, INPUT);
  for (int p : M) pinMode(p, OUTPUT);
}

void loop() {
  bool left = digitalRead(L) == LOW, right = digitalRead(R) == LOW;
  if (left && !right)      drive(0, 0, 1, 0);  // turn left
  else if (right && !left) drive(1, 0, 0, 0);  // turn right
  else if (!left && !right) drive(1, 0, 1, 0); // straight
  else                     drive(0, 0, 0, 0);  // both on line: stop
}`,
        },
      },
      { h2: "When it doesn't work", bullets: ["It spins in circles: swap the wires of one motor.", "It ignores the line: turn the sensor's potentiometer until its LED changes over the tape.", "It overshoots corners: slow it down with PWM (analogWrite) or make the curves gentler."], after: ["Debugging is the real lesson. Every fix teaches something about sensors, motors or logic."] },
    ],
    cta: { href: "/programs/robo-ashaers", label: "Explore Robo Ashaers" },
  },
  {
    slug: "arduino-vs-raspberry-pi",
    title: "Arduino or Raspberry Pi: choosing your first board",
    description: "A plain comparison of Arduino and Raspberry Pi for students: what each is good at, which to start with, and when to use both.",
    excerpt: "One is a microcontroller, the other is a small computer. Here's which one to pick for your first project.",
    tag: "Electronics",
    keywords: ["Arduino vs Raspberry Pi", "first electronics board for students", "microcontroller for beginners"],
    published: "2026-10-12",
    author: team,
    sections: [
      { h2: "The short answer", paras: ["Start with an Arduino-style microcontroller if you want to make things move, light up or sense the world. Choose a Raspberry Pi when your project needs a screen, a camera, the internet or AI."] },
      { h2: "Arduino: a microcontroller", bullets: ["Runs one program, starts instantly, and can't be broken by a bad shutdown.", "Excellent at reading sensors and driving motors in real time.", "Programmed in a simple version of C++, or with blocks in Scratch-style tools.", "Cheap, tough and forgiving: ideal for a first robot."] },
      { h2: "Raspberry Pi: a small computer", bullets: ["Runs a full operating system, so it can browse, run Python, use a camera and connect to Wi-Fi.", "Good for computer vision, web dashboards and machine-learning projects.", "Needs a proper shutdown and more care with power."] },
      { h2: "Use both", paras: ["Many advanced projects pair them: the microcontroller handles motors and sensors, the Pi handles vision and decisions. Our Ashaer tracks follow that path: circuits and microcontrollers first, then code, IoT and AI."] },
    ],
    cta: { href: "/programs", label: "See the Ashaer tracks" },
  },
  {
    slug: "teaching-ai-to-kids-safely",
    title: "Teaching AI to kids, safely: what parents and schools should know",
    description: "How to introduce children to artificial intelligence safely: what to teach at each age, how to handle chatbots, and how to protect children's data.",
    excerpt: "Children are already using AI. The question is whether they understand it, and whether the tools they use respect them.",
    tag: "AI & ML",
    keywords: ["AI for kids", "teaching AI in schools", "AI classes for children India"],
    published: "2026-10-05",
    author: team,
    sections: [
      { h2: "Teach how it works, not just how to use it", paras: ["A child who has trained a simple model to tell apples from bananas understands something no amount of chatbot use will teach: AI learns from examples, and it is only as good, and as fair, as those examples."] },
      { h2: "By age", bullets: ["6 to 8: sorting, patterns and rules. Unplugged games that show how a machine follows instructions.", "9 to 12: train simple image and sound models, and see where they go wrong.", "13+: Python, datasets, and building small AI projects that solve a real problem."] },
      { h2: "Chatbots and generative AI", bullets: ["Use them together at first, and talk about answers that are confidently wrong.", "Never share full names, school, address or photos with a chatbot.", "Treat AI output as a draft to check, not an answer to copy."] },
      { h2: "Protect children's data", paras: ["Under India's Digital Personal Data Protection Act, platforms need a parent's verifiable consent to process a child's data, and must not track children or target them with ads. Ask any AI tool or class provider how they meet that. At Robokalam, AADHYA is built so children's work stays private by default."] },
    ],
    cta: { href: "/learn", label: "See AI classes for learners" },
  },
  {
    slug: "earn-while-you-study-teaching-tech-hyderabad-warangal",
    title: "Earn while you study: teaching tech as a college student in Hyderabad and Warangal",
    description: "How college students in Hyderabad and Warangal can teach robotics, coding and AI part-time as Kalamites: who can apply, training, safety rules and pay.",
    excerpt: "If you're an engineering, degree or master's student who loves building, teaching it is the fastest way to get better, and you get paid for it.",
    tag: "Kalamites",
    cities: ["hyderabad", "warangal"],
    keywords: ["part time teaching jobs for college students Hyderabad", "robotics trainer jobs Warangal", "Kalamite Robokalam"],
    published: "2026-09-29",
    author: team,
    sections: [
      { h2: "Who can apply", paras: ["College students aged 18 and over in engineering, degree and master's programmes, from Hyderabad, Warangal, anywhere in India or abroad. If you can build it and explain it, you can teach it."] },
      { h2: "How it works", steps: ["Apply with your phone and college email or ID.", "Take a subject test and record a short demo lesson.", "Pass identity and background checks and give references.", "Complete Kalam Academy, including a mandatory child-safety and POCSO course. Training hours are paid.", "Shadow a class, co-teach a class (both paid), then accept the gigs you want."] },
      { h2: "Pay, plainly", paras: ["Every gig shows the pay, duration and subject before you accept, and declining costs you nothing. Payouts are weekly with every deduction listed. Earnings examples on our site are estimates, not promises."] },
      { h2: "The rules that protect children, and you", bullets: ["All contact stays on Robokalam. No personal numbers or social media.", "Every online class is recorded. No home visits, ever.", "In-person gigs only at a partner school or centre with a responsible adult present."] },
    ],
    cta: { href: "/kalamites/apply", label: "Become a Kalamite" },
  },
  {
    slug: "childrens-data-dpdp-act-parents-guide",
    title: "Your child's data and the DPDP Act: a parent's guide to EdTech",
    description: "What India's Digital Personal Data Protection Act means for parents choosing online classes and learning apps for their children, and the questions to ask.",
    excerpt: "Five questions to ask any learning app or online class before you hand over your child's details.",
    tag: "Safety",
    keywords: ["DPDP Act children's data", "EdTech privacy India", "parental consent online classes"],
    published: "2026-09-20",
    author: team,
    sections: [
      { h2: "What the law says", paras: ["India's Digital Personal Data Protection Act, 2023 treats anyone under 18 as a child. Platforms must get a parent's verifiable consent before processing a child's personal data, and must not track children, monitor their behaviour, or target ads at them."] },
      { h2: "Five questions to ask", steps: ["What do you collect about my child, and why?", "How do I give, and withdraw, consent?", "Are classes recorded, and who can see the recordings?", "Can my child be contacted privately by a teacher? (The answer should be no.)", "How do I download or delete my child's data?"] },
      { h2: "How Robokalam answers them", paras: ["Our privacy notice lists what we collect and why. Parents give consent per purpose and can withdraw it in their account. Classes are recorded and stay on the platform. Parents can download everything we hold, or delete it, at any time."] },
    ],
    cta: { href: "/privacy", label: "Read our privacy notice" },
  },
];

export const postBySlug = (slug: string) => posts.find((p) => p.slug === slug);
export const sortedPosts = () => [...posts].sort((a, b) => b.published.localeCompare(a.published));

export function readingMinutes(p: Post) {
  const words = p.sections.flatMap((s) => [s.h2, ...(s.paras ?? []), ...(s.bullets ?? []), ...(s.steps ?? []), ...(s.after ?? []), s.code?.text ?? ""]).join(" ").split(/\s+/).length;
  return Math.max(2, Math.round(words / 200));
}

export const fmtDate = (iso: string) => new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
