/**
 * Kalam Academy. DRAFT content for the curriculum and legal teams to replace.
 * Child-safety modules are mandatory and need a perfect quiz score.
 * Each module counts as paid training time (rate card: training_hour).
 */
export type Quiz = { q: string; options: string[]; answer: number }[];
export type Module = { id: string; title: string; minutes: number; mandatory: boolean; passAll: boolean; points: string[]; quiz: Quiz };

export const academy: Module[] = [
  {
    id: "craft-small-groups",
    title: "Teaching craft: small groups that build",
    minutes: 45,
    mandatory: true,
    passAll: false,
    points: [
      "Open with the build, not the theory: show what everyone will make by the end.",
      "Talk less than 30% of the time. Ask, wait, then hint.",
      "Every learner touches the kit in the first 10 minutes.",
      "Praise effort and debugging, not speed. No public comparisons.",
      "End with a 2-minute show-and-tell and one plain next step.",
    ],
    quiz: [
      { q: "A learner is stuck. What do you do first?", options: ["Fix it for them", "Ask what they expected to happen", "Move on to keep pace"], answer: 1 },
      { q: "How should a session start?", options: ["A long explanation", "Showing what we will build today", "A quiz"], answer: 1 },
      { q: "What do you praise?", options: ["Who finished first", "Effort and debugging", "The neatest build"], answer: 1 },
    ],
  },
  {
    id: "child-safety",
    title: "Child safety and safeguarding",
    minutes: 60,
    mandatory: true,
    passAll: true,
    points: [
      "Anyone under 18 is a child. You are never alone with a child: no home visits, no private 1:1s.",
      "All contact stays on Robokalam. Never share or ask for phone numbers, social media, email or private chats.",
      "Online classes are recorded. Never move a class to another app.",
      "In person: only at a partner school or centre with the named responsible adult present.",
      "You see first name, age band and progress only. Never photograph, record or post learners.",
      "If a child tells you something worrying: listen, don't promise secrecy, don't investigate, report at once using the help button.",
    ],
    quiz: [
      { q: "A parent asks for your WhatsApp to send homework. You:", options: ["Share it", "Keep it on Robokalam messages", "Share your Instagram instead"], answer: 1 },
      { q: "A child tells you something worrying and asks you to keep it secret. You:", options: ["Promise to keep it secret", "Listen, don't promise secrecy, and report at once", "Ask lots of questions to find out more"], answer: 1 },
      { q: "A school asks you to take one learner aside alone for extra help. You:", options: ["Agree", "Keep it in the group or with the responsible adult present", "Do it online on another app"], answer: 1 },
      { q: "Can you take a photo of a learner's build with the learner in it for your portfolio?", options: ["Yes", "No, never photograph learners", "Only if they smile"], answer: 1 },
    ],
  },
  {
    id: "pocso-essentials",
    title: "POCSO Act essentials and your reporting duty",
    minutes: 40,
    mandatory: true,
    passAll: true,
    points: [
      "The Protection of Children from Sexual Offences Act, 2012 (POCSO) protects everyone under 18.",
      "Section 19: anyone who knows or suspects that a sexual offence against a child has happened, or may happen, must report it to the Special Juvenile Police Unit or the local police.",
      "Section 21: failing to report is itself an offence.",
      "At Robokalam, report immediately to the Safeguarding Lead through the help button as well. They support the legal report; they do not replace your duty.",
      "Never confront the suspected person or investigate yourself. Write down what you saw or heard, in the child's words, with the time.",
    ],
    quiz: [
      { q: "Who does POCSO protect?", options: ["Children under 14", "Everyone under 18", "Only school students"], answer: 1 },
      { q: "If you suspect a sexual offence against a child, the law requires you to:", options: ["Wait for proof", "Report it to the police or Special Juvenile Police Unit", "Tell only the child's friends"], answer: 1 },
      { q: "What do you write down?", options: ["Your guess about what happened", "What you saw or heard, in the child's words, with the time", "Nothing"], answer: 1 },
    ],
  },
  {
    id: "platform-rules",
    title: "How Robokalam works for Fellows",
    minutes: 30,
    mandatory: true,
    passAll: false,
    points: [
      "Pay, duration and subject are shown before you accept. Declining has no penalty.",
      "Your term-time weekly hours are capped. Exam Mode pauses everything with no ranking loss.",
      "Tiers rise with reliability, learner progress and verified parent feedback. The formula is in your app.",
      "No incentives for selling. Never pitch courses to families.",
      "Disputes go to a committee. Removal needs written reasons, an enquiry and 7 days' notice, unless a child's safety requires immediate action.",
    ],
    quiz: [
      { q: "You decline three gigs this week. What happens to your tier?", options: ["It drops", "Nothing", "You are paused"], answer: 1 },
      { q: "A parent asks which course to buy next. You:", options: ["Recommend the most expensive one", "Share the plain next step from the session; Robokalam shows fees", "Offer a discount"], answer: 1 },
      { q: "Exams next week. You:", options: ["Turn on Exam Mode", "Accept gigs anyway", "Ghost your gigs"], answer: 0 },
    ],
  },
  {
    id: "running-a-session",
    title: "Running a Robokalam session",
    minutes: 45,
    mandatory: true,
    passAll: false,
    points: [
      "Before: open Teach mode, read the lesson plan, check the kit list.",
      "During: mark attendance, keep cameras on the build, use the help button for any problem.",
      "After: record what each learner built and one plain line of feedback.",
      "Kit safety: low-voltage only, no live propellants, follow the kit card.",
      "Financial Literacy: money basics only. Never stock tips, trading or crypto.",
    ],
    quiz: [
      { q: "Where do you find the lesson plan?", options: ["WhatsApp", "Teach mode", "Ask a learner"], answer: 1 },
      { q: "A learner asks which stock to buy. You:", options: ["Suggest one", "Explain we cover money basics only", "Share a crypto tip"], answer: 1 },
      { q: "After the session you:", options: ["Leave", "Record builds and one line of feedback per learner", "Post photos"], answer: 1 },
    ],
  },
];

export const mandatoryModules = academy.filter((m) => m.mandatory).map((m) => m.id);

export function gradeModule(m: Module, answers: number[]): { score: number; passed: boolean } {
  const correct = m.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const score = Math.round((correct / m.quiz.length) * 100);
  return { score, passed: m.passAll ? correct === m.quiz.length : score >= 66 };
}
