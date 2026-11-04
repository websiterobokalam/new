# Deploying Robokalam on Hostinger

Everything here happens in **hPanel**, Hostinger's control panel. You need a plan with **Node.js web apps** (Business or Cloud web hosting), or a Hostinger VPS (see the end).

Settings to paste: **`hostinger.env.example`** in this repository.

## 1. Create the database (5 minutes)

1. hPanel → **Websites → robokalam.com → Databases → MySQL Databases**.
2. Create a database (for example `robokalam`) and a user (for example `rkuser`) with a long password.
   - Hostinger adds a prefix, so you'll get names like `u123456789_robokalam` and `u123456789_rkuser`. Write them down.
   - Avoid `@ : / # ? %` in the password, or URL-encode them.
3. Your `DATABASE_URL` is:
   `mysql://u123456789_rkuser:PASSWORD@localhost:3306/u123456789_robokalam`

You don't need to create tables. The site creates and updates them each time it starts.

## 2. Create the mailbox (5 minutes)

Sign-in codes, booking confirmations and receipts are all sent by email, so this is required.

1. hPanel → **Emails → robokalam.com**: create `info@robokalam.com` (or `no-reply@robokalam.com`) with a strong password.
2. Settings for the site:
   - `SMTP_HOST=smtp.hostinger.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=info@robokalam.com`
   - `SMTP_PASS=` the mailbox password
3. hPanel → **Emails → DNS / Deliverability**: make sure SPF, DKIM and DMARC show as set up, so codes land in the inbox, not spam. Hostinger adds them for you when the domain uses Hostinger nameservers.

## 3. Create the Node.js app (10 minutes)

1. hPanel → **Websites → Add website → Node.js web app**. Connect GitHub and choose **websiterobokalam/new**, branch **main**.
2. Build settings:

   | Setting | Value |
   |---|---|
   | Node.js version | **22** (20 also works) |
   | Install command | `npm ci` (or leave the default) |
   | Build command | `npm run build` |
   | Output directory | `.next` |
   | **Entry file** | **`server.mjs`** |

   The entry file matters. Without it, Hostinger runs `next start` directly and skips the launch checks and database updates. `server.mjs` runs:
   1. `scripts/preflight.mjs` (launch checks)
   2. `scripts/migrate.mjs` (tables)
   3. the site, on Hostinger's port
3. **Environment variables:** paste the values from `hostinger.env.example`. Make the two secrets on any computer with Node (`npm run secrets`) or with `openssl rand -hex 32`.
4. **Deploy.** In the runtime logs you should see:
   - `[preflight] Launch readiness: …` (lists anything still missing)
   - `applied 001_core.sql` … `applied 006_email_login.sql`, then `ok`
   - `[server] Robokalam is running on port …`

**Stage first.** Point the app at `new.robokalam.com` with `NEXT_PUBLIC_SITE_URL=https://new.robokalam.com`. On that address the launch checks only warn, so you can test everything. Switch the domain and the setting to `https://robokalam.com` when Ops → Launch readiness says *Ready to launch*.

> `NEXT_PUBLIC_SITE_URL`, `LEGAL_NAME`, `LEGAL_PAGES_APPROVED` and the named people are built into the pages. After changing them, click **Redeploy**.

## 4. Your first ops login (2 minutes)

1. Open `/login/learner` and sign in with your own email (you get a code).
2. hPanel → **Databases → phpMyAdmin**, open the database, and run:

   ```sql
   UPDATE accounts SET role = 'ops' WHERE login_email = 'you@robokalam.com';
   ```
3. Sign out and back in. You now have **Ops** in the menu.
4. Create every other login from **Ops → Accounts and logins**: the Safeguarding Lead, school admins, other ops staff. Each person gets an email telling them how to sign in.

## 5. Cron jobs (3 minutes)

Hostinger pauses Node.js apps that get no traffic. These jobs wake the site, send queued email and tidy up. They also keep emails moving at night.

hPanel → your Node.js website → **Advanced → Cron Jobs**. Times are UTC. Replace `KEY` with your `CRON_SECRET`.

| Schedule | Command |
|---|---|
| Every 5 minutes (`*/5 * * * *`) | `curl -fsS "https://robokalam.com/api/cron/email?key=KEY" > /dev/null` |
| Daily at 21:30 UTC (03:00 IST) (`30 21 * * *`) | `curl -fsS "https://robokalam.com/api/cron/housekeeping?key=KEY" > /dev/null` |

Use `new.robokalam.com` in these while you're staging.

## 6. Razorpay (10 minutes)

1. Razorpay Dashboard → **Live mode → API Keys**: generate a key, then set `RAZORPAY_KEY_ID` (starts with `rzp_live_`) and `RAZORPAY_KEY_SECRET`.
2. **Webhooks → Add**:
   - URL: `https://robokalam.com/api/webhooks/razorpay`
   - Events: `payment.captured` and `order.paid`
   - Choose a secret, and set the same value as `RAZORPAY_WEBHOOK_SECRET`.

## 7. Domain and SSL

1. hPanel → **Domains**: point `robokalam.com` (and `www`) at the Node.js app.
2. hPanel → **Security → SSL**: install the free SSL certificate and turn on **Force HTTPS**.
3. The old site's pages redirect to their new pages (301), so existing links and Google results keep working.

## 8. Backups and the restore check (15 minutes, then every 90 days)

1. hPanel → **Backups**: confirm daily database backups are on. Download today's database backup (`.sql.gz`).
2. Create a second, empty database, for example `u123456789_restorecheck`.
3. On any computer with Node and this repository:

   ```bash
   BACKUP_VERIFY_URL='mysql://USER:PASS@HOST:3306/u123456789_restorecheck' \
   DATABASE_URL='mysql://USER:PASS@HOST:3306/u123456789_robokalam' \
   npm run backup:verify -- backup.sql.gz
   ```

   For this, turn on **Remote MySQL** in hPanel for your IP. The host is shown there (`srvNNN.hstgr.io`).
4. It prints `Set BACKUP_VERIFIED_AT=YYYY-MM-DD`. Add that setting in hPanel.

## 9. Go-live check

- [ ] Ops → **Launch readiness** shows no blockers.
- [ ] `https://robokalam.com/api/health` returns `{"ok":true,"db":true}`. Add it to an uptime monitor such as UptimeRobot (free).
- [ ] Sign in at each door with an email code: Learner, School, Kalamite.
- [ ] Book one paid class with your own card or UPI, then refund it from Orders, to confirm Razorpay and refunds end to end.
- [ ] Hostinger runtime logs show no errors after an hour.

## Troubleshooting

| You see | Fix |
|---|---|
| Site doesn't start; logs say `Launch checks failed` | The `[preflight] BLOCK` lines say what's missing and how to fix it. For an emergency only, `LAUNCH_PREFLIGHT=warn` starts it anyway. |
| "We can't load this right now" | `DATABASE_URL` is wrong, or the database user lacks rights. Check the `[migrate]` line in the logs. |
| "Sign-in by email isn't switched on yet" | `EMAIL_TRANSPORT=smtp` and the `SMTP_*` settings are missing. Restart the app after adding them. |
| Codes arrive late or in spam | Check SPF/DKIM in hPanel → Emails, and that the 5-minute cron job is set. |
| `hardening triggers not installed` | Normal on shared hosting. The app enforces the same rules itself. |
| Changed a setting and nothing happened | Restart the app. For `NEXT_PUBLIC_*`, legal and people settings, **Redeploy**. |

## On a Hostinger VPS instead

Use Ubuntu with Node 22, Nginx and PM2:

```bash
git clone https://github.com/websiterobokalam/new robokalam
```

```bash
cd robokalam && npm ci && npm run build
```

```bash
pm2 start server.mjs --name robokalam && pm2 save && pm2 startup
```

Put the settings in `/etc/environment` or a PM2 ecosystem file, proxy Nginx to port 3000, and use Certbot for SSL. Install MySQL or MariaDB with `apt` and use `localhost` in `DATABASE_URL`. Add the two cron lines with `crontab -e`.
