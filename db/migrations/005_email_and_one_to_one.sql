-- Email automation (outbox) and parent-supervised one-to-one classes.
-- Column and constraint changes to existing tables are applied by scripts/migrate.mjs (guarded).

-- Every email is written here in the same transaction as the action that caused it,
-- then sent by the drain loop with retries. Nothing is ever sent to a child.
CREATE TABLE IF NOT EXISTS email_outbox (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36),
  to_email VARCHAR(160) NOT NULL,
  template VARCHAR(40) NOT NULL,
  category VARCHAR(14) NOT NULL,
  payload JSON NOT NULL,
  dedupe_key VARCHAR(160) NOT NULL,
  status VARCHAR(8) NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  send_after DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  subject VARCHAR(200),
  body_text TEXT,
  provider_id VARCHAR(160),
  last_error VARCHAR(500),
  sent_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY outbox_dedupe (dedupe_key),
  INDEX outbox_due_idx (status, send_after),
  INDEX outbox_account_idx (account_id),
  CONSTRAINT outbox_category CHECK (category IN ('transactional','updates','oversight','staff')),
  CONSTRAINT outbox_status CHECK (status IN ('queued','sent','failed','skipped'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Email verification links: only a hash of the token is stored.
CREATE TABLE IF NOT EXISTS email_verifications (
  token_hash CHAR(64) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  email VARCHAR(160) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX ev_account_idx (account_id),
  CONSTRAINT ev_account FOREIGN KEY (account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A parent's acknowledgement of how one-to-one oversight works, per booking.
CREATE TABLE IF NOT EXISTS one_to_one_acks (
  booking_id CHAR(36) PRIMARY KEY,
  guardian_account_id CHAR(36) NOT NULL,
  learner_id CHAR(36) NOT NULL,
  text_sha256 CHAR(64) NOT NULL,
  acknowledged_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT ack_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT ack_guardian FOREIGN KEY (guardian_account_id) REFERENCES accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every enquiry from the three doors, stored first (then optionally forwarded to a CRM).
CREATE TABLE IF NOT EXISTS leads (
  id CHAR(36) PRIMARY KEY,
  ref VARCHAR(16) NOT NULL,
  door VARCHAR(8) NOT NULL,
  queue VARCHAR(32) NOT NULL,
  name VARCHAR(80) NOT NULL,
  phone_e164 VARCHAR(16) NOT NULL,
  email VARCHAR(160),
  data JSON NOT NULL,
  crm_status VARCHAR(10) NOT NULL DEFAULT 'none',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY leads_ref (ref),
  INDEX leads_created_idx (created_at),
  CONSTRAINT leads_door CHECK (door IN ('learner','school','educator')),
  CONSTRAINT leads_crm CHECK (crm_status IN ('none','sent','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
