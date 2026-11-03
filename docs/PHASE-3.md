# Robokalam rebuild: Phase 3 review (Kalam Fellows pilot)

Status: built and tested. Stopped for review. Not merged.

## What Phase 3 adds

| Brief item | What's built | Where |
|---|---|---|
| Apply | Phone OTP, then profile: college, course, year, worlds, languages, hours, city, 18+ confirmation. Pilot city goes to vetting; other cities join the waitlist. No college logos. | `/fellows/apply` |
| The 9-step journey | Subject test (5 questions per world, pass 4/5, two attempts then human review) → recorded demo (private link, human-reviewed, paid) → identity, background and references (via a licensed vendor; we store only the outcome and the vendor reference, never documents) → Kalam Academy (5 modules; child safety and POCSO need every answer right; each module is paid training) → terms and code of conduct (accepted against a hashed version) → shadow → co-teach → go live (ops, only when all 9 pass and the pilot cap allows). | `/app/fellow`, `src/lib/fellows/core.ts` |
| Fellow app home | Today's sessions, earnings this week, next payout, weekly cap, Exam Mode, point of contact. | `/app/fellow` |
| Gig board | Pay, duration, subject and every deduction shown before accepting. Accept or decline freely; declining is recorded only to hide the gig and is never used anywhere else. Weekly hours cap and clash checks. Each gig shows "why you see this". | `/app/fellow/gigs` |
| Teach mode | Lesson plan, kit list, one-tap help (safety goes straight to the Safeguarding queue), attendance, builds and one line of feedback per learner. | `/app/fellow/gigs/[id]` |
| Earnings and payouts | Per-session lines with deductions, CSV statement, weekly payout run by ops, bank reference recorded, double-entry ledger (escrow release on delivery; Fellow pay as an expense owed; payout clears it). | `/app/fellow/earnings`, `/app/ops/payouts` |
| Exam Mode and cap | Exam Mode pauses the board. Term-time cap defaults to 15 hours (`weekly_cap_hours`). | Fellow home |
| Tiers | Apprentice → Fellow → Senior → Lead. Published formula: reliability, builds per session, verified rating. A person confirms every change; tiers are never lowered automatically. | `/app/fellow/growth`, `/app/ops/fellows` |
| Growth | Verified teaching hours, proof-of-teaching letter (verifiable once Validate is connected). | `/app/fellow/growth` |
| Learner marketplace | Educator shown on course times and in the family home; public Fellow profile with verified badges, college, worlds, hours and verified reviews; parents message the educator; verified reviews only from parents whose child attended. | `/educators/[id]`, `/app/messages` |
| Quality | Rubric (prep, clarity, engagement, safety, outcome, 1–4) for observations and recording samples. A person decides any action. | `/app/ops/gigs` |
| Disputes and removal | Disputes go to a committee queue. Removal needs written reasons, the Fellow's response and 7 days' notice. Only the Safeguarding Lead can open a child-safety case, which suspends access at once (sessions revoked, upcoming gigs released). | `/app/fellow/support`, `/app/ops/cases`, `/app/safeguarding` |
| Gig-worker compliance | CSV register for portal registration, welfare-fee reporting and annual returns. | `/api/ops/compliance` |
| Plain terms in 3 languages | Fellow terms and code of conduct in English, Telugu and Hindi, published in full. | `/fellow-terms`, `/app/fellow/terms` |

## Rules enforced in the database, not just the app

> Since moving to Hostinger MySQL: the CHECK-constraint rules below still live in the database; function- and RLS-based rules are now app-level (same tests); triggers are installed where the host allows. See `docs/DATABASE.md`.

- **Before any contact with a child**, a Fellow must pass every check except shadow and co-teach (app rule, tested).
- **Fellows can't touch the learners table.** They get first name, age band and built-project count, only for their own accepted classes, through one checked function (`fellow_roster`).
- **A Fellow can't change their own status, tier, cap or identity fields.** A trigger rejects it; only Exam Mode and availability are theirs to edit.
- **14 days' notice:** a new terms version can't take effect sooner (CHECK constraint).
- **7 days' notice before removal** unless it's a child-safety case, and no removal without enquiry notes (CHECK constraints).
- **Contact details in messages** (phone numbers, emails, links, social handles) are blocked by a trigger as well as by the app, never delivered, and flagged to Safeguarding. Blocking can only be switched on, never off.
- **In-person gigs** require a partner location and a named responsible adult (CHECK constraint).
- **Pay comes only from the rate card.** No usable rate, no gig.
- **Reviews** need an attended booking in a class that Fellow delivered (checked function used by the RLS policy).

## Matching and bias

The gig board shows open gigs matching the Fellow's tier, a language they teach in, and their city (in-person only). It orders them by the Fellow's worlds first, then earliest start. We collect no religion, caste, gender, place of birth or disability data, so matching can't use it; a test asserts the matching function's inputs. Declines and Exam Mode are never inputs. The formula is shown to Fellows in the app.

## Tests

133 automated tests pass, twice in a row. Phase 3 adds:
- **Logic:** matching order and inputs, tier formula, quiz grading, contact-detail detection, statement CSV.
- **End to end, mobile and desktop:**
  - apply and waitlist
  - subject test and Academy, including safety modules needing every answer right, and paid training
  - terms in Telugu
  - shadow gigs locked until the pre-contact checks pass
  - decline without penalty, weekly cap and Exam Mode
  - Teach mode with a minimal roster, builds, pay, escrow release and a verified review
  - blocked contact details in messages
  - payout run with a balanced ledger and the statement
  - fair removal: 7 days' notice, ops can't open a child-safety case, Safeguarding suspends at once
  - a Fellow can't edit their own status or read learners directly
- **Accessibility:** axe WCAG 2.2 AA on every Fellow and ops screen, light and dark.

Also fixed along the way:
- **Deletion confirmation (Phase 2):** it could vanish on refresh, which made the Phase 2 test intermittent. It now shows at page level.
- **Message box:** text typed before a slow phone finished loading was lost. It's now kept.

## Decisions I made (labelled)

1. **Pilot defaults:** Hyderabad, 25 live Fellows (`PILOT_CITY`, `PILOT_MAX_LIVE`).
2. **Academy and subject tests are drafts** written for this build. The curriculum team should replace them, and legal should review the POCSO module.
3. **Sample rate card** (₹600 a live session, etc.) exists only in review databases and is labelled "Sample rate". Production can't post gigs until you approve real rates.
4. **Deductions:** none until approved (for example TDS). Every approved deduction is shown before acceptance.
5. **Tier thresholds** (10, 40 and 100 sessions, etc.) are drafts for ops to approve.
6. **Withdrawing from a gig** is self-serve up to 24 hours before start; after that it goes through the help button so a cover can be found. No automatic penalty either way.
7. **Payouts:** ops records the bank transfer reference until a payouts provider (RazorpayX or similar) is connected.
8. **Identity and background checks:** the vendor integration is manual for now. Ops records the outcome and the vendor reference.

## Open questions

**Blocking the pilot**
1. **Fellow rate card and deductions** (TDS treatment), approved and dated.
2. **Background-check and KYC vendor** (DigiLocker-based where possible).
3. **Payouts provider** for weekly bank transfers.
4. **Counsel review:** Fellow terms and code of conduct (Code on Social Security; Telangana Platform Based Gig Workers Act), and the POCSO module.
5. **Named people:** the Safeguarding Lead, dispute committee members, and points of contact (English, Telugu, Hindi).
6. **Video service** for recorded live classes (recording and host controls). Classes are marked "recorded" in the UI; the integration is the next step.

**Known gaps**
- The Fellow app UI is English only. Terms are in all three languages.
- Proof-of-teaching letters become verifiable when `/validate` is connected.
- Fellow-authored courses are Phase 5, as the brief says.
