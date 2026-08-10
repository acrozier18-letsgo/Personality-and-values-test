-- Selfscape profiles store (Cloudflare D1 / SQLite).
-- A "profile" is a saved answer set. Ownership is a lightweight model: the
-- client holds a secret owner_token and (optionally) associates profiles with an
-- email so a person can list their own saved profiles from any device.

CREATE TABLE IF NOT EXISTS profiles (
  id           TEXT PRIMARY KEY,      -- short public id used in share links
  owner_token  TEXT NOT NULL,         -- secret; required to update/delete
  email        TEXT,                  -- optional; lets a person list their profiles
  label        TEXT NOT NULL DEFAULT 'My profile',
  answers      TEXT NOT NULL,         -- JSON: { questionId: answer }
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
