-- Contact-page enquiries, and the newsletter (adults only, double opt-in).

CREATE TABLE IF NOT EXISTS enquiries (
  id CHAR(36) PRIMARY KEY,
  ref VARCHAR(16) NOT NULL UNIQUE,
  topic VARCHAR(16) NOT NULL,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(160) NOT NULL,
  phone_e164 VARCHAR(16),
  organisation VARCHAR(120),
  message TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'open',
  answered_by CHAR(36),
  answered_at DATETIME(3),
  note VARCHAR(300),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX enquiries_status_idx (status, created_at),
  CONSTRAINT enquiries_topic CHECK (topic IN ('parent','school','kalamite','partner','media','careers','other')),
  CONSTRAINT enquiries_status CHECK (status IN ('open','answered','spam'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  status VARCHAR(12) NOT NULL DEFAULT 'pending',
  token CHAR(32) NOT NULL UNIQUE,
  source VARCHAR(40),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  confirmed_at DATETIME(3),
  unsubscribed_at DATETIME(3),
  CONSTRAINT newsletter_status CHECK (status IN ('pending','confirmed','unsubscribed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
