-- Certificates Robokalam issues: course completion for learners, and the
-- Kalamite certificate (vetting, child-safety and POCSO training done).
-- Anyone can check a certificate by its code at /validate.
CREATE TABLE IF NOT EXISTS certificates (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(16) NOT NULL UNIQUE,
  kind VARCHAR(10) NOT NULL,
  holder_name VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  detail VARCHAR(300),
  learner_id CHAR(36),
  booking_id CHAR(36) UNIQUE,
  fellow_id CHAR(36),
  account_id CHAR(36) NOT NULL,
  issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  issued_by VARCHAR(60) NOT NULL,
  revoked_at DATETIME(3),
  revoke_reason VARCHAR(300),
  UNIQUE KEY certificates_fellow_once (fellow_id),
  INDEX certificates_account_idx (account_id),
  INDEX certificates_learner_idx (learner_id),
  CONSTRAINT certificates_kind CHECK (kind IN ('course','kalamite')),
  CONSTRAINT certificates_subject CHECK ((kind = 'course' AND learner_id IS NOT NULL AND booking_id IS NOT NULL) OR (kind = 'kalamite' AND fellow_id IS NOT NULL)),
  CONSTRAINT certificates_revoke CHECK (revoked_at IS NULL OR revoke_reason IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

