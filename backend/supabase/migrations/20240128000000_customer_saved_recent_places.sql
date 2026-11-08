-- Saved recent places (user-selected addresses from autocomplete)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS saved_recent_places JSONB NOT NULL DEFAULT '[]'::jsonb;
