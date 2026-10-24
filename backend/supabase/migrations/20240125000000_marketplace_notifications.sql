-- Migration: thêm notification types cho marketplace

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_deal_confirmed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_deal_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_transport_booked';

-- Thêm cột listing_id để deep-link vào đúng tin đăng
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL;
