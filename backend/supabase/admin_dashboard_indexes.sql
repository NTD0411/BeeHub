-- Admin Dashboard Performance Indexes
-- Run this on Supabase SQL Editor for better dashboard performance

-- Orders indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_completed_at_status ON orders(completed_at, status) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);

-- Provider profiles indexes
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verification ON provider_profiles(verification_status, is_verified);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_available ON provider_profiles(is_available, is_verified);

-- Provider earnings indexes
CREATE INDEX IF NOT EXISTS idx_provider_earnings_created_commission ON provider_earnings(created_at, platform_commission);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_status_created ON disputes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_priority_status ON disputes(priority, status);

-- Payments indexes for revenue calculation
CREATE INDEX IF NOT EXISTS idx_payments_status_paid_at ON payments(status, paid_at) WHERE status = 'completed';

-- Profiles indexes for user counts
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON profiles(role, created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON profiles(role, status);

-- Provider withdrawals indexes
CREATE INDEX IF NOT EXISTS idx_provider_withdrawals_status_requested ON provider_withdrawals(status, requested_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Comments
COMMENT ON INDEX idx_orders_created_at_desc IS 'Dashboard: New orders 24h query';
COMMENT ON INDEX idx_orders_completed_at_status IS 'Dashboard: GMV yesterday calculation';
COMMENT ON INDEX idx_provider_profiles_verification IS 'Dashboard: Pending verifications count';
COMMENT ON INDEX idx_provider_earnings_created_commission IS 'Dashboard: Commission total calculation';
COMMENT ON INDEX idx_disputes_status_created IS 'Dashboard: Pending disputes count';