-- Run once in the NEW PostgreSQL database. No Supabase schema or auth tables needed.
-- Only the Next.js server uses the database role. Never expose DATABASE_URL to clients.
CREATE TABLE IF NOT EXISTS companion_cloud_saves (
  owner_id text NOT NULL,
  save_id text NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  save jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, save_id)
);
CREATE INDEX IF NOT EXISTS companion_cloud_saves_owner_updated
  ON companion_cloud_saves (owner_id, updated_at DESC);
