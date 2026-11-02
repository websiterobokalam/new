# Database setup

## What the app needs

**PostgreSQL 15 or newer.** The site depends on Postgres features:
- row-level security, which keeps each family's data private inside the database
- triggers and constraints that enforce the child-safety and fair-work rules
- `gen_random_uuid()`

**MySQL won't work.** That includes the database built into Hostinger's Node.js hosting. Use a managed Postgres alongside Hostinger.

## Recommendation: Supabase, Mumbai region

| | Supabase (recommended to start) | AWS RDS for PostgreSQL | DigitalOcean Managed PostgreSQL |
|---|---|---|---|
| Region in India | Mumbai (ap-south-1) | Mumbai (ap-south-1) | Bangalore (check the region list) |
| Setup effort | Lowest: dashboard, SQL editor | Highest: VPC, security groups | Low |
| Backups | Daily on paid plans; point-in-time as an add-on | Automated, point-in-time | Daily, point-in-time |
| Good for | Pilot and first year | Scale, strict compliance | Simple production |

**Use a paid plan for production.** Free Supabase projects pause when idle and have no daily backups. Check current pricing before you sign up.

Keeping the database in India matches the brief ("Host in India where possible") and keeps it close to your users.

## Step by step (Supabase)

1. **Create the project.** At supabase.com, create a new project. Region: **South Asia (Mumbai)**. Save the database password it gives you; this is the admin password.
2. **Create the two app logins.**
   - Open **SQL Editor**.
   - Paste the contents of `db/setup-roles.sql`.
   - Replace both `CHANGE_ME_…` passwords with long random ones (24+ characters, letters and numbers).
   - Click **Run**.
3. **Turn off the Data API.** Go to Project Settings → Data API and disable it, or remove `public` from the exposed schemas. The site doesn't use it, and turning it off removes an unused door into the database.
4. **Download the SSL certificate.** Go to Database settings → SSL Configuration → **Download certificate**. Open the file in a text editor; you'll paste its whole contents in step 6.
5. **Get the connection details.** Click **Connect** at the top of the dashboard and choose **Session pooler**, which works over IPv4 (Hostinger needs that). Note the host, which looks like `aws-0-ap-south-1.pooler.supabase.com`, the port `5432`, and your project ref.
   With the pooler, the username is `<role>.<project-ref>`. Your two connection strings are:

   ```
   postgres://rk_owner.<project-ref>:<owner-password>@<pooler-host>:5432/postgres
   postgres://rk_app.<project-ref>:<app-password>@<pooler-host>:5432/postgres
   ```

   If a password contains `@`, `:`, `/` or `#`, URL-encode it, or regenerate it without those characters.
6. **Create the tables (once, from your computer).** You need Node 22 and a copy of the repo:

   ```bash
   git clone https://github.com/websiterobokalam/new && cd new && npm ci
   ```

   ```bash
   DATABASE_OWNER_URL='postgres://rk_owner.<project-ref>:<owner-password>@<pooler-host>:5432/postgres' DATABASE_CA_CERT="$(cat ~/Downloads/prod-ca-2021.crt)" node scripts/migrate.mjs
   ```

   (Use the actual name and location of the certificate file you downloaded.)

   You should see `applied 001_core.sql`, `applied 002_fellows.sql`, `ok`. **Never add `--sample`** in production.
7. **Set Hostinger's environment variables** (Websites → your site → Environment variables):

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **rk_app** connection string (never rk_owner) |
   | `DATABASE_CA_CERT` | the full certificate text from step 4 |
   | `SESSION_SECRET` | a new random string, 32+ characters |
   | `NEXT_PUBLIC_SITE_URL` | `https://new.robokalam.com` |
   | `OTP_PROVIDER`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | when MSG91 is ready |
   | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | when Razorpay is ready |

   Never set `ALLOW_TEST_PROVIDERS` or `PAYMENT_PROVIDER=mock` in production.
8. **Redeploy** on Hostinger.

**How to check it worked:**
- `/courses` loads without the "We can't load this right now" screen.
- In Supabase → Table Editor you can see tables such as `courses` and `consent_notices`.

## Future migrations

Each time a phase adds a file under `db/migrations/`, run step 6 again before or right after deploying. The script applies only new files and is safe to re-run.

## Security notes

- The website connects as `rk_app`, which doesn't own the tables. That's why row-level security applies to every query it makes. Don't give the website the owner or admin login.
- Keep `rk_owner` and admin passwords out of Hostinger. They're only needed when you run migrations.
- With `DATABASE_CA_CERT` set, connections are both encrypted and verified against your provider's certificate.
- Turn on daily backups (paid plan). Test a restore once, before launch.
