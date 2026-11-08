-- Thông báo khi admin xóa tin Pass đồ
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'marketplace_listing_deleted';
