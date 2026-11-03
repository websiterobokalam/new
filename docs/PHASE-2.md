# Robokalam rebuild: Phase 2 review (Learners)

Status: built and tested. Stopped for review. Not merged.

## What Phase 2 adds

| Brief item | What's built | Where |
|---|---|---|
| Accounts | Parent phone OTP (hashed 6-digit code, 5-minute expiry, 5 tries, 3 sends per 15 minutes, IP rate limits). Session cookie is httpOnly, random, stored only as a hash. Under-18s have no login of their own: they use a learner space inside the parent's account. | `src/lib/auth/*`, `/login/learner` |
| Consent centre | Itemised notice (7 purposes, each with what, why and how long). Required items are explained; optional items start off. Consents are an append-only event log pinned to the notice's SHA-256. Withdrawal is one tap. Full history, data export (JSON) and erasure request are included. | `/app/consent`, `db/seed/notice-learner.json` |
| Free Build Session | Age and interest → OTP with adult guardian declaration → child's first name and consent → pick a slot → booked, with a mini mission. Ops records attendance, plain feedback, the next step and the project built. Follow-up only if the parent opted in. | `/learn/build-session`, `/app/ops` |
| Courses | Marketplace filtered by age, world, language, online or offline, and time. Cards show outcome, age, batch size, educator, schedule, fee and kit. Course page lists upcoming times. | `/courses`, `/courses/[slug]` |
| Payments | Razorpay adapter: orders, checkout, signature check, signed and idempotent webhook. GST-inclusive fee shown in full before payment. GST tax invoice numbered by financial year. Seat holds expire after 30 minutes. | `src/lib/payments`, `/app/book/[id]`, `/api/webhooks/razorpay` |
| Escrow ledger | Double-entry. Postgres rejects any unbalanced journal. Payment: gateway → escrow + GST payable. Refund reverses it. Release to Fellows comes in Phase 3. | `src/lib/ledger.ts` |
| Refunds | Self-serve request showing the policy's calculation. Until your policy is approved, every request goes to human review, so nothing is auto-decided against a parent. Ops approves → gateway refund → ledger reversal. | `/app/orders`, `/app/ops` |
| Journey | Projects linked by prerequisites, drawn as Kalam Line traces. Recommendations use only finished builds and the interests the parent stated. Badges come only for checked builds. No leaderboards, streaks or guilt. | `/app/learners/[id]` |
| Parent view | Plain-language progress, upcoming classes, attendance and feedback, invoices, refunds, consent and data. Messages arrive in Phase 3. | `/app` |
| Report button | On every app page. Goes to the Safeguarding queue with a respond-by time. Only the Safeguarding role can read reports. | `ReportButton`, `/app/safeguarding` |
| Languages | English, Telugu and Hindi for app screens and the consent notice. Account language is remembered and `<html lang>` follows it. **The Telugu and Hindi are machine-drafted and need native review.** | `src/i18n/*` |

## Security and privacy built in

> Since moving to Hostinger MySQL, the row-level-security points below are enforced in application code instead, with the same tests. See `docs/DATABASE.md`.

- **Row-level security on every family table.** The app connects as `rk_app`, which is not the table owner, so policies always apply. Tests prove one family can't read another's learner.
- Consent events and the audit log are append-only: the app role has no UPDATE or DELETE on them.
- Children's data is first name and age band only. No date of birth, school or address. Portfolios are private by default.
- IP addresses are stored only as salted hashes. Phone numbers are masked in logs.
- Test providers (fixed OTP `123456`, mock payments) run only with `ALLOW_TEST_PROVIDERS=1`. Sample courses are flagged `sample` and the migration refuses to load them in production.

## Tests

102 automated tests pass, and the suite passed twice in a row: logic, end-to-end on mobile and desktop, and axe WCAG 2.2 AA in light and dark, including logged-in screens. The brief's required flows are each covered: **booking, consent, payment, refund, safety report** (certificate validation comes with the Validate integration). Further tests cover family isolation, export and erasure, language switching and phone-width overflow.

## Decisions I made (labelled)

1. **Plain `pg` with hand-written SQL migrations, not an ORM.** RLS policies are explicit and reviewable in one file.
2. **Verifiable parental consent method:** OTP-verified phone plus an adult and guardian declaration, recorded with the notice hash. *Counsel must confirm whether DigiLocker or token-based age verification is needed under the DPDP Rules.*
3. **Recording is a required consent**, because it is a child-safety rule in the brief.
4. **GST at 18%, inclusive** (`GST_RATE_PERCENT`). *Your CA should confirm the rate and SAC code.*
5. **Draft refund rules:** full refund 24 hours or more before start, then pro rata for undelivered classes. **All requests go to human review** until you approve a policy.
6. **Journey projects are a draft sequence** of 15 builds for the curriculum team to replace.
7. **Safeguarding response target 24 hours** (`SAFEGUARDING_RESPONSE_HOURS`), until the named Lead sets it.

## Open questions

**Blocking launch**
1. **Prices:** real course fees and kit prices. Only sample fees exist; production shows "Fee published soon" and blocks booking.
2. **Refund policy:** approve or replace the draft rules.
3. **Accounts with providers:** a Razorpay account (keys and webhook secret), and MSG91 with a DLT-registered OTP template.
4. **Hosting and Postgres in India**, plus a CMS decision (still open from Phase 1).
5. **Legal:** counsel review of the consent notice, the verification method, and the grievance officer's name and contact.
6. **Safeguarding Lead:** name, contact, response time and alert channel.
7. **Native review** of the Telugu and Hindi text.

**Known gaps (planned next)**
- Some app text is still English only: the progress sentence, some labels, and dates in Telugu and Hindi.
- WhatsApp opt-in is recorded, but no messages are sent until the WhatsApp Business API is set up.
- The AI helper is in a later phase, as noted on the learner space.
- Trainer and Fellow screens for recording sessions come in Phases 3 and 4; ops does it until then.
- Seat holds expire in queries; a scheduled cleanup job still needs adding.

## Run it

```bash
# Postgres roles: rk_owner (migrations) and rk_app (app, non-owner)
DATABASE_OWNER_URL=... node scripts/migrate.mjs            # production: base data only
DATABASE_OWNER_URL=... node scripts/migrate.mjs --sample   # review: adds sample courses
npm run build && npm start
npx playwright test     # resets robokalam_test and runs all 102 tests
```
See `.env.example` for every setting.
