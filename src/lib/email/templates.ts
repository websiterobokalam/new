import { layout, type Block, type Rendered } from "./layout";

/**
 * Every email Robokalam sends. Payloads carry ready-to-show strings (names,
 * India-time dates, links), so rendering is pure and testable. No child data
 * beyond a first name, and never any message content or recording.
 */
type P = Record<string, any>;
type Def = { category: Category; render: (p: P) => { subject: string; heading: string; preheader?: string; blocks: Block[] } };
export type Category = "transactional" | "updates" | "oversight" | "staff";

const FOOTER: Record<Category, string> = {
  transactional: "You're getting this because of something you did on Robokalam. Keep it for your records.",
  updates: "Class updates for your Robokalam account.",
  oversight: "This email is part of how you oversee one-to-one classes. It can't be turned off while one-to-one classes are on; withdraw that consent in the Consent centre to stop them.",
  staff: "Robokalam team notification.",
};

const rows = (r: [string, string | null | undefined][]) => ({ rows: r.filter(([, v]) => v != null && v !== "") as [string, string][] });

export const TEMPLATES = {
  certificate_issued: { category: "transactional", render: (p) => ({
    subject: `Certificate: ${p.title}`, heading: "Your certificate is ready",
    blocks: [{ p: `Congratulations, ${p.name}! Your Robokalam certificate for ${p.title} is ready.` }, { rows: [["Certificate ID", p.code]] }, { cta: { label: "View and print", href: p.link } }, { note: "Anyone can check it's genuine at robokalam.com/validate with this ID. Share the ID only with people you choose." }],
  }) },
  login_code: { category: "transactional", render: (p) => ({
    subject: `${p.code} is your Robokalam sign-in code`, heading: "Your sign-in code", preheader: `Use ${p.code} to sign in. It expires in 10 minutes.`,
    blocks: [{ p: "Use this code to sign in to Robokalam:" }, { p: p.code }, { note: "It works once and expires in 10 minutes. Robokalam will never ask you for this code by phone or chat. If you didn't try to sign in, ignore this email; nobody can sign in without the code." }],
  }) },
  login_created: { category: "transactional", render: (p) => ({
    subject: "Your Robokalam login is ready", heading: "Your Robokalam login is ready",
    blocks: [{ p: `Hi ${p.name}, ${p.by} has created a Robokalam login for you${p.role ? ` as ${p.role}` : ""}.` }, { p: `Sign in with this email address. We'll send you a one-time code each time, so there's no password to remember.` }, { cta: { label: "Sign in", href: p.link } }, { note: "If you weren't expecting this, reply to this email and we'll remove the login." }],
  }) },
  verify_email: { category: "transactional", render: (p) => ({
    subject: "Confirm your email for Robokalam", heading: "Confirm your email",
    blocks: [{ p: `Hi ${p.name}, please confirm this is your email so we can send class confirmations, receipts and updates.` }, { cta: { label: "Confirm my email", href: p.link } }, { note: "The link works for 48 hours. If you didn't ask for this, ignore this email." }],
  }) },
  lead_ack_learner: { category: "transactional", render: (p) => ({
    subject: `We got your request (${p.ref})`, heading: "Thanks, we've got your request",
    blocks: [{ p: `Hi ${p.name}, thanks for asking about a Free Build Session. Your reference is ${p.ref}.` }, { p: "Next: book a time yourself, or we'll get in touch once, as you agreed." }, { cta: { label: "Book a Free Build Session", href: "/learn/build-session" } }],
  }) },
  lead_ack_school: { category: "transactional", render: (p) => ({
    subject: `Your demo request (${p.ref})`, heading: "Thanks, we've got your demo request",
    blocks: [{ p: `Hi ${p.name}, thanks for your interest in a 21C STEM & AI Lab for ${p.institution}. Your reference is ${p.ref}.` }, { p: "Someone from our schools team will contact you at the time you chose to plan a demo." }],
  }) },
  lead_ack_educator: { category: "transactional", render: (p) => ({
    subject: `Kalamites: we got your interest (${p.ref})`, heading: "Thanks for your interest in Kalamites",
    blocks: [{ p: `Hi ${p.name}, thanks for your interest in teaching with Kalamites. Your reference is ${p.ref}.` }, { cta: { label: "Start your application", href: "/kalamites/apply" } }, { note: "No fees, ever. Pay is shown before you accept any gig." }],
  }) },
  staff_new_lead: { category: "staff", render: (p) => ({
    subject: `New ${p.door} lead ${p.ref}`, heading: `New ${p.door} lead`,
    blocks: [rows([["Reference", p.ref], ["Queue", p.queue], ["Name", p.name], ["Phone", p.phone], ["Details", p.summary]])],
  }) },

  consent_receipt: { category: "transactional", render: (p) => ({
    subject: `Your consent choices for ${p.child}`, heading: `Consent record for ${p.child}`,
    blocks: [{ p: `This is your record of what you agreed to on ${p.when}, under notice version ${p.notice}.` }, { p: "You agreed to:" }, { list: p.granted }, ...(p.declined.length ? [{ p: "You said no to:" }, { list: p.declined }] : []),
      ...(p.oneToOne ? [{ p: "One-to-one classes are on. You'll get an email before and after every one-to-one session, and you can join any session from your account." } as Block] : []),
      { cta: { label: "Change or withdraw any choice", href: "/app/consent" } }],
  }) },
  consent_withdrawn: { category: "transactional", render: (p) => ({
    subject: `You withdrew consent for ${p.child}`, heading: "Consent withdrawn",
    blocks: [{ p: `On ${p.when} you withdrew: ${p.purpose}. This took effect at once.` }, ...(p.oneToOne ? [{ p: "No one-to-one sessions will start from now. If you paid for sessions that won't happen, request a refund from Orders." } as Block] : []), { cta: { label: "Open the Consent centre", href: "/app/consent" } }],
  }) },

  booking_confirmed: { category: "transactional", render: (p) => ({
    subject: `Booked: ${p.course} for ${p.child}`, heading: `${p.child} is booked in`,
    blocks: [rows([["Class", p.course], ["When", p.when], ["Where", p.where], ["Educator", p.educator], ["Fee", p.fee]]), ...(p.mission ? [{ p: `Before the class: ${p.mission}` } as Block] : []),
      { p: "Online classes are recorded on the platform for safety. All contact stays on Robokalam." }, { cta: { label: "See it in your family home", href: "/app" } }],
  }) },
  payment_receipt: { category: "transactional", render: (p) => ({
    subject: `Payment received: ${p.amount}`, heading: "Payment received",
    blocks: [rows([["For", `${p.course} (${p.child})`], ["Amount", `${p.amount} incl. GST`], ["Invoice", p.invoice]]), { p: "Your fee is held until each session is delivered. Refund terms are on your Orders page." }, { cta: { label: "View invoice and orders", href: "/app/orders" } }],
  }) },
  class_reminder: { category: "updates", render: (p) => ({
    subject: `Tomorrow: ${p.course}`, heading: `${p.child}'s class is coming up`,
    blocks: [rows([["Class", p.course], ["When", p.when], ["Educator", p.educator]]), { p: "Join from your family home a few minutes early. Classes are recorded on the platform." }, { cta: { label: "Open family home", href: "/app" } }],
  }) },
  session_summary: { category: "updates", render: (p) => ({
    subject: `How ${p.child}'s class went`, heading: `${p.child}'s class: ${p.course}`,
    blocks: [rows([["When", p.when], ["Attendance", p.attended ? "Attended" : "Missed"], ["Built", p.built], ["Educator's note", p.feedback], ["Next step", p.nextStep]]), { cta: { label: "See progress", href: "/app" } }],
  }) },
  oto_before: { category: "oversight", render: (p) => ({
    subject: `One-to-one session for ${p.child}: ${p.when}`, heading: "A one-to-one session is coming up",
    preheader: "You can join or watch any session.",
    blocks: [rows([["Learner", p.child], ["Class", p.course], ["When", p.when], ["Educator", p.educator]]),
      { list: ["You can join this session from your account at any time, without telling anyone first.", "It's online on Robokalam and recorded. The recording is kept 30 days.", "The educator can't contact your child outside Robokalam.", "Something feels wrong? Use the report button. A Safeguarding Lead responds."] },
      { cta: { label: "Open the class page", href: p.classLink } }, { note: `Educator profile: ${p.profile}` }],
  }) },
  oto_after: { category: "oversight", render: (p) => ({
    subject: `After ${p.child}'s one-to-one session`, heading: "How the one-to-one session went",
    blocks: [rows([["Learner", p.child], ["Class", p.course], ["When", p.when], ["Educator", p.educator], ["Attendance", p.attended ? "Attended" : "Missed"]]), { p: `The educator's summary: ${p.summary}` },
      { p: "The recording is kept for 30 days. To ask about it, or to report anything, use the report button or reply in Messages." }, { cta: { label: "See progress and messages", href: "/app" } }],
  }) },
  refund_update: { category: "transactional", render: (p) => ({
    subject: `Refund ${p.status}: ${p.amount}`, heading: `Refund ${p.status}`,
    blocks: [rows([["Amount", p.amount], ["Status", p.status], ["Note", p.note]]), { cta: { label: "See your orders", href: "/app/orders" } }],
  }) },
  message_notice: { category: "updates", render: (p) => ({
    subject: `New message from ${p.from}`, heading: "You have a new message",
    blocks: [{ p: `${p.from} sent you a message on Robokalam. For safety, messages stay on the platform, so we don't copy them into email.` }, { cta: { label: "Read it", href: p.link } }],
  }) },
  safety_ack: { category: "transactional", render: (p) => ({
    subject: "We received your report", heading: "Thank you for telling us",
    blocks: [{ p: `A Safeguarding Lead will respond by ${p.respondBy}. If a child is in immediate danger, call 112.` }, { note: "We keep reports confidential and act on every one." }],
  }) },
  safeguarding_alert: { category: "staff", render: (p) => ({
    subject: `Safety report: respond by ${p.respondBy}`, heading: "New safety report",
    blocks: [rows([["Category", p.category], ["Raised from", p.page], ["Respond by", p.respondBy]]), { cta: { label: "Open the safeguarding queue", href: "/app/safeguarding" } }, { note: "Details are only in the queue, never in email." }],
  }) },
  data_request: { category: "transactional", render: (p) => ({
    subject: `Your ${p.kind} request`, heading: `We received your ${p.kind} request`,
    blocks: [{ p: p.kind === "deletion" ? "We'll delete the data as described in the notice and email you when it's done. Some records (like invoices) are kept as the law requires." : "Your data export is ready in the Consent centre." }, { cta: { label: "Open the Consent centre", href: "/app/consent" } }],
  }) },

  fellow_application: { category: "transactional", render: (p) => ({
    subject: "Kalamites: application received", heading: `Thanks, ${p.name}`,
    blocks: [{ p: p.status === "waitlisted" ? `We've added you to the waitlist for ${p.city}. We'll email you when your city opens. Nothing to do now.` : "Your application is in. Next: the subject test, a short recorded demo, safety checks and paid Kalam Academy training." }, { cta: { label: "Open the Kalamite app", href: "/app/fellow" } }, { note: "No fees, ever." }],
  }) },
  fellow_step: { category: "transactional", render: (p) => ({
    subject: `${p.step}: ${p.outcome === "passed" ? "passed" : "needs attention"}`, heading: p.outcome === "passed" ? `${p.step}: done` : `${p.step}: needs attention`,
    blocks: [{ p: p.outcome === "passed" ? "Nice work. Your next step is waiting in the app." : "A reviewer has asked for another look. The note explains why." }, rows([["Note", p.note]]), { cta: { label: "Open the Kalamite app", href: "/app/fellow" } }],
  }) },
  fellow_live: { category: "transactional", render: (p) => ({
    subject: "You're live as a Kalamite", heading: `You're live, ${p.name}`,
    blocks: [{ p: "Every check is done. Open gigs that match you are on the gig board, with pay and deductions shown before you accept. Declining is always free." }, { cta: { label: "Open the gig board", href: "/app/fellow/gigs" } }],
  }) },
  gig_confirmed: { category: "transactional", render: (p) => ({
    subject: `Confirmed: ${p.title}`, heading: "Gig confirmed",
    blocks: [rows([["Gig", p.title], ["When", p.when], ["Where", p.where], ["Pay", p.pay]]), { cta: { label: "Teach mode", href: p.link } }],
  }) },
  gig_reminder: { category: "updates", render: (p) => ({
    subject: `Tomorrow: ${p.title}`, heading: "Your session is tomorrow",
    blocks: [rows([["Gig", p.title], ["When", p.when], ["Where", p.where]]), { p: p.oneToOne ? "This is a one-to-one session. The parent gets a notice and may join at any time. Write a short summary when you record it." : "Lesson plan and kit list are in Teach mode." }, { cta: { label: "Teach mode", href: p.link } }],
  }) },
  session_paid: { category: "updates", render: (p) => ({
    subject: `Earned: ${p.net}`, heading: "Session recorded",
    blocks: [rows([["Session", p.title], ["Gross", p.gross], ["Deductions", p.deductions], ["Net", p.net]]), { cta: { label: "Earnings and statement", href: "/app/fellow/earnings" } }],
  }) },
  payout_paid: { category: "transactional", render: (p) => ({
    subject: `Payout sent: ${p.amount}`, heading: "Your payout is on its way",
    blocks: [rows([["Amount", p.amount], ["Bank reference", p.ref]]), { cta: { label: "Download your statement", href: "/app/fellow/earnings" } }],
  }) },
  terms_notice: { category: "transactional", render: (p) => ({
    subject: `Your Kalamite terms change on ${p.effective}`, heading: "Your Kalamite terms and code of conduct are changing",
    blocks: [{ p: `New Kalamite terms take effect on ${p.effective}, at least 14 days from today. ${p.summary}` }, { cta: { label: "Read the new terms", href: "/kalamite-terms" } }, { note: "Questions or concerns? Raise them with your point of contact or the dispute committee." }],
  }) },
  case_notice: { category: "transactional", render: (p) => ({
    subject: "Important: a case about your Kalamite account", heading: "A case has been opened",
    blocks: [{ p: p.childSafety ? "Your access is paused while the Safeguarding Lead looks into a child-safety concern. You'll get written reasons and a chance to respond." : `You have until ${p.noticeUntil} to respond. Nothing changes before then. The written reasons are in the app.` }, { cta: { label: "Read and respond", href: "/app/fellow/support" } }],
  }) },
  course_review: { category: "transactional", render: (p) => ({
    subject: `Your course "${p.title}": ${p.decision}`, heading: `Course review: ${p.decision}`,
    blocks: [rows([["Course", p.title], ["Reviewer's note", p.note]]), { cta: { label: "Open your course", href: "/app/fellow/courses" } }],
  }) },
  ambassador_decision: { category: "transactional", render: (p) => ({
    subject: `Campus Ambassador: ${p.status}`, heading: `Campus Ambassador: ${p.status}`,
    blocks: [rows([["Note", p.note]]), { cta: { label: "Open the ambassador page", href: "/app/fellow/ambassador" } }],
  }) },
  flag_decision: { category: "transactional", render: (p) => ({
    subject: "A quality note about your teaching", heading: "A person reviewed a quality signal",
    blocks: [rows([["Signal", p.message], ["Decision", p.status === "dismissed" ? "Cleared" : "Discussed"], ["Note", p.note]]), { p: "Signals never change your tier or pay on their own. You can dispute any decision." }, { cta: { label: "See it in Growth", href: "/app/fellow/growth" } }],
  }) },

  school_welcome: { category: "transactional", render: (p) => ({
    subject: `Welcome to the ${p.school} portal`, heading: `Welcome, ${p.name}`,
    blocks: [{ p: `You've been added as ${p.role} for ${p.school}. Sign in with your mobile number and a one-time code.` }, { cta: { label: "Sign in", href: "/login/school" } }],
  }) },
  ticket_update: { category: "transactional", render: (p) => ({
    subject: `${p.ref}: ${p.status}`, heading: `Hardware ticket ${p.ref}`,
    blocks: [rows([["Problem", p.summary], ["Status", p.status], ["Due", p.due], ["Clock", p.clock], ["Note", p.note]]), { cta: { label: "Open tickets", href: "/app/school/tickets" } }],
  }) },
  fellow_request_update: { category: "transactional", render: (p) => ({
    subject: `Kalamite session ${p.when}: ${p.status}`, heading: `Kalamite session: ${p.status}`,
    blocks: [rows([["When", p.when], ["Status", p.status], ["Kalamite", p.fellow], ["Note", p.note]]), { cta: { label: "Open Kalamites", href: "/app/school/fellows" } }],
  }) },
  staff_course_submitted: { category: "staff", render: (p) => ({
    subject: `Course to review: ${p.title}`, heading: "A Kalamite submitted a course",
    blocks: [rows([["Course", p.title], ["Kalamite", p.fellow], ["Points raised", p.flags]]), { cta: { label: "Open course reviews", href: "/app/ops/courses" } }],
  }) },
  staff_ambassador_applied: { category: "staff", render: (p) => ({
    subject: `Ambassador application: ${p.fellow}`, heading: "New Campus Ambassador application",
    blocks: [rows([["Kalamite", p.fellow], ["College", p.college]]), { cta: { label: "Review", href: "/app/ops/ambassadors" } }],
  }) },
} satisfies Record<string, Def>;

export type TemplateId = keyof typeof TEMPLATES;

export function render(id: TemplateId, payload: P, opts: { unsubscribe?: string } = {}): Rendered {
  const def = TEMPLATES[id] as Def;
  const r = def.render(payload);
  const blocks = opts.unsubscribe && def.category === "updates"
    ? [...r.blocks, { note: `Don't want reminders and summaries by email? Turn them off: ${opts.unsubscribe}` } as Block]
    : r.blocks;
  return layout({ subject: r.subject, preheader: r.preheader, heading: r.heading, blocks, footer: FOOTER[def.category] });
}

export const categoryOf = (id: TemplateId) => (TEMPLATES[id] as Def).category;
