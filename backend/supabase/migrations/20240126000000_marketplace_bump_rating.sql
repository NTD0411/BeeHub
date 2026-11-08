-- Bump listing: thêm cột bumped_at để track lần đẩy gần nhất
ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMPTZ;

-- Rating: bảng đánh giá seller sau giao dịch
CREATE TABLE IF NOT EXISTS marketplace_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, buyer_id)
);

-- Notification types mới
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_interest';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_item_received';

-- RLS policies cho marketplace_ratings
ALTER TABLE marketplace_ratings ENABLE ROW LEVEL SECURITY;

-- Ai cũng đọc được rating (public)
DROP POLICY IF EXISTS "ratings_select_public" ON marketplace_ratings;
CREATE POLICY "ratings_select_public"
  ON marketplace_ratings FOR SELECT
  USING (true);

-- Chỉ backend (service_role) mới insert/update/delete được
DROP POLICY IF EXISTS "ratings_insert_service" ON marketplace_ratings;
CREATE POLICY "ratings_insert_service"
  ON marketplace_ratings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "ratings_delete_service" ON marketplace_ratings;
CREATE POLICY "ratings_delete_service"
  ON marketplace_ratings FOR DELETE
  USING (auth.role() = 'service_role');
