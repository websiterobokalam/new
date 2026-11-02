-- Robokalam Phase 2: learners, consent, bookings, payments, refunds, journey.
-- Runs as rk_owner. The app connects as rk_app, which is not the table owner,
-- so row-level security applies to every query it makes.
--
-- Request context (set per transaction by src/lib/db.ts):
--   rk.account_id  uuid of the signed-in account ('' when anonymous)
--   rk.role        account role
--   rk.system      'on' only inside trusted server tasks (OTP, webhooks, ledger)

CREATE OR REPLACE FUNCTION rk_account() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('rk.account_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION rk_role() RETURNS text LANGUAGE sql STABLE AS
$$ SELECT coalesce(nullif(current_setting('rk.role', true), ''), 'anon') $$;
CREATE OR REPLACE FUNCTION rk_system() RETURNS boolean LANGUAGE sql STABLE AS
$$ SELECT coalesce(current_setting('rk.system', true), '') = 'on' $$;

-- ---------- identity ----------
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL UNIQUE CHECK (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  role text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent','adult_learner','fellow','trainer','school_admin','ops','safeguarding','csr')),
  display_name text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','te','hi')),
  region text NOT NULL DEFAULT 'ts-ap' CHECK (region IN ('ts-ap','india','intl')),
  adult_declared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  erased_at timestamptz
);

CREATE TABLE otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_phone_idx ON otp_challenges (phone_e164, created_at DESC);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

-- A learner is a child managed by a guardian, or an adult who manages themself.
-- Only first name and age band: never date of birth, school or address.
CREATE TABLE learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_account_id uuid NOT NULL REFERENCES accounts(id),
  first_name text NOT NULL CHECK (length(first_name) BETWEEN 1 AND 40),
  age_band text NOT NULL CHECK (age_band IN ('6-8','9-11','12-14','15-17','18+')),
  interests text[] NOT NULL DEFAULT '{}',
  portfolio_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  erased_at timestamptz
);
CREATE INDEX learners_guardian_idx ON learners (guardian_account_id);

-- ---------- consent (DPDP) ----------
CREATE TABLE consent_notices (
  id text PRIMARY KEY,               -- e.g. 'learner-2026-11'
  language text NOT NULL,
  title text NOT NULL,
  body jsonb NOT NULL,               -- itemised: [{purpose, what, why, keep, required}]
  sha256 text NOT NULL,
  approved boolean NOT NULL DEFAULT false,   -- counsel sign-off
  published_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only event log. Current state = latest event per (learner, purpose).
CREATE TABLE consent_events (
  id bigserial PRIMARY KEY,
  learner_id uuid NOT NULL REFERENCES learners(id),
  guardian_account_id uuid NOT NULL REFERENCES accounts(id),
  purpose text NOT NULL CHECK (purpose IN ('account','live_classes','class_recording','ai_helper','portfolio_sharing','whatsapp','follow_up')),
  granted boolean NOT NULL,
  notice_id text NOT NULL REFERENCES consent_notices(id),
  method text NOT NULL,              -- how the guardian was verified
  evidence jsonb NOT NULL,           -- notice hash, ip hash, user agent, adult declaration time
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consent_lookup_idx ON consent_events (learner_id, purpose, id DESC);

CREATE VIEW consent_current WITH (security_invoker = true) AS
SELECT DISTINCT ON (learner_id, purpose) learner_id, guardian_account_id, purpose, granted, notice_id, created_at
FROM consent_events ORDER BY learner_id, purpose, id DESC;

-- ---------- catalogue ----------
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  world text NOT NULL CHECK (world IN ('robotics','iot','ai','finlit','space','coding')),
  programme text,
  age_min int NOT NULL, age_max int,
  outcome text NOT NULL,
  batch_size_max int NOT NULL CHECK (batch_size_max BETWEEN 2 AND 30),
  sessions int NOT NULL DEFAULT 1,
  kit text,
  fee_paise int CHECK (fee_paise >= 0),        -- GST inclusive; null = not published
  fee_approved boolean NOT NULL DEFAULT false,
  sample boolean NOT NULL DEFAULT false,       -- review fixtures, never in production
  published boolean NOT NULL DEFAULT false,
  kind text NOT NULL DEFAULT 'course' CHECK (kind IN ('course','build_session'))
);

CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL,
  capacity int NOT NULL CHECK (capacity BETWEEN 1 AND 30),
  language text NOT NULL DEFAULT 'en',
  mode text NOT NULL CHECK (mode IN ('online','offline')),
  location text,
  educator_label text                  -- first name + badge until Phase 3 profiles
);
CREATE INDEX batches_course_idx ON batches (course_id, starts_at);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id),
  learner_id uuid NOT NULL REFERENCES learners(id),
  guardian_account_id uuid NOT NULL REFERENCES accounts(id),
  status text NOT NULL CHECK (status IN ('pending_payment','confirmed','attended','no_show','cancelled','refunded')),
  feedback text,
  next_step text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, learner_id)
);

-- ---------- money ----------
CREATE SEQUENCE invoice_seq;
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  amount_paise int NOT NULL CHECK (amount_paise > 0),
  gst_paise int NOT NULL CHECK (gst_paise >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL CHECK (status IN ('created','paid','failed','refunded','partially_refunded')),
  provider text NOT NULL,
  provider_order_id text UNIQUE,
  provider_payment_id text UNIQUE,
  invoice_no text UNIQUE,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Double-entry ledger. Every journal's postings must sum to zero.
CREATE TABLE ledger_journals (
  id bigserial PRIMARY KEY,
  kind text NOT NULL,                 -- payment_captured, refund_paid, session_delivered...
  ref text NOT NULL,                  -- order id, refund id...
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, ref)                  -- idempotency: one journal per event
);
CREATE TABLE ledger_postings (
  id bigserial PRIMARY KEY,
  journal_id bigint NOT NULL REFERENCES ledger_journals(id),
  account text NOT NULL CHECK (account IN ('gateway_clearing','learner_escrow','gst_payable','platform_revenue','educator_payable','refunds')),
  amount_paise bigint NOT NULL CHECK (amount_paise <> 0)   -- debit positive, credit negative
);
CREATE OR REPLACE FUNCTION ledger_balanced() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s bigint;
BEGIN
  SELECT coalesce(sum(amount_paise), 0) INTO s FROM ledger_postings WHERE journal_id = NEW.journal_id;
  IF s <> 0 THEN RAISE EXCEPTION 'ledger journal % is unbalanced by %', NEW.journal_id, s; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER ledger_balanced_trg AFTER INSERT OR UPDATE ON ledger_postings
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_balanced();

CREATE TABLE refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  reason text NOT NULL CHECK (length(reason) BETWEEN 3 AND 500),
  amount_paise int NOT NULL CHECK (amount_paise > 0),
  decision jsonb NOT NULL,            -- policy evaluation shown to the parent
  status text NOT NULL CHECK (status IN ('requested','approved','rejected','paid')),
  provider_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE UNIQUE INDEX one_open_refund ON refund_requests (order_id) WHERE status IN ('requested','approved');

-- ---------- journey ----------
CREATE TABLE projects (
  id text PRIMARY KEY,                -- 'robotics-1-blink'
  world text NOT NULL,
  level int NOT NULL,
  title text NOT NULL,
  builds text NOT NULL,               -- what the learner makes
  prerequisites text[] NOT NULL DEFAULT '{}',
  age_min int NOT NULL DEFAULT 6
);
CREATE TABLE learner_progress (
  learner_id uuid NOT NULL REFERENCES learners(id),
  project_id text NOT NULL REFERENCES projects(id),
  status text NOT NULL CHECK (status IN ('started','built')),
  reviewed_by text,                   -- trainer/Fellow who checked the build
  completed_at timestamptz,
  PRIMARY KEY (learner_id, project_id)
);

-- ---------- safety, privacy, audit ----------
CREATE TABLE safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_account_id uuid REFERENCES accounts(id),
  learner_id uuid REFERENCES learners(id),
  page text NOT NULL,
  category text NOT NULL CHECK (category IN ('safety','contact_details','inappropriate','bullying','technical','other')),
  details text NOT NULL CHECK (length(details) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','actioned','closed')),
  respond_by timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  learner_id uuid REFERENCES learners(id),
  kind text NOT NULL CHECK (kind IN ('export','erase')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','done','held')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  actor_account_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb NOT NULL DEFAULT '{}',
  at timestamptz NOT NULL DEFAULT now()
);

-- ---------- grants ----------
GRANT USAGE ON SCHEMA public TO rk_app;
GRANT SELECT, INSERT, UPDATE ON accounts, otp_challenges, sessions, learners, bookings, orders, refund_requests, learner_progress, safety_reports, data_requests TO rk_app;
GRANT SELECT, INSERT ON consent_events, ledger_journals, ledger_postings, audit_log TO rk_app;  -- append-only
GRANT SELECT ON consent_notices, consent_current, courses, batches, projects TO rk_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rk_app;

-- ---------- row-level security ----------
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_self ON accounts USING (id = rk_account() OR rk_system() OR rk_role() = 'ops') WITH CHECK (id = rk_account() OR rk_system());

ALTER TABLE otp_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY otp_system ON otp_challenges USING (rk_system()) WITH CHECK (rk_system());
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_system ON sessions USING (rk_system() OR account_id = rk_account()) WITH CHECK (rk_system());

ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
CREATE POLICY learners_guardian ON learners USING (guardian_account_id = rk_account() OR rk_system()) WITH CHECK (guardian_account_id = rk_account() OR rk_system());

ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_guardian ON consent_events USING (guardian_account_id = rk_account() OR rk_system() OR rk_role() = 'ops')
  WITH CHECK (guardian_account_id = rk_account() AND EXISTS (SELECT 1 FROM learners l WHERE l.id = learner_id AND l.guardian_account_id = rk_account()));

ALTER TABLE consent_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY notices_read ON consent_notices FOR SELECT USING (true);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY courses_read ON courses FOR SELECT USING (published OR rk_system() OR rk_role() = 'ops');
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY batches_read ON batches FOR SELECT USING (EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id));
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY projects_read ON projects FOR SELECT USING (true);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY bookings_guardian ON bookings USING (guardian_account_id = rk_account() OR rk_system() OR rk_role() = 'ops')
  WITH CHECK ((guardian_account_id = rk_account() AND EXISTS (SELECT 1 FROM learners l WHERE l.id = learner_id AND l.guardian_account_id = rk_account())) OR rk_system());

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_owner ON orders USING (account_id = rk_account() OR rk_system() OR rk_role() = 'ops') WITH CHECK (account_id = rk_account() OR rk_system());

ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY refunds_owner ON refund_requests USING (account_id = rk_account() OR rk_system() OR rk_role() = 'ops')
  WITH CHECK ((account_id = rk_account() AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.account_id = rk_account())) OR rk_system());

ALTER TABLE learner_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_guardian ON learner_progress USING (rk_system() OR EXISTS (SELECT 1 FROM learners l WHERE l.id = learner_id AND l.guardian_account_id = rk_account()))
  WITH CHECK (rk_system());   -- only trainers/Fellows (via server tasks) mark builds

ALTER TABLE ledger_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_j_system ON ledger_journals USING (rk_system() OR rk_role() = 'ops') WITH CHECK (rk_system());
ALTER TABLE ledger_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_p_system ON ledger_postings USING (rk_system() OR rk_role() = 'ops') WITH CHECK (rk_system());

ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_insert ON safety_reports FOR INSERT WITH CHECK (reporter_account_id IS NOT DISTINCT FROM rk_account() OR rk_system());
CREATE POLICY reports_read ON safety_reports FOR SELECT USING (rk_role() = 'safeguarding' OR reporter_account_id = rk_account());
CREATE POLICY reports_update ON safety_reports FOR UPDATE USING (rk_role() = 'safeguarding');

ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY datareq_owner ON data_requests USING (account_id = rk_account() OR rk_system() OR rk_role() = 'ops') WITH CHECK (account_id = rk_account() OR rk_system());

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert ON audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY audit_read ON audit_log FOR SELECT USING (rk_role() IN ('ops','safeguarding'));

CREATE TABLE schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
