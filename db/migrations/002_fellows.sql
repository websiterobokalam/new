-- Phase 3: Kalam Fellows pilot. Vetting, Academy, terms, gigs, teaching,
-- earnings, payouts, messages, reviews, quality, disputes, removal cases.
-- Fair-work and child-safety rules are enforced here, not only in app code.

-- ---------- Fellows ----------
CREATE TABLE fellows (
  account_id uuid PRIMARY KEY REFERENCES accounts(id),
  full_name text NOT NULL CHECK (length(full_name) BETWEEN 2 AND 80),
  display_name text NOT NULL,                 -- first name + last initial, shown to parents
  college text NOT NULL,
  course text NOT NULL,
  year text NOT NULL,
  college_email text,
  worlds text[] NOT NULL CHECK (cardinality(worlds) > 0),
  languages text[] NOT NULL CHECK (cardinality(languages) > 0),
  hours_per_week int NOT NULL CHECK (hours_per_week BETWEEN 1 AND 40),
  city text NOT NULL,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','vetting','live','paused','suspended','removed','waitlisted')),
  tier text NOT NULL DEFAULT 'apprentice' CHECK (tier IN ('apprentice','fellow','senior','lead')),
  weekly_cap_hours int NOT NULL DEFAULT 15 CHECK (weekly_cap_hours BETWEEN 1 AND 40),
  exam_mode_until date,
  point_of_contact text,                      -- named Robokalam contact (language: en/te/hi)
  age_confirmed_at timestamptz NOT NULL,
  went_live_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The nine steps of the Fellow journey after applying.
CREATE TABLE vetting_steps (
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  step text NOT NULL CHECK (step IN ('subject_test','demo','identity','background','references','academy','terms','shadow','co_teach')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','passed','failed')),
  detail jsonb NOT NULL DEFAULT '{}',
  reviewed_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fellow_id, step)
);

CREATE TABLE academy_progress (
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  module_id text NOT NULL,
  score int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fellow_id, module_id)
);

-- ---------- Terms: 14 days' notice before any change takes effect ----------
CREATE TABLE terms_versions (
  id text PRIMARY KEY,                         -- 'fellow-terms-2026-11-en'
  kind text NOT NULL CHECK (kind IN ('fellow_terms','code_of_conduct')),
  language text NOT NULL CHECK (language IN ('en','te','hi')),
  title text NOT NULL,
  body jsonb NOT NULL,
  sha256 text NOT NULL,
  initial boolean NOT NULL DEFAULT false,      -- the first version has nothing to give notice of
  published_at timestamptz NOT NULL DEFAULT now(),
  effective_at timestamptz NOT NULL,
  CHECK (initial OR effective_at >= published_at + interval '14 days')
);
CREATE TABLE terms_acceptances (
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  terms_id text NOT NULL REFERENCES terms_versions(id),
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fellow_id, terms_id)
);

-- ---------- Pay ----------
-- Fixed pay per session by gig kind. Unapproved rates cannot fund a gig (see trigger).
CREATE TABLE rate_card (
  gig_kind text PRIMARY KEY,
  per_session_paise int NOT NULL CHECK (per_session_paise > 0),
  minutes int NOT NULL CHECK (minutes > 0),
  approved boolean NOT NULL DEFAULT false,
  sample boolean NOT NULL DEFAULT false,
  effective_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE deductions (
  code text PRIMARY KEY,                       -- 'tds'
  label text NOT NULL,
  percent numeric(5,2) NOT NULL CHECK (percent >= 0 AND percent < 50),
  approved boolean NOT NULL DEFAULT false
);

-- ---------- Gigs ----------
CREATE TABLE gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('live_batch','campus_session','weekend_workshop','doubt_desk','project_mentor','build_session','shadow','co_teach')),
  batch_id uuid REFERENCES batches(id),
  title text NOT NULL,
  world text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL CHECK (duration_min BETWEEN 15 AND 480),
  mode text NOT NULL CHECK (mode IN ('online','offline')),
  location text,                               -- offline: partner school or centre only
  responsible_adult text,                      -- offline: named adult present (required)
  city text NOT NULL,
  pay_paise int NOT NULL CHECK (pay_paise > 0),
  rate_sample boolean NOT NULL DEFAULT false,
  seats int NOT NULL DEFAULT 1 CHECK (seats BETWEEN 1 AND 10),
  min_tier text NOT NULL DEFAULT 'apprentice',
  lesson_plan text,
  kit_list text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled','completed')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- In-person gigs only at a partner school or centre with a responsible adult present.
  CHECK (mode = 'online' OR (location IS NOT NULL AND responsible_adult IS NOT NULL))
);
CREATE INDEX gigs_open_idx ON gigs (status, starts_at);

CREATE TABLE gig_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id uuid NOT NULL REFERENCES gigs(id),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  status text NOT NULL CHECK (status IN ('accepted','declined','withdrawn','delivered','no_show','cancelled')),
  responded_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  UNIQUE (gig_id, fellow_id)
);
ALTER TABLE batches ADD COLUMN educator_fellow_id uuid REFERENCES fellows(account_id);

CREATE TABLE earnings_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  assignment_id uuid REFERENCES gig_assignments(id),
  kind text NOT NULL CHECK (kind IN ('session','training','demo','shadow','co_teach','adjustment')),
  description text NOT NULL,
  gross_paise int NOT NULL,
  deductions jsonb NOT NULL DEFAULT '[]',
  net_paise int NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  payout_id uuid,
  UNIQUE (fellow_id, kind, description)        -- idempotency for training / demo lines
);
CREATE UNIQUE INDEX one_line_per_assignment ON earnings_lines (assignment_id) WHERE assignment_id IS NOT NULL;

CREATE TABLE payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  period_end date NOT NULL,
  gross_paise int NOT NULL, deductions_paise int NOT NULL, net_paise int NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  provider_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (fellow_id, period_end)
);
ALTER TABLE earnings_lines ADD CONSTRAINT earnings_payout_fk FOREIGN KEY (payout_id) REFERENCES payouts(id);

ALTER TABLE ledger_postings DROP CONSTRAINT ledger_postings_account_check;
ALTER TABLE ledger_postings ADD CONSTRAINT ledger_postings_account_check CHECK (account IN
  ('gateway_clearing','learner_escrow','gst_payable','platform_revenue','educator_payable','refunds','platform_expense','deductions_payable','payouts_bank'));

-- ---------- Messages: on-platform only; contact details blocked ----------
CREATE TABLE message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id),
  guardian_account_id uuid NOT NULL REFERENCES accounts(id),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, guardian_account_id, fellow_id)
);
CREATE TABLE messages (
  id bigserial PRIMARY KEY,
  thread_id uuid NOT NULL REFERENCES message_threads(id),
  sender_account_id uuid NOT NULL REFERENCES accounts(id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  blocked boolean NOT NULL DEFAULT false,      -- contained contact details: never shown
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Reviews: verified parents of attended sessions only ----------
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES bookings(id),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  guardian_account_id uuid NOT NULL REFERENCES accounts(id),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text CHECK (length(body) <= 600),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Quality: AI may flag, a human decides ----------
CREATE TABLE quality_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES gig_assignments(id),
  reviewer_account_id uuid NOT NULL REFERENCES accounts(id),
  kind text NOT NULL CHECK (kind IN ('observation','recording_sample')),
  rubric jsonb NOT NULL,                       -- {prep, clarity, engagement, safety, outcome}: 1-4
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Help, disputes, removal ----------
CREATE TABLE help_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  assignment_id uuid REFERENCES gig_assignments(id),
  kind text NOT NULL CHECK (kind IN ('tech','kit','learner','safety','other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raised_by uuid NOT NULL REFERENCES accounts(id),
  raised_role text NOT NULL CHECK (raised_role IN ('fellow','parent')),
  subject text NOT NULL CHECK (subject IN ('pay','gig','tier','removal','session','other')),
  ref text,
  details text NOT NULL CHECK (length(details) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','committee','resolved')),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Removal: written reasons, an enquiry and 7 days' notice, unless a child's
-- safety requires immediate action.
CREATE TABLE removal_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  reasons text NOT NULL CHECK (length(reasons) >= 20),
  child_safety boolean NOT NULL DEFAULT false,
  opened_by uuid NOT NULL REFERENCES accounts(id),
  opened_at timestamptz NOT NULL DEFAULT now(),
  notice_until timestamptz NOT NULL,
  enquiry_notes text,
  status text NOT NULL DEFAULT 'notice' CHECK (status IN ('notice','removed','reinstated')),
  decided_at timestamptz,
  CHECK (child_safety OR notice_until >= opened_at + interval '7 days'),
  CHECK (status <> 'removed' OR (enquiry_notes IS NOT NULL AND (child_safety OR decided_at >= notice_until)))
);

CREATE TABLE removal_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES removal_cases(id),
  fellow_id uuid NOT NULL REFERENCES fellows(account_id),
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Minimal child data for Fellows ----------
-- Fellows never read learners directly. This function returns only first
-- name, age band and built-project count, and only for learners booked into
-- a batch the calling Fellow has accepted.
CREATE OR REPLACE FUNCTION fellow_roster(p_gig uuid)
RETURNS TABLE (booking_id uuid, first_name text, age_band text, built int, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT bk.id, l.first_name, l.age_band,
         (SELECT count(*)::int FROM learner_progress lp WHERE lp.learner_id = l.id AND lp.status = 'built'),
         bk.status
  FROM gigs g
  JOIN gig_assignments ga ON ga.gig_id = g.id AND ga.fellow_id = rk_account() AND ga.status IN ('accepted','delivered')
  JOIN bookings bk ON bk.batch_id = g.batch_id AND bk.status IN ('confirmed','attended','no_show')
  JOIN learners l ON l.id = bk.learner_id AND l.erased_at IS NULL
  WHERE g.id = p_gig
  ORDER BY l.first_name
$$;
REVOKE ALL ON FUNCTION fellow_roster(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fellow_roster(uuid) TO rk_app;

-- Public Fellow profile: live Fellows only, no contact details.
CREATE VIEW fellow_profiles WITH (security_barrier = true) AS
SELECT f.account_id AS id, f.display_name, f.college, f.worlds, f.languages, f.tier,
       (SELECT coalesce(sum(g.duration_min), 0)::int / 60 FROM gig_assignments ga JOIN gigs g ON g.id = ga.gig_id WHERE ga.fellow_id = f.account_id AND ga.status = 'delivered') AS hours_taught,
       (SELECT round(avg(r.rating)::numeric, 1) FROM reviews r WHERE r.fellow_id = f.account_id AND NOT r.hidden) AS rating,
       (SELECT count(*)::int FROM reviews r WHERE r.fellow_id = f.account_id AND NOT r.hidden) AS review_count,
       ARRAY(SELECT step FROM vetting_steps v WHERE v.fellow_id = f.account_id AND v.status = 'passed' AND v.step IN ('identity','background','academy','subject_test')) AS verified
FROM fellows f WHERE f.status = 'live';

-- A parent may review a Fellow only for their own attended booking in a batch that Fellow delivered.
CREATE OR REPLACE FUNCTION rk_can_review(p_booking uuid, p_fellow uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings b JOIN gigs g ON g.batch_id = b.batch_id JOIN gig_assignments ga ON ga.gig_id = g.id
    WHERE b.id = p_booking AND b.guardian_account_id = rk_account() AND b.status = 'attended' AND ga.fellow_id = p_fellow AND ga.status = 'delivered')
$$;
REVOKE ALL ON FUNCTION rk_can_review(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rk_can_review(uuid, uuid) TO rk_app;

-- ---------- Grants ----------
GRANT SELECT, INSERT, UPDATE ON fellows, vetting_steps, gig_assignments, help_requests, disputes, message_threads, reviews TO rk_app;
GRANT SELECT, INSERT ON academy_progress, terms_acceptances, messages, quality_reviews TO rk_app;
GRANT SELECT, INSERT, UPDATE ON gigs, earnings_lines, payouts, removal_cases TO rk_app;
GRANT SELECT, INSERT ON removal_responses TO rk_app;
GRANT SELECT ON terms_versions, rate_card, deductions, fellow_profiles TO rk_app;
GRANT UPDATE (educator_fellow_id) ON batches TO rk_app;
-- Assigning a Fellow to a class happens only in server tasks (accept, withdraw, suspend).
CREATE POLICY batches_assign ON batches FOR UPDATE USING (rk_system()) WITH CHECK (rk_system());
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rk_app;

-- ---------- Row-level security ----------
CREATE OR REPLACE FUNCTION rk_staff() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT rk_role() IN ('ops','safeguarding') OR rk_system() $$;

ALTER TABLE fellows ENABLE ROW LEVEL SECURITY;
CREATE POLICY fellows_self ON fellows USING (account_id = rk_account() OR rk_staff()) WITH CHECK (account_id = rk_account() OR rk_staff());
ALTER TABLE vetting_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY vetting_self ON vetting_steps USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_staff());   -- only server tasks/ops change steps
ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_self ON academy_progress USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_system());
ALTER TABLE terms_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY terms_read ON terms_versions FOR SELECT USING (true);
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY terms_acc_self ON terms_acceptances USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (fellow_id = rk_account() OR rk_system());
ALTER TABLE rate_card ENABLE ROW LEVEL SECURITY;
CREATE POLICY rate_read ON rate_card FOR SELECT USING (true);
ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ded_read ON deductions FOR SELECT USING (true);

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY gigs_read ON gigs FOR SELECT USING (rk_role() = 'fellow' OR rk_staff());
CREATE POLICY gigs_write ON gigs FOR INSERT WITH CHECK (rk_staff());
CREATE POLICY gigs_update ON gigs FOR UPDATE USING (rk_staff());
ALTER TABLE gig_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY assign_self ON gig_assignments USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_staff());   -- accept/decline goes through a locked server task
ALTER TABLE earnings_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY earn_self ON earnings_lines USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_system());
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_self ON payouts USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_system());

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY threads_party ON message_threads USING (guardian_account_id = rk_account() OR fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_system());
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- Blocked messages are visible to the sender (marked) and to staff, never to the other party.
CREATE POLICY messages_read ON messages FOR SELECT USING (
  rk_staff() OR (EXISTS (SELECT 1 FROM message_threads t WHERE t.id = thread_id AND (t.guardian_account_id = rk_account() OR t.fellow_id = rk_account()))
                 AND (NOT blocked OR sender_account_id = rk_account())));
CREATE POLICY messages_send ON messages FOR INSERT WITH CHECK (
  sender_account_id = rk_account() AND EXISTS (SELECT 1 FROM message_threads t WHERE t.id = thread_id AND (t.guardian_account_id = rk_account() OR t.fellow_id = rk_account())));

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_read ON reviews FOR SELECT USING (NOT hidden OR rk_staff() OR guardian_account_id = rk_account());
CREATE POLICY reviews_write ON reviews FOR INSERT WITH CHECK (guardian_account_id = rk_account() AND rk_can_review(booking_id, fellow_id));
CREATE POLICY reviews_moderate ON reviews FOR UPDATE USING (rk_staff());

ALTER TABLE quality_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY quality_rw ON quality_reviews USING (rk_staff() OR EXISTS (SELECT 1 FROM gig_assignments ga WHERE ga.id = assignment_id AND ga.fellow_id = rk_account())) WITH CHECK (rk_staff());
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY help_self ON help_requests USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (fellow_id = rk_account() OR rk_staff());
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY disputes_self ON disputes USING (raised_by = rk_account() OR rk_staff()) WITH CHECK (raised_by = rk_account() OR rk_staff());
ALTER TABLE removal_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY removal_rw ON removal_cases USING (fellow_id = rk_account() OR rk_staff()) WITH CHECK (rk_staff());
ALTER TABLE removal_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY removal_resp ON removal_responses USING (fellow_id = rk_account() OR rk_staff())
  WITH CHECK (fellow_id = rk_account() AND EXISTS (SELECT 1 FROM removal_cases c WHERE c.id = case_id AND c.fellow_id = rk_account()));

-- Fellows may change only their own availability fields. Status, tier, cap
-- and identity fields are staff-only.
CREATE OR REPLACE FUNCTION fellows_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Applies to the app's own connection; the owner role (migrations, admin) is trusted.
  IF current_user = 'rk_app' AND NOT rk_staff() AND (
       NEW.status IS DISTINCT FROM OLD.status OR NEW.tier IS DISTINCT FROM OLD.tier
    OR NEW.weekly_cap_hours IS DISTINCT FROM OLD.weekly_cap_hours OR NEW.went_live_at IS DISTINCT FROM OLD.went_live_at
    OR NEW.full_name IS DISTINCT FROM OLD.full_name OR NEW.display_name IS DISTINCT FROM OLD.display_name
    OR NEW.college IS DISTINCT FROM OLD.college OR NEW.age_confirmed_at IS DISTINCT FROM OLD.age_confirmed_at
    OR NEW.point_of_contact IS DISTINCT FROM OLD.point_of_contact OR NEW.city IS DISTINCT FROM OLD.city) THEN
    RAISE EXCEPTION 'only Robokalam staff can change this field' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER fellows_guard_trg BEFORE UPDATE ON fellows FOR EACH ROW EXECUTE FUNCTION fellows_guard();

-- Contact details in messages are blocked here as well as in app code.
CREATE OR REPLACE FUNCTION messages_block_contacts() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.body ~* '(\+?\d[\d\s().-]{7,}\d)|([[:alnum:]._%+-]+@[[:alnum:].-]+\.[a-z]{2,})|(https?://|www\.)|\m(whats ?app|wa\.me|insta(gram)?|snap(chat)?|telegram|t\.me|facebook|fb\.com|discord)\M|(^|\s)@[[:alnum:]_.]{3,}'
  THEN NEW.blocked := true; END IF;  -- never un-blocks what the app already blocked
  RETURN NEW;
END $$;
CREATE TRIGGER messages_block_trg BEFORE INSERT ON messages FOR EACH ROW EXECUTE FUNCTION messages_block_contacts();
