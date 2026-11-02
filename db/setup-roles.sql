-- One-time setup on a managed Postgres (Supabase, RDS, DigitalOcean...).
-- Run as the admin user (Supabase: SQL Editor, which runs as "postgres").
-- Replace both passwords first. Safe to run twice.
--
--   rk_owner  runs migrations and owns the tables
--   rk_app    is what the website connects as. It does not own the tables,
--             so row-level security applies to every query it makes.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rk_owner') THEN
    CREATE ROLE rk_owner LOGIN PASSWORD 'CHANGE_ME_owner_password';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rk_app') THEN
    CREATE ROLE rk_app LOGIN PASSWORD 'CHANGE_ME_app_password' NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE, CREATE ON SCHEMA public TO rk_owner;
GRANT USAGE ON SCHEMA public TO rk_app;
-- Some providers need the admin to be a member of rk_owner to manage its objects later.
GRANT rk_owner TO CURRENT_USER;
