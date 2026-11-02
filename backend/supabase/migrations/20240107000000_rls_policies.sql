-- UniMove Database Schema - Row Level Security (RLS) Policies
-- Description: Security policies to protect data access

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Users & Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Tracking & Location
ALTER TABLE provider_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE distance_matrix ENABLE ROW LEVEL SECURITY;

-- Chat & Notifications
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Reviews & Ratings
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_reviews_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE abuse_reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is customer
CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'customer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is provider
CREATE OR REPLACE FUNCTION is_provider()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'provider'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES RLS POLICIES
-- =====================================================

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Provider documents
CREATE POLICY "Provider documents viewable by owner and admins"
    ON provider_documents FOR SELECT
    USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Providers can insert own documents"
    ON provider_documents FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own documents"
    ON provider_documents FOR UPDATE
    USING (auth.uid() = provider_id);

CREATE POLICY "Admins can update any provider documents"
    ON provider_documents FOR UPDATE
    USING (is_admin());

-- =====================================================
-- ORDERS RLS POLICIES
-- =====================================================

-- Orders: Customers see their orders, providers see assigned orders, admins see all
CREATE POLICY "Customers can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Providers can view assigned orders"
    ON orders FOR SELECT
    USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Providers can view pending orders in their area"
    ON orders FOR SELECT
    USING (
        status IN ('pending', 'matched') AND 
        is_provider() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'provider' AND is_verified = TRUE AND is_available = TRUE
        )
    );

CREATE POLICY "Customers can create orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id AND is_customer());

CREATE POLICY "Customers can update own pending orders"
    ON orders FOR UPDATE
    USING (auth.uid() = customer_id AND status = 'pending');

CREATE POLICY "Providers can update assigned orders"
    ON orders FOR UPDATE
    USING (auth.uid() = provider_id AND is_provider());

CREATE POLICY "Admins can update any order"
    ON orders FOR UPDATE
    USING (is_admin());

-- Order status history
CREATE POLICY "Order status history viewable by order participants"
    ON order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id AND (customer_id = auth.uid() OR provider_id = auth.uid())
        ) OR is_admin()
    );

-- =====================================================
-- PAYMENTS RLS POLICIES
-- =====================================================

-- Payments
CREATE POLICY "Payments viewable by customer and admin"
    ON payments FOR SELECT
    USING (auth.uid() = customer_id OR is_admin());

CREATE POLICY "Customers can create payments"
    ON payments FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "System can update payments"
    ON payments FOR UPDATE
    USING (is_admin());

-- Provider earnings
CREATE POLICY "Providers can view own earnings"
    ON provider_earnings FOR SELECT
    USING (auth.uid() = provider_id OR is_admin());

-- Provider withdrawals
CREATE POLICY "Providers can view own withdrawals"
    ON provider_withdrawals FOR SELECT
    USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Providers can create withdrawal requests"
    ON provider_withdrawals FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Admins can update withdrawals"
    ON provider_withdrawals FOR UPDATE
    USING (is_admin());

-- Wallets
CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create own wallet"
    ON wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Wallet transactions
CREATE POLICY "Users can view own wallet transactions"
    ON wallet_transactions FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM wallets WHERE id = wallet_id AND user_id = auth.uid()) OR
        is_admin()
    );

-- Promotions
CREATE POLICY "Everyone can view active promotions"
    ON promotions FOR SELECT
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins can manage promotions"
    ON promotions FOR ALL
    USING (is_admin());

-- Promotion usage
CREATE POLICY "Users can view own promotion usage"
    ON promotion_usage FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

-- =====================================================
-- TRACKING & LOCATION RLS POLICIES
-- =====================================================

-- Provider locations
CREATE POLICY "Provider locations viewable by customers with active orders"
    ON provider_locations FOR SELECT
    USING (
        auth.uid() = provider_id OR
        EXISTS (
            SELECT 1 FROM orders
            WHERE provider_id = provider_locations.provider_id 
            AND customer_id = auth.uid()
            AND status IN ('accepted', 'picking_up', 'picked_up', 'in_progress', 'delivering')
        ) OR
        is_admin()
    );

CREATE POLICY "Providers can insert own location"
    ON provider_locations FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own location"
    ON provider_locations FOR UPDATE
    USING (auth.uid() = provider_id);

-- Order tracking events
CREATE POLICY "Order tracking viewable by order participants"
    ON order_tracking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id AND (customer_id = auth.uid() OR provider_id = auth.uid())
        ) OR is_admin()
    );

CREATE POLICY "Providers can create tracking events"
    ON order_tracking_events FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

-- Distance matrix (public read for performance)
CREATE POLICY "Distance matrix readable by authenticated users"
    ON distance_matrix FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- CHAT & NOTIFICATIONS RLS POLICIES
-- =====================================================

-- Conversations
CREATE POLICY "Conversation participants can view"
    ON conversations FOR SELECT
    USING (auth.uid() = customer_id OR auth.uid() = provider_id OR is_admin());

CREATE POLICY "System can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "Participants can update conversation"
    ON conversations FOR UPDATE
    USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Messages
CREATE POLICY "Conversation participants can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id AND (customer_id = auth.uid() OR provider_id = auth.uid())
        ) OR is_admin()
    );

CREATE POLICY "Conversation participants can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id AND (customer_id = auth.uid() OR provider_id = auth.uid())
        )
    );

CREATE POLICY "Senders can update own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Push tokens
CREATE POLICY "Users can manage own push tokens"
    ON push_tokens FOR ALL
    USING (auth.uid() = user_id);

-- Notification preferences
CREATE POLICY "Users can manage own notification preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id);

-- Notification templates (public read for all authenticated users)
CREATE POLICY "Authenticated users can view notification templates"
    ON notification_templates FOR SELECT
    USING (auth.role() = 'authenticated' OR is_active = TRUE);

CREATE POLICY "Admins can manage notification templates"
    ON notification_templates FOR ALL
    USING (is_admin());

-- Announcements
CREATE POLICY "Everyone can view published announcements"
    ON announcements FOR SELECT
    USING (is_published = TRUE OR is_admin());

CREATE POLICY "Admins can manage announcements"
    ON announcements FOR ALL
    USING (is_admin());

-- =====================================================
-- REVIEWS & RATINGS RLS POLICIES
-- =====================================================

-- Reviews
CREATE POLICY "Published reviews viewable by everyone"
    ON reviews FOR SELECT
    USING (is_published = TRUE AND is_hidden = FALSE OR auth.uid() = customer_id OR is_admin());

CREATE POLICY "Customers can create reviews for completed orders"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id AND
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = order_id AND customer_id = auth.uid() AND status = 'completed'
        )
    );

CREATE POLICY "Customers can update own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = customer_id);

CREATE POLICY "Providers can respond to reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = provider_id);

CREATE POLICY "Admins can moderate reviews"
    ON reviews FOR UPDATE
    USING (is_admin());

-- Review votes
CREATE POLICY "Users can vote on reviews"
    ON review_votes FOR ALL
    USING (auth.role() = 'authenticated');

-- Provider reviews summary
CREATE POLICY "Everyone can view provider review summaries"
    ON provider_reviews_summary FOR SELECT
    USING (true);

-- Feedback
CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage feedback"
    ON feedback FOR ALL
    USING (is_admin());

-- Disputes
CREATE POLICY "Dispute participants can view"
    ON disputes FOR SELECT
    USING (
        auth.uid() = raised_by OR
        auth.uid() = against_user_id OR
        EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (customer_id = auth.uid() OR provider_id = auth.uid())) OR
        is_admin()
    );

CREATE POLICY "Users can create disputes for their orders"
    ON disputes FOR INSERT
    WITH CHECK (
        auth.uid() = raised_by AND
        EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (customer_id = auth.uid() OR provider_id = auth.uid()))
    );

CREATE POLICY "Admins can manage disputes"
    ON disputes FOR ALL
    USING (is_admin());

-- Dispute messages
CREATE POLICY "Dispute participants can view messages"
    ON dispute_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM disputes
            WHERE id = dispute_id AND (raised_by = auth.uid() OR against_user_id = auth.uid())
        ) OR is_admin()
    );

CREATE POLICY "Dispute participants can send messages"
    ON dispute_messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM disputes
            WHERE id = dispute_id AND (raised_by = auth.uid() OR against_user_id = auth.uid())
        )
    );

-- Abuse reports
CREATE POLICY "Users can view own reports"
    ON abuse_reports FOR SELECT
    USING (auth.uid() = reported_by OR is_admin());

CREATE POLICY "Users can create abuse reports"
    ON abuse_reports FOR INSERT
    WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Admins can manage abuse reports"
    ON abuse_reports FOR ALL
    USING (is_admin());

-- Comments
COMMENT ON FUNCTION is_admin IS 'Check if current user is an admin';
COMMENT ON FUNCTION is_customer IS 'Check if current user is a customer';
COMMENT ON FUNCTION is_provider IS 'Check if current user is a provider';
COMMENT ON FUNCTION get_user_role IS 'Get current user role';
