# Spec: parent-supervised one-to-one classes, and email at every step

This is the build prompt for this change. It is written first, then built, tested and reviewed.

## 1. Context and the change requested

Until now, the site followed the launch rule in the brief: no private one-to-one (1:1) sessions with anyone under 18. Robokalam now wants to teach under-18s one-to-one too, **online only**, with the parent informed, consenting and able to oversee every class. Parents should see this clearly on the website in a friendly way, with the legal detail one tap away.

Robokalam also wants **email automation**: everyone who shows interest or takes an action gets a clear email, and every later step sends an update.

## 2. Goals
1. Allow one-to-one classes for under-18s only inside a "parent in the loop" process that is safer than a group class, not looser.
2. Make the parent's consent specific, informed, recorded and easy to withdraw (DPDP Act and Rules).
3. Explain it on the website in plain words, with the full terms expandable on the same page.
4. Send an email at every meaningful step, for parents, Fellows, school staff and the Robokalam team. The emails must be reliable (queued and retried), honest, accessible and never sent to children.

## 3. One-to-one classes: the rules
| Rule | How it's enforced |
|---|---|
| Online only, on Robokalam, recorded and kept 30 days. No home visits, no other apps, no off-platform contact (unchanged). | Course format `one_to_one` is online-only (DB check); in-person stays group-only. Messages still block contact details. |
| The parent gives **specific consent** for one-to-one classes for that child, separate from group classes. | New optional consent purpose `one_to_one` in a new version of the itemised notice (en, te, hi). Booking is refused without it. |
| The parent has a **verified email**, so every notice reaches them. | Booking is refused without a verified email on the parent account. |
| Before each booking, the parent confirms they understand how oversight works. | A checklist on the booking screen, stored with the booking (time and text hash). |
| **Before every session** (24 hours ahead) the parent gets the time, the educator's profile and how to join or watch. | Automatic email. Can't be switched off while one-to-one consent is on. |
| **After every session** the parent gets the educator's written summary, and the recording is kept 30 days. | The educator can't mark a 1:1 session delivered without a summary. Automatic email. |
| The parent can **join any session** from their account, without notice. | A "join as parent" link on the class page. Live join works once the video service is connected (an open item since Phase 3). |
| The parent can **stop at any time**. | Withdrawing one-to-one consent blocks further 1:1 sessions at once: Teach mode refuses to start them, and ops sees them for refund. |
| Only experienced, vetted educators teach 1:1. | Tier Fellow or above, the new Fellow terms (with the 1:1 rules) accepted, and no open serious flags or cases. |
| Fair work: the Fellow terms change, so Fellows get **14 days' notice**. | New Fellow terms version, effective 14 days after publication. 1:1 gigs need it accepted. |
| Safeguarding watches 1:1 more closely. | 1:1 sessions are listed for the Safeguarding Lead and prioritised for recording samples. |

**Website:** a friendly page, "One-to-one classes, with you in the loop", with:
- a short promise and a five-step timeline
- what you see before and after each class
- how to join or stop
- the full terms in an expandable section

Every "no 1:1" line elsewhere is updated: the home page, FAQ, Fellows FAQ, Academy, Fellow terms and the course rules.

## 4. Email automation
**Infrastructure**
- An outbox table. An email is written in the same database transaction as the action, so it is never lost and never sent for an action that failed.
- A sender drains the queue every 30 seconds with retries and backoff, plus a cron URL for Hostinger.
- Transport: SMTP (Hostinger mail), a test transport, or "not configured" (emails wait in the queue).

**Rules**
- **Adults only.** No email ever goes to a child.
- Parents, Fellows and staff add an email address and verify it by link. Interest forms send one acknowledgement to the address typed in.
- Transactional emails always go: receipts, consent records, safety, and every 1:1 oversight email.
- "Updates" (reminders and summaries) can be switched off with one click, except 1:1 oversight.
- No marketing emails, no tracking pixels, plain-text alternative, accessible HTML, brand colours.

**Events**
- **Interest:** learner, school and Fellow forms, each with an acknowledgement and an alert to the team.
- **Parents:**
  - verify email
  - consent receipt, and withdrawal receipt
  - booking confirmed, with the mini mission for the Free Build Session
  - payment receipt and invoice number
  - reminder 24 hours before a class
  - session summary afterwards
  - 1:1: before and after every session
  - refund requested, decided and paid
  - new message from the educator (no content in the email)
  - safety report received
  - data export or deletion request received
- **Fellows:**
  - application received
  - each check passed or needing attention
  - live
  - gig confirmed
  - reminder 24 hours before
  - session recorded and earnings
  - payout paid
  - new terms notice (14 days)
  - removal case notice
  - course review decision
  - ambassador decision
  - quality flag decision
- **School staff:**
  - welcome when added
  - ticket raised and updated
  - Fellow request scheduled, declined or confirmed
- **The Robokalam team:**
  - new leads
  - new safety reports, to the Safeguarding Lead (no child details in the email)
  - new course submissions
  - ambassador applications
  - an email health page

## 5. Out of scope (open items)
- The live video service (join, record, host controls).
- WhatsApp messages.
- Telugu and Hindi email text (the emails are English for now; the notice and terms changes are drafted in all three languages for native review).
- Counsel review of the 1:1 terms.

## 6. Done when
- Every rule in section 3 is enforced in code (and in the database where possible), with tests.
- Every event in section 4 enqueues its email, and a test checks the main ones end to end.
- The full suite passes, including accessibility checks in light and dark, and the docs list decisions and open questions.
