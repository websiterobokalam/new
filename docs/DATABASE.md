# Database: Hostinger MySQL

The site uses **MySQL 8.0.16+ or MariaDB 10.6+**, which is what Hostinger's hPanel provides. It's tested on MariaDB 10.11 (133 automated tests), and the SQL also avoids anything MySQL 8 lacks.

## Setup (once)

1. **Create the database.** In hPanel, go to **Websites → your site → Databases → Management** (or **MySQL Databases**). Create a database and a user with a strong password. Hostinger adds a prefix, so you'll get names like `u123456789_robokalam`. Note the database name, the user and the password.
2. **Set the environment variables.** In hPanel, go to **Websites → your site → Deployments / Node.js → Environment variables**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/DATABASE` |
   | `SESSION_SECRET` | a new random string, 32+ characters |
   | `NEXT_PUBLIC_SITE_URL` | `https://new.robokalam.com` |

   Notes on `DATABASE_URL`:
   - Use the host hPanel shows for the database. On the same Hostinger account that's usually `localhost`.
   - If the password contains `@ : / # ? %`, URL-encode it (for example, `@` becomes `%40`), or choose one without those characters.
3. **Deploy.** Set the Node.js app's **entry file** to `server.mjs` (see [HOSTINGER.md](HOSTINGER.md)). It runs `scripts/migrate.mjs --on-start` before the site starts. It creates the tables on the first start and adds new ones after later updates. You don't need to run anything by hand. Check the runtime logs for `applied 001_core.sql`, `applied 002_fellows.sql`, `ok`.
4. **Check it worked.**
   - `/courses` loads (instead of "We can't load this right now").
   - In hPanel → **phpMyAdmin** you can see tables such as `courses`, `consent_notices` and `fellows`.

**Running migrations by hand (optional).** Enable **Remote MySQL** in hPanel for your IP, then run from your computer:

```bash
DATABASE_URL='mysql://USER:PASSWORD@HOST:3306/DATABASE' npm run migrate
```

**Never** pass `--sample` or `--reset` against the live database. The script refuses them in production.

## What changed from Postgres, and what protects family data now

Postgres enforced row-level security inside the database. Hostinger gives one database user, so:

- **App-level scoping.** Every query that reads or changes family or Fellow data filters by the signed-in account (`guardian_account_id`, `account_id`, `fellow_id`). Tests cover cross-family isolation, the data export, Fellows seeing no family data, and staff-only screens.
- **Fellows' view of children** goes through one query (`rosterFor`) that returns only first name, age band, build count and booking status, for classes the Fellow accepted. A test asserts those exact fields.
- **CHECK constraints in the database** still enforce:
  - 14 days' notice before new terms take effect
  - 7 days' notice before removal (unless child safety), and enquiry notes before removal
  - a responsible adult for in-person gigs
  - one open refund per order
  - valid phone numbers, ages, statuses and amounts
- **Triggers (best effort).** The migration tries to install triggers that make consent history, the audit log and the ledger append-only, block contact details in messages, and stop a Fellow changing their own status or tier. Some shared hosts don't allow triggers. If so, the log says `hardening triggers not installed` and the app-level rules (all tested) still apply.
- **Money:** the ledger refuses any unbalanced journal before writing, and each journal is written once per event.

## Backups

- hPanel → **Backups** includes databases on most plans. Check yours does daily backups.
- Before launch, restore a backup to a spare database once to prove it works.
- **Before each phase that adds migrations**, take a manual backup (phpMyAdmin → Export).
