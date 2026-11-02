-- Migration: Pass đồ — thêm cột usage_duration cho marketplace_listings

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS usage_duration TEXT;
