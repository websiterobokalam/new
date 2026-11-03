# Robokalam rebuild: Phase 4 review (Schools)

Status: built and tested. Stopped for review. Not merged.

## What Phase 4 adds

| Brief item | What's built | Where |
|---|---|---|
| School login | Phone OTP at the school door. **Staff only:** a number must be on a school's staff list, so nobody can sign themselves up as school staff. Students use the school-issued AADHYA login, not this door. | `/login/school` |
| School admin portal | Lab health (equipment working, open and overdue tickets, last class), class coverage for the last 30 days (held, not recorded, slots with no trainer, attendance %), hardware fixes on time, certificates (from Validate), upcoming Fellow sessions. | `/app/school` |
| Timetable | Weekly classes per lab with grade, world, day, time and trainer. Sessions for the week are created automatically. Times are India time. | `/app/school/timetable` |
| Staff | Add trainers and admins by phone. Removing someone signs them out at once and frees their classes. A parent's or Fellow's number can't be turned into staff. | `/app/school/staff` |
| Hardware tickets with the clock | Anyone on staff raises a ticket (lab, item, problem). The due time is fixed at raise from the school's contract (default 72 hours) and **can't be changed or reset**, even if a fix fails and the ticket is reopened. Ops moves tickets on (seen, replacement on the way, fixed with a note), and the school confirms the fix or reopens it. Every step is in an append-only history. Status is in words, never colour alone. | `/app/school/tickets`, `/app/ops/tickets` |
| Fellow bookings | The admin books a Fellow for a Campus Session: lab, time (48 hours or more ahead), world, language, grades, number of students, and **the staff member who stays in the room**. Ops turns it into a Campus Session gig, with pay from the rate card. Vetted Fellows see it on the gig board. The school sees the Fellow's public profile only, never their contact details. | `/app/school/fellows`, `/app/ops/schools` |
| Trainer portal | My week (today marked), lesson plan from AADHYA, attendance from the 21cschool roster (tick who's here) or counts if not linked, project review sent to AADHYA, kit issues, and Fellow mentoring (score a delivered Fellow session on the quality rubric). | `/app/trainer`, `/app/trainer/sessions/[id]` |
| Audit reports | CSV of every recorded action at the school (staff changes, classes, tickets, requests, reviews) plus each ticket's clock. No phone numbers, no student names. | `/api/school/audit` |
| Ops: schools | Add a partner school and its first admin, labs and equipment, the contract's fix window, and AADHYA and 21cschool IDs. Schedule or decline Fellow requests (declines need a reason the school sees). | `/app/ops/schools` |

## AADHYA, 21cschool and Validate

As the brief says, these are integrated, not rebuilt. Each sits behind one small adapter (`src/lib/integrations`):
- **21cschool:** live class roster; attendance marks sent back to the ERP, which returns a receipt.
- **AADHYA:** the lesson plan for a class and date; student project submissions; the trainer's verdict and note sent back.
- **Validate:** certificate counts for the school.

**Children's data stays where it already is.** Robokalam reads rosters and submissions live and stores only counts (present out of total, number of reviews). Student names never enter our database, and a test checks this.

The HTTP contract in the adapter is **my proposal**: one GET and one POST per job, with a bearer key. If the real APIs differ, only that one file changes. Until the URLs and keys are set, the portal says plainly "not connected yet" and falls back to counts. Review builds use clearly labelled sample data ("(sample)").

## Also fixed along the way
- **Deadlocks under load:** two OTP sends at the same moment could deadlock in MySQL and show "Something went wrong". Transactions now retry up to 3 times on a deadlock.
- **Forms clicked before the page finished loading:** on a slow phone, a click before JavaScript loaded made the browser submit the old way, which put every field (including phone numbers) in the URL. Form buttons now stay disabled until the page is ready.
- The Phase 1 placeholder OTP endpoint ("accounts open in a later phase") is removed.

## Tests
168 automated tests pass on MariaDB, and the full suite passed twice in a row. Phase 4 adds 35 (counting the mobile and desktop runs separately):
- **Logic:**
  - ticket clock (running, overdue, met, missed, in words)
  - India-time to UTC conversion
  - CSV escaping
- **End to end, on mobile and desktop:**
  - staff-only school login, which creates no account
  - admin home showing the contract window
  - admin adds a trainer and a class, then the trainer sees their week
  - attendance from the 21cschool roster with a receipt, counts only kept
  - counts-only attendance, rejecting present greater than total
  - project review sent to AADHYA
  - trainers can't see another school's classes or manage staff
  - ticket lifecycle: the clock never resets, a reopen keeps the due time, the event history is right
  - overdue tickets shown in words
  - Fellow booking end to end: too-soon rejected, ops schedules, a vetted Fellow accepts, the school sees the Fellow, a trainer observes, a trainer at another school is refused
  - removing staff signs them out
  - a parent's number can't become staff
  - the audit CSV has no phones or names
  - ops adds a school and its admin signs in
- **Accessibility:** axe WCAG 2.2 AA on every school, trainer and ops-school screen, in light and dark.

**To try it on a review database** (`--sample`), sign in at `/login/school` with test OTP `123456`:
- **admin:** 9000000101
- **trainer:** 9000000102

## Decisions I made (labelled)
1. **Staff accounts are added, never self-created.** Robokalam adds the first admin; that admin adds the rest.
2. **One phone number, one role.** A number used by a parent or Fellow can't also be school staff. This keeps child data and permissions separate.
3. **The fix window is per school** and set from its contract (default `HARDWARE_SLA_HOURS=72`). The public "72-hour hardware replacement" claim is still unapproved in the Claims Register. The portal shows each school *its own contract's* window, which is a fact about that contract, not a marketing claim.
4. **The clock is never reset.** It runs from the original raise time; a reopened ticket keeps its first due time.
5. **Fellow bookings need 48 hours' notice** and a named staff member in the room for the whole session (no Fellow alone with students, per the safety rules).
6. **Schools can cancel a request only before it is scheduled.** After that they message Robokalam, so a Fellow who accepted isn't dropped silently.
7. **Trainers may score Fellow sessions only at their own school**, and only after delivery. A person still decides any action.
8. **Portal language:** English for now (like the Fellow app). Telugu and Hindi come with native review.

## Open questions

**Blocking school launch**
1. **API access** to AADHYA, 21cschool and Validate: base URLs, keys, and whether they can match the proposed contract (or send their docs and I'll adapt the adapter).
2. **Contract terms:** the hardware fix window per school, and whether the "72-hour replacement" claim can be approved publicly (evidence: ticket history).
3. **Campus Session rate card** (approved and dated), and whether schools pay per session or within the lab contract.
4. **Who at Robokalam** handles hardware tickets (owner, alert channel, spares stock) and schedules Fellow requests.
5. **Partner schools for the pilot**, with each one's admin contact.

**Known gaps (planned next)**
- No WhatsApp or SMS alerts yet for new tickets or overdue clocks (they need the WhatsApp Business API). Ops sees them ordered by due time.
- The CSR partner view (read-only, aggregated) isn't built; the brief lists it under roles but not in Phase 4.
- Certificate issuing stays in Validate; the portal shows counts only.
