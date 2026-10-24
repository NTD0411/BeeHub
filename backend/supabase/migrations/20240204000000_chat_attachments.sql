-- Chat attachments for marketplace messages
ALTER TABLE marketplace_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_size INTEGER,
  ADD COLUMN IF NOT EXISTS media_name TEXT;
