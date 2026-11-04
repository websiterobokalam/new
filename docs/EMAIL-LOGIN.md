# Sign-in by email code

Every door signs people in with a **6-digit code sent to their email**: learners and parents, schools, and Kalamites. There are no passwords. Mobile sign-in by SMS still works and appears as "Use mobile number instead" whenever SMS is switched on (`OTP_PROVIDER=msg91`). When it isn't, the link is hidden.

## How it works

- **Codes:** a code lasts 10 minutes and works once.
  - 5 wrong tries lock it, and an address can request at most 3 codes per 15 minutes.
  - Only a keyed hash of the code is stored (`email_otp_challenges`).
  - The code is sent straight away and never written to the email outbox, so it doesn't sit in the database in plain text.
- **Email addresses:** they're trimmed, lower-cased and checked, and obvious throwaway domains are refused.
- **The code confirms the address:** signing in with a code marks that email as confirmed, so class emails can go to it.
- **Accounts:**
  - Each account has a login email (`accounts.login_email`, unique), a mobile number (`phone_e164`), or both. A database check enforces at least one.
  - An existing account whose contact email was already confirmed by link is treated as the same person.
  - If two accounts confirmed the same email, sign-in stops and asks the person to contact us rather than guess.
- **School door:** only people on a school's staff list can sign in. Unknown emails are refused and no account is created.
- **Switched-off logins** are refused at sign-in, and their sessions end at once.

## Creating logins

- **Ops → Accounts and logins** (`/app/ops/accounts`): create a login for:
  - a parent or adult learner
  - a school admin or trainer, for a chosen school
  - Robokalam ops or safeguarding
  - a CSR partner

  The person gets a "Your Robokalam login is ready" email with a link to their door. Ops can also find accounts and switch a login off or back on, with a reason that goes in the audit log.
- **Kalamites are never created by hand.** They apply and pass vetting (child-safety rule).
- **School admins** add staff by email under School → Staff. The mobile number is optional.
- **Ops → Schools:** a new school's first admin is added by email.

## Launch checks

Email sending (SMTP) is required, because it carries the sign-in codes. SMS is now a *recommended* item: switch it on later with `OTP_PROVIDER=msg91`, `MSG91_AUTH_KEY` and a DLT-registered `MSG91_TEMPLATE_ID`.
