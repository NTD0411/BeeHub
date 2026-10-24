-- Migration: Pass đồ Marketplace — Listings
-- Batch 1: API-059 (browse), API-060 (my listings), API-062 (create listing)

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  category       TEXT NOT NULL,  -- furniture, electronics, clothes, books, other
  condition      TEXT NOT NULL,  -- new, like_new, good, fair, poor
  area           TEXT,           -- khu vực (e.g. Thủ Đức, Bình Thạnh)
  price          NUMERIC(12,0) NOT NULL DEFAULT 0,
  images         TEXT[] DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'active',  -- active, reserved, hidden, closed
  fee_paid       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_owner    ON marketplace_listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status   ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created  ON marketplace_listings(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_marketplace_listing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marketplace_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_listing_timestamp();

-- RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can browse active listings
CREATE POLICY "browse active listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = owner_id);

-- Only owner can insert
CREATE POLICY "owner can create listing"
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owner can update
CREATE POLICY "owner can update listing"
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = owner_id);

-- Only owner can delete
CREATE POLICY "owner can delete listing"
  ON marketplace_listings FOR DELETE
  USING (auth.uid() = owner_id);
