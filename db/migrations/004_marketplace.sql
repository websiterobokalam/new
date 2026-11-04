-- Phase 5: open marketplace, behind a readiness gate.
-- Column and constraint changes to existing tables are applied by
-- scripts/migrate.mjs (guarded, re-runnable).

-- Agreed launch targets. Nothing counts as met until a person sets a target.
CREATE TABLE IF NOT EXISTS market_targets (
  metric VARCHAR(20) PRIMARY KEY,
  target DECIMAL(10,3) NOT NULL,
  set_by CHAR(36) NOT NULL,
  set_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  note VARCHAR(300),
  CONSTRAINT targets_metric CHECK (metric IN ('fill_rate','satisfaction','safety_rate','refund_rate','complaint_rate','min_sessions'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row: is the open marketplace switched on? A person opens it, and only when targets are met.
CREATE TABLE IF NOT EXISTS market_gate (
  id TINYINT PRIMARY KEY,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  changed_by CHAR(36),
  changed_at DATETIME(3),
  note VARCHAR(500),
  CONSTRAINT gate_single CHECK (id = 1),
  CONSTRAINT gate_reason CHECK (changed_by IS NULL OR note IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO market_gate (id, is_open) VALUES (1, FALSE);

CREATE TABLE IF NOT EXISTS cities (
  slug VARCHAR(60) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'waitlist',
  max_live INT NOT NULL DEFAULT 25,
  opened_by CHAR(36),
  opened_at DATETIME(3),
  CONSTRAINT cities_status CHECK (status IN ('pilot','open','waitlist')),
  CONSTRAINT cities_cap CHECK (max_live BETWEEN 1 AND 5000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Colleges we list by name only. No logos, no implied endorsement.
CREATE TABLE IF NOT EXISTS colleges (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  city_slug VARCHAR(60) NOT NULL,
  email_domain VARCHAR(100),
  created_by CHAR(36),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY colleges_name (name, city_slug),
  CONSTRAINT colleges_city FOREIGN KEY (city_slug) REFERENCES cities(slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fellow's Own Course: drafted by a Fellow, reviewed and approved first, online only.
CREATE TABLE IF NOT EXISTS course_drafts (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  title VARCHAR(120) NOT NULL,
  world VARCHAR(12) NOT NULL,
  age_min INT NOT NULL,
  age_max INT NOT NULL,
  outcome VARCHAR(400) NOT NULL,
  sessions INT NOT NULL,
  batch_size_max INT NOT NULL,
  kit VARCHAR(160),
  fee_paise INT NOT NULL,
  syllabus JSON NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'draft',
  review_note VARCHAR(1000),
  reviewed_by CHAR(36),
  reviewed_at DATETIME(3),
  course_id CHAR(36),
  submitted_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX drafts_fellow_idx (fellow_id),
  INDEX drafts_status_idx (status),
  CONSTRAINT drafts_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT drafts_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT drafts_world CHECK (world IN ('robotics','iot','ai','finlit','space','coding')),
  CONSTRAINT drafts_age CHECK (age_min BETWEEN 6 AND 18 AND age_max BETWEEN age_min AND 18),
  CONSTRAINT drafts_sessions CHECK (sessions BETWEEN 1 AND 24),
  -- Small online groups only: never a private 1:1 with a child.
  CONSTRAINT drafts_batch CHECK (batch_size_max BETWEEN 2 AND 8),
  CONSTRAINT drafts_fee CHECK (fee_paise BETWEEN 0 AND 5000000),
  CONSTRAINT drafts_status CHECK (status IN ('draft','submitted','changes','approved','rejected','published','withdrawn')),
  CONSTRAINT drafts_decided CHECK (status NOT IN ('changes','rejected','approved','published') OR (reviewed_by IS NOT NULL AND review_note IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automated systems that affect Fellows. 14 days' notice before any takes effect.
CREATE TABLE IF NOT EXISTS automated_systems (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  affects VARCHAR(500) NOT NULL,
  notice_at DATETIME(3) NOT NULL,
  effective_at DATETIME(3) NOT NULL,
  CONSTRAINT auto_notice CHECK (effective_at >= notice_at + INTERVAL 14 DAY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Flags raised by rules or AI. A flag is never a decision: a person decides, with a note.
CREATE TABLE IF NOT EXISTS quality_flags (
  id CHAR(36) PRIMARY KEY,
  system_id VARCHAR(40) NOT NULL,
  subject_type VARCHAR(12) NOT NULL,
  subject_id CHAR(36) NOT NULL,
  fellow_id CHAR(36),
  code VARCHAR(40) NOT NULL,
  severity VARCHAR(6) NOT NULL,
  message VARCHAR(500) NOT NULL,
  evidence VARCHAR(500),
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  decided_by CHAR(36),
  decided_at DATETIME(3),
  decision_note VARCHAR(1000),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX flags_subject_idx (subject_type, subject_id, code),
  INDEX flags_status_idx (status, severity),
  INDEX flags_fellow_idx (fellow_id),
  CONSTRAINT flags_system FOREIGN KEY (system_id) REFERENCES automated_systems(id),
  CONSTRAINT flags_subject CHECK (subject_type IN ('course_draft','fellow')),
  CONSTRAINT flags_severity CHECK (severity IN ('info','warn','high')),
  CONSTRAINT flags_status CHECK (status IN ('open','dismissed','actioned')),
  CONSTRAINT flags_human CHECK (status = 'open' OR (decided_by IS NOT NULL AND decision_note IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campus Ambassadors: live Fellows who help classmates apply. They recruit Fellows only, never families.
CREATE TABLE IF NOT EXISTS ambassadors (
  fellow_id CHAR(36) PRIMARY KEY,
  college_id CHAR(36) NOT NULL,
  code VARCHAR(12) NOT NULL,
  pitch VARCHAR(600) NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'applied',
  decided_by CHAR(36),
  decided_at DATETIME(3),
  decision_note VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY ambassadors_code (code),
  CONSTRAINT amb_fellow FOREIGN KEY (fellow_id) REFERENCES fellows(account_id),
  CONSTRAINT amb_college FOREIGN KEY (college_id) REFERENCES colleges(id),
  CONSTRAINT amb_status CHECK (status IN ('applied','active','declined','paused','ended')),
  CONSTRAINT amb_decided CHECK (status = 'applied' OR (decided_by IS NOT NULL AND decision_note IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ambassador_events (
  id CHAR(36) PRIMARY KEY,
  fellow_id CHAR(36) NOT NULL,
  title VARCHAR(120) NOT NULL,
  planned_at DATETIME(3) NOT NULL,
  venue VARCHAR(160) NOT NULL,
  status VARCHAR(9) NOT NULL DEFAULT 'proposed',
  attendees INT,
  decided_by CHAR(36),
  note VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ambev_fellow_idx (fellow_id),
  CONSTRAINT ambev_fellow FOREIGN KEY (fellow_id) REFERENCES ambassadors(fellow_id),
  CONSTRAINT ambev_status CHECK (status IN ('proposed','approved','declined','held')),
  CONSTRAINT ambev_attendees CHECK (attendees IS NULL OR attendees BETWEEN 0 AND 2000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
