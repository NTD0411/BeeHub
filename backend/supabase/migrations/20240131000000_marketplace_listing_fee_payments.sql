-- Cho phép thanh toán phí đăng tin marketplace qua PayOS (không gắn order)

ALTER TABLE payments
  ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS marketplace_listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_marketplace_listing
  ON payments(marketplace_listing_id)
  WHERE marketplace_listing_id IS NOT NULL;
