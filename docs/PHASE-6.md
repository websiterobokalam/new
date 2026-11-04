# Phase 6: Launch readiness

The product is built. Phase 6 makes sure robokalam.com cannot go live half-configured, and gives the team one place to see what is left.

## What it does

| Piece | What it does | Where |
| --- | --- | --- |
| Launch checks | About 30 checks covering security, sign-in, payments, invoices, legal, child safety, email, database and backups. Each check is either a blocker or recommended, and comes with its fix. | `scripts/launch-checks.mjs` |
| Start-up guard | `npm start` runs the checks first. On the **live address** a blocker stops the server from starting. The live address means `NEXT_PUBLIC_SITE_URL=https://robokalam.com`, production, review mode off. On a review or staging address the checks only warn. | `scripts/preflight.mjs` |
| Launch readiness page | Ops see every check, with its status and fix, checked live. | `/app/ops/launch` |
| Health check | `GET /api/health` returns 200 when the database answers and 503 when it doesn't. With `?key=CRON_SECRET` it also returns the email queue and launch blockers. | `/api/health` |
| Housekeeping | Runs hourly on the server, and is also available for a daily cron. It:<br>• cancels unpaid seat holds after 24 hours and marks their orders failed<br>• deletes sign-in codes older than a day<br>• deletes sessions that ended over 30 days ago | `src/lib/housekeeping.ts`, `/api/cron/housekeeping` |
| Late payments | If a payment arrives after its hold was tidied away, the money is kept and the order is flagged `late_payment_review` in the audit log for a person to decide. | `markPaid` in `src/lib/learn/booking.ts` |
| Backup check | Restores a Hostinger backup into an empty scratch database and compares every table with live. It prints the `BACKUP_VERIFIED_AT` date to set. | `scripts/backup-verify.mjs` |
| Named people | The Safeguarding Lead, Grievance Officer and legal company name come from settings. They then appear on the privacy, child-safety, footer and invoice pages. Draft notices disappear once `LEGAL_PAGES_APPROVED=1`. | `src/content/company.ts`, `src/lib/site.ts` |

## Go-live runbook

1. **Hostinger settings.** Fill in every variable in `.env.example` under "Phase 6", plus:
   - payments: Razorpay **live** keys
   - sign-in: MSG91 with a DLT-registered template
   - email: SMTP
   - invoices: GSTIN, registered address, SAC code
2. **People.**
   - The Safeguarding Lead and an ops person each sign in once.
   - Set their roles in the database:

     ```sql
     UPDATE accounts SET role = 'ops' WHERE phone_e164 = '+91…';
     UPDATE accounts SET role = 'safeguarding' WHERE phone_e164 = '+91…';
     ```
3. **Legal.** Already approved, see below. Set `LEGAL_PAGES_APPROVED=0` or `REFUND_POLICY_APPROVED=0` only to reopen an item.
4. **Backup.** Download today's database backup from hPanel, then run:

   ```bash
   BACKUP_VERIFY_URL=mysql://user:pass@host/empty_scratch_db \
   DATABASE_URL=mysql://… npm run backup:verify -- backup.sql.gz
   ```

   Set `BACKUP_VERIFIED_AT` to the date it prints. Repeat at least every 90 days.
5. **Razorpay webhook.** Point it to `https://robokalam.com/api/webhooks/razorpay` (events: `payment.captured` and `order.paid`) and set `RAZORPAY_WEBHOOK_SECRET`.
6. **Cron jobs** (backups to the server's own loop):
   - every 5 minutes: `curl -fsS "https://robokalam.com/api/cron/email?key=CRON_SECRET"`
   - daily: `curl -fsS "https://robokalam.com/api/cron/housekeeping?key=CRON_SECRET"`
7. **Uptime monitor** on `https://robokalam.com/api/health`.
8. **Rebuild**, because names, legal approval and the site URL are read at build time. Then run `npm run preflight` until it says *Ready to launch*, and check Ops → Launch readiness.
9. **Switch DNS.**

Emergency only: `LAUNCH_PREFLIGHT=warn` lets the live site start with blockers. Everything is logged loudly. Remove it as soon as the blocker is fixed.

## Decisions I made (labelled)

- **The guard applies only to the live domain.** Review and staging copies (`new.robokalam.com`, review mode) keep starting, so today's review deployment isn't taken down.
- **Unpaid holds are tidied after 24 hours, not 30 minutes.** A hold already stops counting against capacity after 30 minutes, so this is housekeeping only. The day's margin covers slow UPI confirmations.
- **No invented promises.** The privacy page names the Grievance Officer but sets no response time; that is for counsel to state. The child-safety page shows the response time only from `SAFEGUARDING_RESPONSE_HOURS`.

## Decided by Robokalam (4 November 2026)

- **Company name:** Robokalam Technologies Private Limited. It's the default for invoices, the footer, legal pages and structured data; `LEGAL_NAME` overrides it.
- **Approved:**
  - the privacy, terms, refund and child-safety pages
  - the refund policy
  - the parent consent notice (English, Telugu, Hindi)
  - the Kalamite terms and code of conduct

  Draft labels are gone. Approved refunds follow the published rules and are paid automatically. `LEGAL_PAGES_APPROVED=0` or `REFUND_POLICY_APPROVED=0` puts an item back into draft.
- **Safeguarding Lead and Grievance Officer:** published as roles of Robokalam Technologies Private Limited at info@robokalam.com. Naming individuals is a recommended item on the Launch page; set `SAFEGUARDING_LEAD_NAME` / `GRIEVANCE_OFFICER_NAME` and their emails when appointed.

## Still needed from Robokalam

- Razorpay live keys and webhook secret, the MSG91 DLT template, the SMTP mailbox, and the GSTIN and registered address for invoices.
- `NEXT_PUBLIC_SITE_URL`, `SESSION_SECRET` and `CRON_SECRET` on Hostinger.
- One backup restore check (`BACKUP_VERIFIED_AT`).
- Evidence for any Claims Register numbers you want shown. These stay hidden until approved with evidence.
