# Robokalam rebuild: Phase 5 review (Open Marketplace)

Status: built and tested. Stopped for review. Not merged.

The brief says to start Phase 5 "only when fill rate, safety and parent satisfaction meet agreed targets". No targets have been agreed yet, so everything in this phase is built **behind a readiness gate**. Fellows can draft courses and apply as ambassadors now. Nothing goes public, no city opens and no ambassador starts until the targets are met and a person opens the gate.

## What Phase 5 adds

| Brief item | What's built | Where |
|---|---|---|
| Readiness gate | The brief's measures, from live data for the last 60 days against the 60 days before: sessions delivered, gig fill rate, verified parent satisfaction, safety reports per 100 sessions, refund rate, parent complaints per 100 sessions. Each has an **agreed target** set by a named person. The gate opens only when every target is met, nothing is rising, and no safety report is past its response time. Opening and closing need a written reason and are audited. If anything slips later, growth pauses on its own. | `/app/ops/marketplace` |
| Fellow-authored courses | A Fellow who meets a **published bar** (live, tier Fellow or above, 10 delivered sessions, observation average 3/4 or more, verified rating 4.3 or more from 3+ reviews, no open case) drafts a course: online only, groups of 2 to 8 (never one-to-one, also enforced in the database), ages 6 to 18, syllabus with a build per session, and a proposed fee. A reviewer decides each flag, then approves, asks for changes, or rejects, with a note the Fellow reads. Approved courses go public only when the gate is open and the Fellow's share is set. The Fellow schedules weekly sessions on their own calendar, with their weekly cap and Exam Mode respected. Pay is the Fellow's share of the fees each session releases from escrow, with the ledger balanced. | `/app/fellow/courses`, `/app/ops/courses`, `/courses` |
| More cities and colleges | Cities are now data, not one setting. Applications from new cities put them on a waitlist so demand shows. Opening a city needs the gate open, sets its own cap of live Fellows, and moves everyone waitlisted there into checks. Colleges are listed by name only, with no logos and no implied endorsement, and power the college picker on the application. | `/app/ops/marketplace`, `/fellows/apply` |
| Campus Ambassadors | A landing page with the rules up front. Live Fellows with 5+ sessions apply from the app. A person approves them (gate open). Ambassadors get a referral link, see **counts only** (never applicants' names), and propose campus info sessions for approval. They recruit Fellows only, never families or children. Any reward is per referred Fellow who goes live, from an approved rate, and nothing is paid or promised until a rate is approved. | `/campus-ambassadors`, `/app/fellow/ambassador`, `/app/ops/ambassadors` |
| AI quality tools | **Rule checks** on course drafts for the brief's hard rules: investment or trading advice in financial literacy, live propellants in space, contact details, one-to-one or home sessions, guarantees and "No.1"-style claims, implied institute endorsement, and syllabus gaps. **AI review** by Claude, through the official SDK with structured output and the server-side refusal fallback. It reads only the course text, never anything about a child. **Teaching signals** from rules over delivered sessions: low observation scores, a safety score of 1, repeated no-shows, low verified ratings, and blocked attempts to share contact details. | `/app/ops/courses`, `/app/ops/quality` |

## The rules held to, and how
- **A human decides any penalty.** A flag is only a note. Closing one needs a person and a written note, enforced by a database check. Nothing changes a tier, pay, gigs or a course on its own, and a test checks the tier is untouched. Removal still goes through the Phase 3 case process with 7 days' notice.
- **14 days' notice before an automated system.** Each check is published to Fellows, with what it can and can't do, and only runs from its effective date. The database rejects an effective date less than 14 days after the notice. On a new database, the checks start 14 days after the first deploy.
- **Fellows see flags about them** and the decision, on their Growth and course pages, and can dispute them.
- **No child data to AI**, and no behavioural signals about children: teaching signals look only at the Fellow's own record.
- **Small groups only**, online, recorded like every class.

## Also changed
- The application form lists open cities and colleges, and accepts a referral code.
- Going live checks the Fellow's city cap rather than one pilot-wide number. The pilot city starts with `PILOT_MAX_LIVE`.
- Own-course sessions never appear on the gig board.
- New dependency: `@anthropic-ai/sdk` 1.4.0, server-only. It adds no JavaScript to pages.

## Tests
194 tests pass on MariaDB, and the full suite passed twice in a row. Phase 5 adds 32 test runs, counting mobile and desktop separately. The marketplace tests change global state, so they run once, on desktop; their 6 mobile copies are the skipped ones.
- **Logic:**
  - rule checks for each hard rule, plus a clean draft and a money-basics draft that pass
  - target evaluation
  - the database rejects a check with under 14 days' notice
  - the database rejects closing a flag without a person and a note
  - the database rejects a one-to-one course
- **End to end:**
  - the gate stays closed without targets; targets are recorded with who set them; a person opens the gate with a reason
  - a course goes from draft through flags, per-flag decisions, changes asked, resubmission, approval and publication
  - the course is publicly labelled, scheduled on the author's calendar, a family pays, a session is delivered, and the Fellow earns exactly their share with the ledger balanced
  - opening a city moves its waitlist into checks
  - an ambassador is approved, a referral link records a classmate, a reward is paid only once a rate is approved, and the ambassador sees counts but no names
  - teaching signals raise a flag, a person decides, the Fellow sees it, and the tier is unchanged
  - closing the gate refuses growth actions
  - a Fellow without a record can't submit a course
  - the ambassador page states the rules
- **Accessibility:** axe WCAG 2.2 AA on every new screen, in light and dark.

## Decisions I made (labelled)
1. **Build behind the gate rather than wait.** Everything is ready to switch on; nothing public changes until targets are agreed and met.
2. **The measures and the 60-day window**, using only data we already hold (listed above).
3. **A rate counts as "rising" only with 20 or more sessions in both windows**, so tiny samples (0 reports, then 1) don't pause growth on noise.
4. **The author bar** (live, tier Fellow or above, 10 sessions, observations 3/4, rating 4.3 from 3+ reviews). These are drafts for ops to approve, published to Fellows as-is.
5. **Own courses run 60-minute weekly sessions**, booked as one batch. The Fellow's share is snapshotted on each course when published, so later changes to terms don't change live courses.
6. **Ambassadors need 5 delivered sessions.** No reward exists until you approve a rate (`ambassador_referral` in the rate card).
7. **The AI model** defaults to `claude-opus-5-5` at low effort, with the server-side fallback on. It can be changed with `QUALITY_AI_MODEL`.

## Open questions

**Before opening the marketplace**
1. **Agreed targets** for each measure, and who signs them off.
2. **The Fellow's share** of own-course fees (the brief says 70%), in the Fellow terms with 14 days' notice. It's set as `OWN_COURSE_FELLOW_SHARE_PCT`.
3. **Approval of the author bar** and the ambassador bar.
4. **Whether to pay ambassadors at all**, and if so the rate, with counsel's view on the gig-worker rules.
5. **An Anthropic API key** if you want AI review on; it stays off without one.
6. **Next cities and colleges**, and each city's cap.

**Known gaps**
- Fellows schedule own-course sessions weekly only. Other rhythms come later.
- Ambassador materials (slides, flyer) need writing and approval.
- WhatsApp alerts for flags and decisions wait on the WhatsApp Business API.
