-- ============================================================
-- Migration: provider_slot_lock
-- Mục đích: Thêm cột slot_locked_until vào bảng orders
--
-- Logic nghiệp vụ:
--   - lock_expires_at  : lock TẠM 15 phút chờ customer cọc (khi matched)
--                        → xóa khi cọc xong hoặc hết 15 phút
--   - slot_locked_until: lock KHUNG GIỜ thật sự sau khi cọc xong
--                        = scheduled_pickup_time + 30 phút buffer
--                        → xóa ngay khi đơn completed hoặc cancelled
--
-- "First deposit wins": khi customer A cọc xong, hệ thống tự cancel
-- các đơn matched khác của cùng provider trong cùng khung giờ.
-- ============================================================

-- Thêm cột slot_locked_until vào bảng orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS slot_locked_until TIMESTAMPTZ DEFAULT NULL;

-- Index để background job / conflict check query nhanh
CREATE INDEX IF NOT EXISTS idx_orders_provider_slot_lock
  ON orders (provider_id, slot_locked_until)
  WHERE slot_locked_until IS NOT NULL;

-- Index bổ trợ: tìm đơn matched trùng giờ của provider (dùng trong cancelConflictingMatchedOrders)
CREATE INDEX IF NOT EXISTS idx_orders_provider_matched_pickup
  ON orders (provider_id, status, scheduled_pickup_time)
  WHERE status = 'matched' AND deposit_paid = false;

-- Comment mô tả cột
COMMENT ON COLUMN orders.slot_locked_until IS
  'Thời điểm kết thúc lock khung giờ của provider (= scheduled_pickup_time + 30 phút buffer). '
  'NULL = không lock. Tự động xóa khi đơn completed hoặc cancelled. '
  'Khác lock_expires_at (chỉ lock 15 phút chờ cọc khi status=matched).';
