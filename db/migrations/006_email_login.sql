-- Email sign-in codes (sign-in by email is the default at every door; mobile is optional).
-- Only a keyed hash of the code is stored. Changes to the accounts table are in
-- scripts/migrate.mjs (guarded ALTERs): phone becomes optional, plus login_email,
-- disabled_at and created_by for logins that an admin creates.

CREATE TABLE IF NOT EXISTS email_otp_challenges (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX email_otp_idx (email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
