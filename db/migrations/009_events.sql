-- Events: Code Week, camps, workshops, science fairs, webinars, teacher training.
-- Learner events are registered by a signed-in parent for children already on
-- their account (with consent). Adult events are registered by the adult.
CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(90) NOT NULL UNIQUE,
  title VARCHAR(140) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  audience VARCHAR(10) NOT NULL,
  summary VARCHAR(300) NOT NULL,
  description TEXT,
  starts_at DATETIME(3) NOT NULL,
  duration_min INT NOT NULL,
  mode VARCHAR(10) NOT NULL,
  venue VARCHAR(200),
  responsible_adult VARCHAR(120),
  city VARCHAR(60),
  capacity INT NOT NULL,
  age_min INT,
  age_max INT,
  status VARCHAR(10) NOT NULL DEFAULT 'draft',
  cancel_reason VARCHAR(300),
  created_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX events_upcoming_idx (status, starts_at),
  CONSTRAINT events_kind CHECK (kind IN ('code_week','workshop','camp','science_fair','webinar','teacher_training','open_day','other')),
  CONSTRAINT events_audience CHECK (audience IN ('learners','adults')),
  CONSTRAINT events_mode CHECK (mode IN ('online','in_person')),
  CONSTRAINT events_status CHECK (status IN ('draft','published','cancelled')),
  CONSTRAINT events_capacity CHECK (capacity BETWEEN 1 AND 5000),
  CONSTRAINT events_duration CHECK (duration_min BETWEEN 15 AND 10080),
  -- In person: a venue, and for children a named responsible adult at a school or centre.
  CONSTRAINT events_in_person CHECK (mode <> 'in_person' OR (venue IS NOT NULL AND (audience <> 'learners' OR responsible_adult IS NOT NULL))),
  CONSTRAINT events_ages CHECK (audience <> 'learners' OR age_min IS NOT NULL),
  CONSTRAINT events_cancel CHECK (status <> 'cancelled' OR cancel_reason IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS event_registrations (
  id CHAR(36) PRIMARY KEY,
  event_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  learner_id CHAR(36),
  -- The learner's id, or 'self' for an adult registering themselves: one registration each.
  who VARCHAR(36) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'registered',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  cancelled_at DATETIME(3),
  UNIQUE KEY event_reg_once (event_id, account_id, who),
  INDEX event_reg_account_idx (account_id),
  CONSTRAINT event_reg_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT event_reg_status CHECK (status IN ('registered','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
