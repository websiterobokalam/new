-- Phase 3: Kalam Fellows pilot (MySQL 8.0.16+ / MariaDB 10.6+).
-- Fair-work and child-safety rules that can be expressed as CHECK
-- constraints are enforced here; the rest is enforced in application code
-- (src/lib/fellows/*) and covered by tests.

CREATE TABLE IF NOT EXISTS fellows (
  account_id CHAR(36) PRIMARY KEY,
  full_name VARCHAR(80) NOT NULL,
  display_name VARCHAR(40) NOT NULL,
  college VARCHAR(120) NOT NULL,
  course VARCHAR(80) NOT NULL,
  year VARCHAR(10) NOT NULL,
  college_email VARCHAR(120),
  worlds JSON NOT NULL,
  languages JSON NOT NULL,
  hours_per_week INT NOT NULL,
  city VARCHAR(60) NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'applied',
  tier VARCHAR(12) NOT NULL DEFAULT 'apprentice',
  weekly_cap_hours INT NOT NULL DEFAULT 15,
  exam_mode_until DATE,
  point_of_contact VARCHAR(120),
  age_confirmed_at DATETIME(3) NOT NULL,
  went_live_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fellows_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fellows_name CHECK (CHAR_LENGTH(full_name) BETWEEN 2 AND 80),
  CONSTRAINT fellows_worlds CHECK (JSON_LENGTH(worlds) > 0),
  CONSTRAINT fellows_langs CHECK (JSON_LENGTH(languages) > 0),
  CONSTRAINT fellows_hours CHECK (hours_per_week BETWEEN 1 AND 40),
  CONSTRAINT fellows_status CHECK (status IN ('applied','vetting','live','paused','suspended','removed','waitlisted')),
  CONSTRAINT fellows_tier CHECK (tier IN ('apprentice','fellow','senior','lead')),
  CONSTRAINT fellows_cap CHECK (weekly_cap_hours BETWEEN 1 AND 40)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- batches.educator_fellow_id -> fellows is added by scripts/migrate.mjs (guarded, re-runnable).

CREATE TABLE IF NOT EXISTS vetting_steps (
  fellow_id CHAR(36) NOT NULL,
  step VARCHAR(16) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  detail JSON NOT NULL,
  reviewed_by CHAR(36),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (fellow_id, step),
  CONSTRAINT vetting_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT vetting_step CHECK (step IN ('subject_test','demo','identity','background','references','academy','terms','shadow','co_teach')),
  CONSTRAINT vetting_status CHECK (status IN ('pending','submitted','passed','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS academy_progress (
  fellow_id CHAR(36) NOT NULL,
  module_id VARCHAR(40) NOT NULL,
  score INT NOT NULL,
  completed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (fellow_id, module_id),
  CONSTRAINT academy_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14 days' notice before any change takes effect (the first version is exempt).
CREATE TABLE IF NOT EXISTS terms_versions (
  id VARCHAR(64) PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  language VARCHAR(2) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body JSON NOT NULL,
  sha256 CHAR(64) NOT NULL,
  initial BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  effective_at DATETIME(3) NOT NULL,
  CONSTRAINT terms_kind CHECK (kind IN ('fellow_terms','code_of_conduct')),
  CONSTRAINT terms_lang CHECK (language IN ('en','te','hi')),
  CONSTRAINT terms_notice CHECK (initial OR effective_at >= published_at + INTERVAL 14 DAY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS terms_acceptances (
  fellow_id CHAR(36) NOT NULL,
  terms_id VARCHAR(64) NOT NULL,
  accepted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (fellow_id, terms_id),
  CONSTRAINT acc_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT acc_terms FOREIGN KEY (terms_id) REFERENCES terms_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_card (
  gig_kind VARCHAR(20) PRIMARY KEY,
  per_session_paise INT NOT NULL,
  minutes INT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  sample BOOLEAN NOT NULL DEFAULT FALSE,
  effective_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT rate_positive CHECK (per_session_paise > 0 AND minutes > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS deductions (
  code VARCHAR(16) PRIMARY KEY,
  label VARCHAR(60) NOT NULL,
  percent DECIMAL(5,2) NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT ded_percent CHECK (percent >= 0 AND percent < 50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gigs (
  id CHAR(36) PRIMARY KEY,
  kind VARCHAR(20) NOT NULL,
  batch_id CHAR(36),
  title VARCHAR(160) NOT NULL,
  world VARCHAR(12) NOT NULL,
  language VARCHAR(2) NOT NULL DEFAULT 'en',
  starts_at DATETIME(3) NOT NULL,
  duration_min INT NOT NULL,
  mode VARCHAR(8) NOT NULL,
  location VARCHAR(200),
  responsible_adult VARCHAR(120),
  city VARCHAR(60) NOT NULL,
  pay_paise INT NOT NULL,
  rate_sample BOOLEAN NOT NULL DEFAULT FALSE,
  seats INT NOT NULL DEFAULT 1,
  min_tier VARCHAR(12) NOT NULL DEFAULT 'apprentice',
  lesson_plan TEXT,
  kit_list VARCHAR(1000),
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  created_by CHAR(36),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX gigs_open_idx (status, starts_at),
  CONSTRAINT gigs_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT gigs_kind CHECK (kind IN ('live_batch','campus_session','weekend_workshop','doubt_desk','project_mentor','build_session','shadow','co_teach')),
  CONSTRAINT gigs_duration CHECK (duration_min BETWEEN 15 AND 480),
  CONSTRAINT gigs_mode CHECK (mode IN ('online','offline')),
  CONSTRAINT gigs_pay CHECK (pay_paise > 0),
  CONSTRAINT gigs_seats CHECK (seats BETWEEN 1 AND 10),
  CONSTRAINT gigs_status CHECK (status IN ('open','filled','cancelled','completed')),
  -- In-person gigs only at a partner school or centre with a responsible adult present.
  CONSTRAINT gigs_in_person CHECK (mode = 'online' OR (location IS NOT NULL AND responsible_adult IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gig_assignments (
  id CHAR(36) PRIMARY KEY,
  gig_id CHAR(36) NOT NULL,
  fellow_id CHAR(36) NOT NULL,
  status VARCHAR(10) NOT NULL,
  responded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  delivered_at DATETIME(3),
  UNIQUE KEY assign_once (gig_id, fellow_id),
  INDEX assign_fellow_idx (fellow_id, status),
  CONSTRAINT assign_gig FOREIGN KEY (gig_id) REFERENCES gigs(id),
  CONSTRAINT assign_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT assign_status CHECK (status IN ('accepted','declined','withdrawn','delivered','no_show','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payouts (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  period_end DATE NOT NULL,
  gross_paise INT NOT NULL,
  deductions_paise INT NOT NULL,
  net_paise INT NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'pending',
  provider_ref VARCHAR(80),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  paid_at DATETIME(3),
  UNIQUE KEY payout_once (fellow_id, period_end),
  CONSTRAINT payout_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT payout_status CHECK (status IN ('pending','paid','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS earnings_lines (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  assignment_id CHAR(36),
  kind VARCHAR(12) NOT NULL,
  description VARCHAR(255) NOT NULL,
  gross_paise INT NOT NULL,
  deductions JSON NOT NULL,
  net_paise INT NOT NULL,
  earned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  payout_id CHAR(36),
  UNIQUE KEY earnings_once (fellow_id, kind, description),
  UNIQUE KEY one_line_per_assignment (assignment_id),
  CONSTRAINT earn_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT earn_assignment FOREIGN KEY (assignment_id) REFERENCES gig_assignments(id),
  CONSTRAINT earn_payout FOREIGN KEY (payout_id) REFERENCES payouts(id),
  CONSTRAINT earn_kind CHECK (kind IN ('session','training','demo','shadow','co_teach','adjustment'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_threads (
  id CHAR(36) PRIMARY KEY,
  batch_id CHAR(36) NOT NULL,
  guardian_account_id CHAR(36) NOT NULL,
  fellow_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY thread_once (batch_id, guardian_account_id, fellow_id),
  CONSTRAINT thread_batch FOREIGN KEY (batch_id) REFERENCES batches(id),
  CONSTRAINT thread_guardian FOREIGN KEY (guardian_account_id) REFERENCES accounts(id),
  CONSTRAINT thread_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  thread_id CHAR(36) NOT NULL,
  sender_account_id CHAR(36) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX messages_thread_idx (thread_id, id),
  CONSTRAINT msg_thread FOREIGN KEY (thread_id) REFERENCES message_threads(id),
  CONSTRAINT msg_sender FOREIGN KEY (sender_account_id) REFERENCES accounts(id),
  CONSTRAINT msg_body CHECK (CHAR_LENGTH(body) >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL UNIQUE,
  fellow_id CHAR(36) NOT NULL,
  guardian_account_id CHAR(36) NOT NULL,
  rating INT NOT NULL,
  body VARCHAR(600),
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT review_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT review_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quality_reviews (
  id CHAR(36) PRIMARY KEY,
  assignment_id CHAR(36) NOT NULL,
  reviewer_account_id CHAR(36) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  rubric JSON NOT NULL,
  notes VARCHAR(1000),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT quality_assignment FOREIGN KEY (assignment_id) REFERENCES gig_assignments(id),
  CONSTRAINT quality_kind CHECK (kind IN ('observation','recording_sample'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS help_requests (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  assignment_id CHAR(36),
  kind VARCHAR(10) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT help_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT help_kind CHECK (kind IN ('tech','kit','learner','safety','other')),
  CONSTRAINT help_status CHECK (status IN ('open','resolved'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS disputes (
  id CHAR(36) PRIMARY KEY,
  raised_by CHAR(36) NOT NULL,
  raised_role VARCHAR(8) NOT NULL,
  subject VARCHAR(10) NOT NULL,
  ref VARCHAR(100),
  details VARCHAR(2000) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  resolution VARCHAR(2000),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT dispute_by FOREIGN KEY (raised_by) REFERENCES accounts(id),
  CONSTRAINT dispute_role CHECK (raised_role IN ('fellow','parent')),
  CONSTRAINT dispute_subject CHECK (subject IN ('pay','gig','tier','removal','session','other')),
  CONSTRAINT dispute_details CHECK (CHAR_LENGTH(details) BETWEEN 10 AND 2000),
  CONSTRAINT dispute_status CHECK (status IN ('open','committee','resolved'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Removal: written reasons, an enquiry and 7 days' notice, unless a child's
-- safety requires immediate action.
CREATE TABLE IF NOT EXISTS removal_cases (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  reasons TEXT NOT NULL,
  child_safety BOOLEAN NOT NULL DEFAULT FALSE,
  opened_by CHAR(36) NOT NULL,
  opened_at DATETIME(3) NOT NULL,
  notice_until DATETIME(3) NOT NULL,
  enquiry_notes TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'notice',
  decided_at DATETIME(3),
  CONSTRAINT case_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT case_reasons CHECK (CHAR_LENGTH(reasons) >= 20),
  CONSTRAINT case_status CHECK (status IN ('notice','removed','reinstated')),
  CONSTRAINT case_notice CHECK (child_safety OR notice_until >= opened_at + INTERVAL 7 DAY),
  CONSTRAINT case_decision CHECK (status <> 'removed' OR (enquiry_notes IS NOT NULL AND (child_safety OR decided_at >= notice_until)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS removal_responses (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  fellow_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT resp_case FOREIGN KEY (case_id) REFERENCES removal_cases(id),
  CONSTRAINT resp_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
