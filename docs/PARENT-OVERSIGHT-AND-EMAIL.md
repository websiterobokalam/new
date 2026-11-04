# Review: parent-supervised one-to-one classes, and email at every step

Status: built and tested. Stopped for review. Not merged. The spec this was built from is `docs/SPEC-PARENT-OVERSIGHT-AND-EMAIL.md`.

## One-to-one classes for under-18s, with the parent in the loop

| Rule | How it's enforced |
|---|---|
| Online only, on Robokalam, recorded (kept 30 days). Never home visits. | One-to-one gigs can't be in-person (database check). Courses have a `one_to_one` format with exactly one learner (database check). |
| The parent's **specific consent** for that child. | A new, optional item in the consent notice (version `learner-2026-12`, in English, Telugu and Hindi). Earlier consents stay pinned to the version the parent saw. Booking is refused without it. |
| A **confirmed email**, so every notice reaches the parent. | Turning on one-to-one consent, and booking, are both refused without one. The add-a-child form keeps it off and explains why. |
| A short **checklist before every booking**. | Five points the parent ticks, stored with the booking (time and text fingerprint). The Pay button stays disabled until all are ticked. |
| **Before every session**, an email with the time, the educator's profile and how to join. | Automatic, 24 hours ahead. These "oversight" emails can't be turned off while one-to-one consent is on. |
| **After every session**, the educator's written summary. | Teach mode won't record a one-to-one session without a summary for the parent. It's emailed at once. |
| The parent can **stop at any time**. | Withdrawing one-to-one consent takes effect at once: the next one-to-one session can't be recorded, and the parent gets a withdrawal receipt. |
| **Experienced educators only.** | Tier Fellow or above, the updated code of conduct accepted, and no open serious flag or case. The gig board says which rule applies. |
| **14 days' notice** to Fellows. | A new code of conduct version (all three languages) with the one-to-one rules. It is published now and takes effect 14 days later. Fellows can read it during the notice period and get an email about it. One-to-one gigs need it accepted. |

**On the website:**
- A new page, `/one-to-one`, "One-to-one classes, with you in the loop": a five-step timeline, the checklist, and the full terms in an expandable section. It's linked from the home page, the footer, course cards, course pages and the booking screen.
- Every "no 1:1 with under-18s" line has been updated: the home page, FAQ, Fellows FAQ, Fellow rules, the Kalam Academy safety module, the course checks and the AI review prompt.

## Email at every step

**How it works**
- Every email is written to an outbox in the same database transaction as the action that caused it, so none is lost and none is sent for something that failed.
- The site sends queued email every 30 seconds, retrying 5 times with backoff, and queues reminders every 5 minutes. A Hostinger cron URL is there as a backup.
- Sending uses SMTP (your Hostinger mailbox works). Until it's configured, emails wait safely in the queue.

**Rules**
- Adults only: parents, Fellows, school staff and your team. Never children.
- Account emails go only to a **confirmed** address. The confirmation link itself is the only exception.
- Receipts, consent records, safety replies and terms changes always go.
- Reminders and summaries can be turned off in one click; the link is signed and also sent as a List-Unsubscribe header. One-to-one oversight emails can't be turned off.
- No marketing, no tracking pixels. Accessible HTML plus a plain-text version. Messages and safety report details are never copied into email.

**What's sent**
- **Interest:** acknowledgement to the person (learner, school or Fellow form) and an alert to your team. Leads are now stored in the database, so none is lost if a CRM is down; the CRM webhook is optional.
- **Parents:**
  - email confirmation
  - consent receipt, and withdrawal receipt
  - booking confirmed, with the mini mission for the Free Build Session
  - payment receipt with invoice number
  - reminder 24 hours before a class
  - summary after each class
  - one-to-one notices before and after every session
  - refund requested, decided and paid
  - "you have a new message" (no content), at most one per conversation per hour
  - safety report received
  - deletion request received
- **Fellows:**
  - application received
  - each reviewed step
  - live
  - gig confirmed
  - reminder 24 hours before
  - session recorded with earnings
  - payout sent
  - terms change notice
  - removal case
  - course review decisions
  - ambassador decisions
  - quality flag decisions
- **School staff:**
  - email confirmation when added
  - ticket raised, updated, fixed and closed (with the clock)
  - Fellow request scheduled, declined or confirmed
- **Your team:**
  - new leads
  - safety alerts to the Safeguarding Lead (no details in the email)
  - course submissions
  - ambassador applications

**Screens**
- **Email** in every role's menu: add and confirm an address, and turn reminders on or off.
- A reminder on the family home until an email is confirmed.
- **Ops → Email:** the sending status, recent emails with addresses masked, failures, and "Send again".

## Tests
25 new test runs, counting mobile and desktop separately (the one-to-one journey runs once, on desktop). The full suite passed twice in a row: 218 passed, 7 skipped by design.
- **Logic:**
  - every template renders a subject, accessible HTML and plain text, with no tracking images
  - only reminders and summaries carry an unsubscribe line
  - oversight emails can't be turned off
  - text is escaped
- **End to end:**
  - a lead is stored, acknowledged and alerted to the team
  - an email is confirmed by its real link, and reminders can be turned off
  - a forged unsubscribe link is refused
  - a consent receipt arrives
  - nothing goes to an unconfirmed address
  - school staff get a confirmation link
  - a safety report is acknowledged and alerted, with no details in the email
  - the database refuses an in-person one-to-one
  - the one-to-one journey, in order:
    1. no email, no consent, no booking
    2. the consent needs an email
    3. the checklist is stored with the booking
    4. the educator needs the right tier and the new code of conduct (after 14 days)
    5. the "before" email is sent even with reminders off
    6. no summary, no record
    7. the summary is emailed
    8. withdrawal blocks the next session
  - the explainer page and the home page
- **Accessibility:** axe WCAG 2.2 AA on `/one-to-one` and the Email settings page, in light and dark.

## Decisions I made (labelled)
1. **Who teaches one-to-one:** tier Fellow or above, the new code of conduct, nothing open. This is a higher bar than group classes.
2. **Robokalam runs one-to-one courses.** Fellow-authored courses stay small-group for now.
3. **A confirmed email is required** for one-to-one, because oversight depends on the notices arriving. WhatsApp could be an alternative once it's connected.
4. **"Join as parent"** points to the class page. Live joining needs the video service (an open item since Phase 3).
5. **Email text is English for now.** The consent notice and code of conduct changes are drafted in all three languages.

## Open questions
1. **Counsel review** of the one-to-one terms, the new consent item, the parent checklist and the code of conduct change. Recording one-to-one classes and keeping them 30 days is part of the safety case, so please confirm it.
2. **Native review** of the Telugu and Hindi wording for the new consent item and code of conduct.
3. **Email setup:** which mailbox sends (for example hello@robokalam.com on Hostinger), its SMTP password, and the team inboxes (OPS_EMAIL, SAFEGUARDING_EMAIL, SCHOOLS_EMAIL). Also set SPF and DKIM for the domain in Hostinger so mail isn't marked as spam.
4. **The video service**, so parents can join live from the class page.
5. **One-to-one fees and the educator rate** (a sample rate exists only in review databases).
