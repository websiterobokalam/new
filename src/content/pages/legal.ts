import type { ContentPage } from "./types";
import { CONTACT, COMPANY, EXTERNAL, PEOPLE, LEGAL_APPROVED } from "../company";
import { refundPolicy } from "@/lib/learn/refunds";

/**
 * Legal pages, carried over from old.robokalam.com (privacy_policy.html and
 * TERMS_CONDITIONS.html) and brought in line with what this site does and with
 * India's DPDP Act, 2023. Where the old text described things this site does not
 * do (advertising cookies, the RKuiz social network, users from age 7 without a
 * parent) it has been replaced, not copied. Counsel must review before launch.
 */

const status = LEGAL_APPROVED ? "Approved by Robokalam Technologies Private Limited." : "Draft carried over from our previous policy and updated for India's DPDP Act. Pending legal review.";
const UPDATED = "4 November 2026";

export const privacy: ContentPage = {
  eyebrow: "Trust",
  title: "Privacy notice",
  lede: "What we collect, why we collect it, how long we keep it, who we share it with, and the rights you have. Written to be read, not skimmed past.",
  description: "Robokalam's privacy notice: the data we collect from parents, learners, schools and Kalamites, why, for how long, and your rights under India's DPDP Act.",
  legal: { updated: UPDATED, status },
  blocks: [
    {
      kind: "prose", id: "about", heading: "About this notice",
      paras: [
        "This notice explains how Robokalam (\"we\", \"us\") collects, uses and protects personal data when you use robokalam.com, the Robokalam app, and our learner, parent, school and Kalamite accounts (together, the \"Services\").",
        "Robokalam decides why and how your personal data is used, so under India's Digital Personal Data Protection Act, 2023 (\"DPDP Act\") we are the Data Fiduciary. Our own sites, such as the learning portal, shop and certificate validation, follow this notice. Third-party sites we link to have their own policies.",
        "We will tell you before any material change to this notice takes effect, by email to account holders and by a notice on this page. Using the Services after that date means the updated notice applies.",
      ],
    },
    {
      kind: "prose", id: "collect", heading: "What we collect",
      paras: ["We collect only what each Service needs. What we hold depends on who you are:"],
      bullets: [
        "Parents and guardians: your name, mobile number (verified by OTP), email address (confirmed by a link), language and region, consent records, bookings, orders and invoices, refund requests, messages with your child's educators and any reports you make.",
        "Learners: first name, age band, interests you choose, class attendance, projects and progress, and class recordings. We do not ask children for a phone number, email, photo or address.",
        "Schools: the names, roles and work contact details of staff, school details for proposals and invoices, lab and timetable information, and support tickets.",
        "Kalamites and applicants: name, phone, email, college and course, the subjects and hours you offer, identity and background-check results, references, your recorded demo, training records, gig history, ratings, and the bank details we need to pay you.",
        "Everyone who visits: log files. Like most websites we record IP address, browser type, internet provider, date and time, and the pages you came from and visit. We use them to keep the site secure and working, and we do not use them to build a profile of you.",
      ],
      after: ["We do not collect or store card numbers. Payments are handled by our payment provider, which sends us only the payment status and a reference."],
    },
    {
      kind: "prose", id: "why", heading: "Why we use it",
      bullets: [
        "To run the Services you ask for: accounts, sign-in, bookings, classes, recordings, lab programmes, gigs, payouts, invoices and refunds.",
        "To keep children safe: vetting Kalamites, recording classes, blocking contact details in messages, and handling safety reports.",
        "To talk to you about your account: confirmations, reminders, notices before and summaries after one-to-one sessions, and replies to your questions. You cannot opt out of these while you have an account, because the Service depends on them.",
        "To send news and offers, only to adults who opted in. You can unsubscribe from any marketing email in one click.",
        "To detect and prevent errors, fraud and misuse, and to meet our legal duties (for example tax records and lawful requests).",
        "To improve the Services, using aggregated or de-identified data wherever we can.",
      ],
    },
    {
      kind: "prose", id: "children", heading: "Children's data",
      paras: [
        "Anyone under 18 is a child under the DPDP Act. A child's account is always created and controlled by a parent or guardian, and we ask for that parent's verifiable consent, for each purpose, before we process the child's data.",
        "One-to-one classes need a separate, specific consent and a confirmed parent email. You can withdraw any consent at any time from your account.",
        "We do not track children, monitor their behaviour, or show them targeted advertising. Portfolios are private by default and become public only if a parent chooses.",
      ],
    },
    {
      kind: "prose", id: "cookies", heading: "Cookies and similar technologies",
      paras: [
        "We use only the cookies the site needs to work:",
      ],
      bullets: [
        "rk_sess keeps you signed in. It is secure and cannot be read by scripts.",
        "rk_in tells the site you are signed in, so it can show the right menu.",
        "rk_lang remembers the language you picked.",
        "Your light or dark theme choice is kept in your browser's local storage and never sent to us.",
      ],
      after: [
        "We do not use advertising, remarketing or cross-site tracking cookies, and we do not let third parties place them through our site. Our previous policy described Google advertising and remarketing cookies; this site does not use them.",
      ],
    },
    {
      kind: "prose", id: "sharing", heading: "Who we share it with",
      paras: ["We do not sell, rent or trade personal data. We share it only as follows:"],
      bullets: [
        "Service providers who work for us: hosting, email and SMS delivery, payments, background checks, video and recording, and support tools. They are bound by contract to keep data confidential and secure and to use it only for the work we give them.",
        "Your school, if you learn or teach through a school programme, limited to what that programme needs.",
        "Parents see their own child's classes, recordings, reports and educator profiles. Schools see their own lab programme.",
        "Other people you direct us to share with.",
        "In a merger, acquisition, sale of assets, or insolvency, with the new owner, who must honour this notice.",
        "To protect the safety of any person, to address fraud, security or technical issues, or to protect our rights or property, including reporting child-safety concerns as the law requires.",
      ],
      after: [
        "Legal requests. If a court, law enforcement agency, regulator or other authority asks us for data, we first try to direct them to you. If we are legally compelled to hand data over, we will tell you, unless the law forbids it.",
        "Aggregated or de-identified data that does not identify you may be shared to analyse trends and improve our products.",
      ],
    },
    {
      kind: "prose", id: "security", heading: "How we protect it",
      paras: [
        "We use reasonable physical, technical and managerial safeguards, in line with the Information Technology Act, 2000 and the rules under it, to protect data against loss, theft, misuse and unauthorised access or change. These include encrypted connections, access limited by role, audit logs of who saw or changed what, and automated checks for abusive content.",
        "No system is perfectly secure. If a breach affects your personal data, we will tell you and the Data Protection Board of India as the DPDP Act requires.",
      ],
    },
    {
      kind: "prose", id: "retention", heading: "How long we keep it",
      paras: [
        "We keep personal data only as long as the purpose needs it, or as long as the law requires. Tax invoices and payment records are kept for the period tax law sets. Safety reports and the records around them are kept as long as the law and our safeguarding duties require.",
        "When you delete a learner or close your account, we hide the data at once, withdraw the consents, and erase it within 10 days, except records the law makes us keep. Backup copies are overwritten in the normal backup cycle.",
      ],
    },
    {
      kind: "prose", id: "rights", heading: "Your rights",
      paras: ["Under the DPDP Act you have the right to:"],
      bullets: [
        "Get a summary of the personal data we hold about you and how we use it. Parents can download it all from their account at any time.",
        "Correct, complete or update your data.",
        "Erase your data, or your child's data. Parents can do this from their account.",
        "Withdraw consent at any time, as easily as you gave it. Withdrawal does not affect what was done before.",
        "Nominate someone to exercise your rights if you die or become unable to.",
        "Have a grievance addressed by us, and if you are not satisfied, complain to the Data Protection Board of India.",
        "Stop marketing messages, and be removed from any marketing list.",
      ],
      after: [`To use any right, use the controls in your account or write to ${CONTACT.email} with the subject \"Privacy\". We may need to confirm your identity first. We will reply within a reasonable time and tell you what we did.`],
    },
    {
      kind: "prose", id: "links", heading: "Links to other websites",
      paras: [
        "Our pages link to other websites, including our own learning portal and shop, social networks, and partners. Once you leave this site, we have no control over the other website, and this notice does not cover what you share there. Read the privacy notice of each site you visit.",
      ],
    },
    {
      kind: "prose", id: "unsubscribe", heading: "Unsubscribing",
      paras: [
        `You can unsubscribe from marketing emails using the link at the bottom of any of them, or by writing to ${CONTACT.email} with the subject \"Privacy\". You will still get emails about your account, bookings and child-safety notices while you have an account.`,
      ],
    },
    {
      kind: "prose", id: "grievance", heading: "Questions and grievances",
      paras: [
        PEOPLE.grievanceOfficer.named
          ? `For any question, complaint or grievance about how we use personal data, contact our Grievance Officer, ${PEOPLE.grievanceOfficer.name}, at ${PEOPLE.grievanceOfficer.email}.`
          : `For any question, complaint or grievance about how we use personal data, contact the Grievance Officer of ${COMPANY} at ${PEOPLE.grievanceOfficer.email}, with the subject "Grievance".`,
      ],
    },
  ],
};

export const terms: ContentPage = {
  eyebrow: "Trust",
  title: "Terms and conditions",
  lede: "The rules for using robokalam.com and Robokalam's Services. Together with our privacy notice, they govern our relationship with you.",
  description: "Terms and conditions for robokalam.com: using the site, buying products and courses, projects you upload, acceptable use, and governing law.",
  legal: { updated: UPDATED, status },
  blocks: [
    {
      kind: "prose", id: "welcome", heading: "Welcome",
      paras: [
        "Welcome to Robokalam. If you browse or use this website, you agree to these terms and conditions. Together with our privacy notice, they govern Robokalam's relationship with you in relation to this website and our Services.",
        "If you are under 18, a parent or guardian must accept these terms for you and supervise your use of the Services.",
      ],
    },
    {
      kind: "prose", id: "definitions", heading: "Definitions",
      bullets: [
        "\"Robokalam\", \"we\" and \"us\" mean the owner of this website. \"You\" means any user or visitor.",
        "\"Products\" means the robotics kits, parts and licences we sell.",
        "\"Services\" means the Products, our courses, classes and lab programmes, and the online platforms we host, including the space where learners post photos and videos of their projects.",
        "\"Project Uploads\" means photos, videos and other media of projects that users post to our platforms.",
      ],
    },
    {
      kind: "prose", id: "products", heading: "Products",
      paras: [
        `Products are sold for personal and educational use. Commercial use needs our written consent. Write to ${CONTACT.email} to ask.`,
        "Kits contain small parts and batteries. Children should use them with adult supervision, following the instructions in the box.",
      ],
    },
    {
      kind: "prose", id: "use", heading: "Using this website",
      bullets: [
        "The content of this website is for general information and may change without notice.",
        "We work to keep information accurate, but neither we nor any third party guarantees the accuracy, timeliness, performance, completeness or suitability of the information and materials on this website for any particular purpose. To the fullest extent the law allows, we exclude liability for inaccuracies or errors.",
        "It is your responsibility to make sure that any product, service or information on this website meets your requirements.",
        "This website contains material owned by or licensed to us, including its design, layout, look and graphics. You may not copy it except as our copyright notice allows. Trademarks that are not ours are acknowledged where they appear.",
        "Unauthorised use of this website may give rise to a claim for damages and may be a criminal offence.",
        "We link to other websites for your convenience. A link does not mean we endorse that website, and we are not responsible for its content.",
        "You may link to this website from another website or document, provided the link is not used in any way the acceptable use rules below prohibit.",
      ],
    },
    {
      kind: "prose", id: "classes", heading: "Courses, classes and payments",
      bullets: [
        "The full fee for a course or programme is shown before you pay. We do not offer loans, financing or multi-year lock-ins.",
        "Refunds follow our published refund policy, and you can request one from your account.",
        "Classes are taught by Robokalam trainers and Kalamites, who must follow our code of conduct for teaching children. One-to-one classes have their own rules, which a parent accepts for each booking.",
      ],
    },
    {
      kind: "prose", id: "projects", heading: "Projects and uploads",
      paras: [
        "What a learner makes belongs to the learner. Projects, code and designs created in our classes, and Project Uploads, remain the property of the learner (or, for a child, held by the parent on the child's behalf). Robokalam keeps the rights to its own curriculum, kits, software and materials.",
        "A learner's portfolio is private by default. A parent can mark Project Uploads public. Public uploads can be shared by other users; private ones cannot.",
        "We feature a learner's project, name, photo or video in our promotion only with the parent's specific, written consent for that use, which they can withdraw at any time.",
      ],
    },
    {
      kind: "prose", id: "conduct", heading: "Acceptable use",
      paras: [
        "If you post inappropriate content on our platforms, in a Project Upload, or on Robokalam's official social media pages, we may remove it, block your account, and take appropriate legal action. You must not use the Services to post, share or do anything that:",
      ],
      bullets: [
        "abuses, harasses, threatens, defames, demeans or otherwise violates the legal rights of others;",
        "belongs to another person and which you have no right to share;",
        "is harmful, harassing, blasphemous, defamatory, obscene, pornographic, paedophilic, libellous, invasive of another's privacy, hateful, racially or ethnically objectionable, or relates to or encourages money laundering or gambling, or is otherwise unlawful;",
        "harms minors in any way;",
        "violates any law for the time being in force;",
        "deceives or misleads anyone about the origin of a message, or communicates information that is grossly offensive or menacing;",
        "impersonates any person or entity, or misrepresents your affiliation with one;",
        "infringes any patent, trademark, copyright or other proprietary right;",
        "contains viruses, corrupted files or any other code that may damage the website or another person's device;",
        "interferes with or disrupts the website, its servers or networks, or probes, scans or tests their vulnerability, or breaches any security or authentication measure;",
        "traces, or tries to trace, any information about another user or visitor, or collects or stores data about other users;",
        "downloads a file posted by another user that you know, or should know, cannot legally be shared that way;",
        "threatens the unity, integrity, defence, security or sovereignty of India, friendly relations with foreign states, or public order, or incites any cognisable offence;",
        "publishes information that is false, inaccurate or misleading;",
        "offers or trades in any item that the law prohibits or restricts;",
        "breaks these terms, our code of conduct, or any guidelines for a particular Service.",
      ],
    },
    {
      kind: "prose", id: "law", heading: "Governing law and disputes",
      paras: [
        "These terms and your use of this website are governed by the laws of the Republic of India.",
        "Any dispute about your use of the Services that we cannot settle together will be referred to arbitration under the Arbitration and Conciliation Act, 1996. Subject to that, the courts of Hyderabad, Telangana have jurisdiction.",
        "Nothing in these terms takes away any right you have under consumer protection law.",
      ],
    },
    {
      kind: "prose", id: "changes", heading: "Changes to these terms",
      paras: ["We may change these terms. We will post the new version here with its date, and tell account holders by email before a material change takes effect."],
    },
    {
      kind: "prose", id: "contact", heading: "Contact",
      paras: [`Questions about these terms: ${CONTACT.email}.`],
    },
  ],
};

export const refunds: ContentPage = {
  eyebrow: "Trust",
  title: "Refund and cancellation policy",
  lede: "Fees are shown in full before you pay, and you can ask for a refund from your account in a few taps.",
  description: "Robokalam's refund and cancellation policy for courses, classes and kits.",
  legal: { updated: UPDATED, status: refundPolicy.approved() ? "" : "Draft rules. Until this policy is approved, every refund request is reviewed by a person and nothing is decided against you automatically." },
  blocks: [
    {
      kind: "prose", id: "courses", heading: "Courses and classes",
      bullets: [
        `Full refund if you ask at least ${refundPolicy.fullRefundHoursBeforeStart} hours before the first class.`,
        "After classes start, you get back the share of the fee for classes not yet delivered.",
        "If we cancel a class or a batch, you get a full refund for the classes we cancelled, or a place in another batch if you prefer.",
        "A Free Build Session is free. There is nothing to refund and nothing to cancel.",
      ],
    },
    {
      kind: "prose", id: "how", heading: "How to ask for a refund",
      bullets: [
        "Sign in, open Orders, choose the order and tap Request refund. Tell us why in a line.",
        `No account? Write to ${CONTACT.email} with your order number.`,
        "We confirm your request by email, and email you again when it is decided and when the money is sent.",
        "Approved refunds go back to the original payment method. Your bank may take 5 to 7 working days to show it.",
      ],
    },
    {
      kind: "prose", id: "kits", heading: "Kits and products",
      bullets: [
        `Kits bought from ${EXTERNAL.shop.href.replace("https://", "")} follow the returns policy shown there at checkout.`,
        "If a kit arrives damaged or with parts missing, tell us within 7 days of delivery with a photo, and we will replace the part or the kit.",
      ],
    },
    {
      kind: "prose", id: "schools", heading: "Schools",
      paras: ["Lab programmes for schools follow the cancellation terms in the school's signed agreement."],
    },
  ],
};

export const childSafety: ContentPage = {
  eyebrow: "Trust",
  title: "Child safety",
  lede: "Every rule here applies to every class, every educator and every message. Where a child's safety is concerned, we act first and explain after.",
  description: "Robokalam's safeguarding policy: vetted educators, recorded classes, no private contact, parent oversight of one-to-one classes, and how to report a concern.",
  legal: { updated: UPDATED, status: LEGAL_APPROVED ? "" : "Safeguarding policy draft. The named Safeguarding Lead and response times are published before launch." },
  blocks: [
    {
      kind: "prose", id: "educators", heading: "Who teaches",
      bullets: [
        "Robokalam trainers and Kalamites only. Kalamites are 18 or older.",
        "Before any contact with a child, every educator passes a subject test, a recorded demo, identity and background checks, and references, then completes Kalam Academy, including a mandatory child-safety and POCSO course.",
        "Every educator accepts our code of conduct for teaching children, which is published in full.",
      ],
    },
    {
      kind: "prose", id: "classes", heading: "How classes run",
      bullets: [
        "Every online class happens on Robokalam and is recorded.",
        "No home visits, ever. In-person classes happen only at a partner school or centre, with a responsible adult present.",
        "All contact stays on the platform. No personal numbers, social media or private chats. Contact details typed in messages are blocked.",
        "Parents can see their child's educator profile, class schedule and recordings.",
      ],
    },
    {
      kind: "prose", id: "one-to-one", heading: "One-to-one classes",
      bullets: [
        "Only online, only on Robokalam, and always recorded.",
        "Only with the parent's specific consent and a confirmed parent email, acknowledged for each booking.",
        "The parent gets an email before and a written summary after every session, and can join any session.",
      ],
    },
    {
      kind: "prose", id: "data", heading: "Children's data",
      bullets: [
        "Parental consent comes first, for each purpose.",
        "No tracking, behavioural monitoring or targeted advertising directed at children.",
        "Portfolios are private by default. Parents can download or delete their child's data at any time.",
      ],
    },
    {
      kind: "prose", id: "report", heading: "Report a concern",
      paras: [
        `Every learner and parent screen has a Report button. Reports go straight to our Safeguarding Lead${PEOPLE.safeguardingLead.named ? `, ${PEOPLE.safeguardingLead.name}` : ""}${process.env.SAFEGUARDING_RESPONSE_HOURS ? `, who responds within ${process.env.SAFEGUARDING_RESPONSE_HOURS} hours` : ""}.`,
        "Any credible concern means the educator's access is suspended at once while we look into it, and we report to the authorities as the law requires.",
        `You can also write to ${PEOPLE.safeguardingLead.email} with the subject \"Safeguarding\". If a child is in immediate danger, call 112, or the Childline number 1098.`,
      ],
    },
    { kind: "cta", title: "Read the rules Kalamites sign", actions: [{ href: "/kalamites/safety", label: "Rules for teaching children", primary: true }, { href: "/one-to-one", label: "How one-to-one works" }] },
  ],
};
