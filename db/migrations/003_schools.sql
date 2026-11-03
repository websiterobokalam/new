-- Phase 4: schools, trainers, labs, hardware tickets, Fellow bookings by schools.
-- Student data stays in 21cschool (ERP) and AADHYA. Here we keep only counts.

CREATE TABLE IF NOT EXISTS schools (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(60) NOT NULL,
  board VARCHAR(20),
  -- The hardware replacement window in this school's signed contract.
  sla_hours INT NOT NULL DEFAULT 72,
  aadhya_tenant VARCHAR(80),
  erp_school_ref VARCHAR(80),
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  created_by CHAR(36),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT schools_sla CHECK (sla_hours BETWEEN 4 AND 720),
  CONSTRAINT schools_status CHECK (status IN ('active','paused','ended'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS school_staff (
  account_id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  role VARCHAR(12) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  added_by CHAR(36),
  added_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  removed_at DATETIME(3),
  INDEX staff_school_idx (school_id),
  CONSTRAINT staff_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT staff_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT staff_role CHECK (role IN ('school_admin','trainer'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS labs (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,
  room VARCHAR(80),
  installed_on DATE,
  status VARCHAR(8) NOT NULL DEFAULT 'live',
  INDEX labs_school_idx (school_id),
  CONSTRAINT labs_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT labs_status CHECK (status IN ('planned','live','paused'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_assets (
  id CHAR(36) PRIMARY KEY,
  lab_id CHAR(36) NOT NULL,
  kind VARCHAR(10) NOT NULL,
  label VARCHAR(120) NOT NULL,
  serial VARCHAR(80),
  status VARCHAR(10) NOT NULL DEFAULT 'working',
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX assets_lab_idx (lab_id),
  CONSTRAINT assets_lab FOREIGN KEY (lab_id) REFERENCES labs(id),
  CONSTRAINT assets_kind CHECK (kind IN ('kit','device','robot','sensor','display','network','furniture','other')),
  CONSTRAINT assets_status CHECK (status IN ('working','faulty','in_repair','retired'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The weekly timetable. Times are Asia/Kolkata wall-clock.
CREATE TABLE IF NOT EXISTS school_classes (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  lab_id CHAR(36) NOT NULL,
  label VARCHAR(40) NOT NULL,
  grade TINYINT NOT NULL,
  world VARCHAR(12) NOT NULL,
  weekday TINYINT NOT NULL,
  start_time TIME NOT NULL,
  duration_min INT NOT NULL,
  students INT NOT NULL,
  trainer_account_id CHAR(36),
  erp_class_ref VARCHAR(80),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX classes_school_idx (school_id, active),
  INDEX classes_trainer_idx (trainer_account_id),
  CONSTRAINT classes_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT classes_lab FOREIGN KEY (lab_id) REFERENCES labs(id),
  CONSTRAINT classes_trainer FOREIGN KEY (trainer_account_id) REFERENCES accounts(id),
  CONSTRAINT classes_grade CHECK (grade BETWEEN 1 AND 12),
  CONSTRAINT classes_world CHECK (world IN ('robotics','iot','ai','finlit','space','coding')),
  CONSTRAINT classes_weekday CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT classes_duration CHECK (duration_min BETWEEN 15 AND 240),
  CONSTRAINT classes_students CHECK (students BETWEEN 1 AND 80)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per class per date. Attendance is a count; names live in 21cschool.
CREATE TABLE IF NOT EXISTS class_sessions (
  id CHAR(36) PRIMARY KEY,
  class_id CHAR(36) NOT NULL,
  starts_at DATETIME(3) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'planned',
  lesson_title VARCHAR(160),
  lesson_plan TEXT,
  present INT,
  total INT,
  erp_receipt VARCHAR(80),
  notes VARCHAR(500),
  recorded_by CHAR(36),
  recorded_at DATETIME(3),
  UNIQUE KEY session_once (class_id, starts_at),
  CONSTRAINT session_class FOREIGN KEY (class_id) REFERENCES school_classes(id),
  CONSTRAINT session_status CHECK (status IN ('planned','held','cancelled')),
  CONSTRAINT session_counts CHECK (present IS NULL OR (total IS NOT NULL AND present BETWEEN 0 AND total))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hardware_tickets (
  id CHAR(36) PRIMARY KEY,
  ref VARCHAR(16) NOT NULL,
  school_id CHAR(36) NOT NULL,
  lab_id CHAR(36) NOT NULL,
  asset_id CHAR(36),
  raised_by CHAR(36) NOT NULL,
  category VARCHAR(12) NOT NULL,
  summary VARCHAR(160) NOT NULL,
  details VARCHAR(1000),
  status VARCHAR(12) NOT NULL DEFAULT 'open',
  sla_hours INT NOT NULL,
  raised_at DATETIME(3) NOT NULL,
  due_at DATETIME(3) NOT NULL,
  acknowledged_at DATETIME(3),
  resolved_at DATETIME(3),
  resolution VARCHAR(500),
  UNIQUE KEY tickets_ref (ref),
  INDEX tickets_school_idx (school_id, status),
  INDEX tickets_open_idx (status, due_at),
  CONSTRAINT tickets_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT tickets_lab FOREIGN KEY (lab_id) REFERENCES labs(id),
  CONSTRAINT tickets_asset FOREIGN KEY (asset_id) REFERENCES lab_assets(id),
  CONSTRAINT tickets_raiser FOREIGN KEY (raised_by) REFERENCES accounts(id),
  CONSTRAINT tickets_category CHECK (category IN ('kit_missing','device','robot','sensor','network','furniture','other')),
  CONSTRAINT tickets_status CHECK (status IN ('open','acknowledged','dispatched','resolved','closed')),
  -- The clock is fixed when the ticket is raised and can't be stretched later.
  CONSTRAINT tickets_clock CHECK (due_at = raised_at + INTERVAL sla_hours HOUR),
  CONSTRAINT tickets_resolved CHECK ((status IN ('resolved','closed')) = (resolved_at IS NOT NULL AND resolution IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hardware_ticket_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ticket_id CHAR(36) NOT NULL,
  actor_account_id CHAR(36) NOT NULL,
  status VARCHAR(12) NOT NULL,
  note VARCHAR(500),
  at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX tev_ticket_idx (ticket_id),
  CONSTRAINT tev_ticket FOREIGN KEY (ticket_id) REFERENCES hardware_tickets(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A school asks for a Kalam Fellow. Ops turns it into a Campus Session gig.
CREATE TABLE IF NOT EXISTS fellow_requests (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  lab_id CHAR(36) NOT NULL,
  world VARCHAR(12) NOT NULL,
  language VARCHAR(2) NOT NULL DEFAULT 'en',
  starts_at DATETIME(3) NOT NULL,
  duration_min INT NOT NULL,
  grade_band VARCHAR(20) NOT NULL,
  students INT NOT NULL,
  responsible_staff_id CHAR(36) NOT NULL,
  notes VARCHAR(1000),
  status VARCHAR(10) NOT NULL DEFAULT 'requested',
  gig_id CHAR(36),
  requested_by CHAR(36) NOT NULL,
  decided_by CHAR(36),
  decision_note VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX freq_school_idx (school_id, starts_at),
  INDEX freq_status_idx (status),
  CONSTRAINT freq_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT freq_lab FOREIGN KEY (lab_id) REFERENCES labs(id),
  CONSTRAINT freq_staff FOREIGN KEY (responsible_staff_id) REFERENCES school_staff(account_id),
  CONSTRAINT freq_gig FOREIGN KEY (gig_id) REFERENCES gigs(id),
  CONSTRAINT freq_world CHECK (world IN ('robotics','iot','ai','finlit','space','coding')),
  CONSTRAINT freq_duration CHECK (duration_min BETWEEN 30 AND 240),
  CONSTRAINT freq_students CHECK (students BETWEEN 1 AND 80),
  CONSTRAINT freq_status CHECK (status IN ('requested','scheduled','declined','cancelled')),
  CONSTRAINT freq_scheduled CHECK (status <> 'scheduled' OR gig_id IS NOT NULL),
  CONSTRAINT freq_declined CHECK (status <> 'declined' OR decision_note IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO counters (name, value) VALUES ('hw_ticket', 0);
