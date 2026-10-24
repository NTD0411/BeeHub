-- Migration: Pass đồ — Deal columns
-- Batch 4: API-069 (chốt đơn), API-070 (huỷ chốt), API-071 (đặt xe)

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS deal_confirmed      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmed_price     NUMERIC(12,0),
  ADD COLUMN IF NOT EXISTS confirmed_buyer_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transport_booked    BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_confirmed_buyer
  ON marketplace_listings(confirmed_buyer_id)
  WHERE confirmed_buyer_id IS NOT NULL;
