-- UniMove Database Schema - Reviews & Ratings
-- Description: Review system, ratings, and feedback management

-- =====================================================
-- REVIEWS & RATINGS
-- =====================================================

-- Reviews (customer reviews for providers)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Overall rating
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    
    -- Detailed ratings
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
    
    -- Review content
    title TEXT,
    comment TEXT,
    
    -- Tags
    tags TEXT[], -- helpful, friendly, careful, fast, professional, etc.
    
    -- Media
    images TEXT[], -- Array of image URLs
    
    -- Status
    is_published BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
    
    -- Moderation
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    hidden_reason TEXT,
    moderated_by UUID REFERENCES profiles(id),
    moderated_at TIMESTAMPTZ,
    
    -- Provider response
    provider_response TEXT,
    provider_responded_at TIMESTAMPTZ,
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(review_id, user_id)
);

-- Provider reviews (customers reviewing providers - reverse)
CREATE TABLE provider_reviews_summary (
    provider_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Overall statistics
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Rating distribution
    rating_5_count INTEGER DEFAULT 0,
    rating_4_count INTEGER DEFAULT 0,
    rating_3_count INTEGER DEFAULT 0,
    rating_2_count INTEGER DEFAULT 0,
    rating_1_count INTEGER DEFAULT 0,
    
    -- Detailed ratings averages
    avg_service_quality DECIMAL(3,2) DEFAULT 0,
    avg_punctuality DECIMAL(3,2) DEFAULT 0,
    avg_professionalism DECIMAL(3,2) DEFAULT 0,
    avg_value_for_money DECIMAL(3,2) DEFAULT 0,
    
    -- Response rate
    response_count INTEGER DEFAULT 0,
    response_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer feedback (general feedback not tied to orders)
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Feedback type
    feedback_type TEXT NOT NULL, -- bug_report, feature_request, complaint, suggestion, praise
    category TEXT, -- app, service, payment, support, other
    
    -- Content
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Priority
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Status
    status TEXT DEFAULT 'new', -- new, in_progress, resolved, closed
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,
    
    -- Resolution
    resolution TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    
    -- Media
    attachments TEXT[], -- Array of file URLs
    
    -- Metadata
    device_info JSONB,
    app_version TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback responses (admin responses to feedback)
CREATE TABLE feedback_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    response TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal note vs customer-facing response
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disputes (order disputes and resolutions)
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Parties
    raised_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    raised_by_role user_role NOT NULL,
    against_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Dispute details
    dispute_type TEXT NOT NULL, -- payment, service_quality, damage, cancellation, other
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Evidence
    evidence_images TEXT[],
    evidence_documents TEXT[],
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
    priority TEXT DEFAULT 'normal',
    
    -- Resolution
    resolution TEXT,
    resolution_type TEXT, -- refund, partial_refund, no_action, provider_penalty, customer_penalty
    refund_amount DECIMAL(10,2),
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dispute messages (communication during dispute resolution)
CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    message TEXT NOT NULL,
    attachments TEXT[],
    is_internal BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report abuse (report inappropriate content or behavior)
CREATE TABLE abuse_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reporter
    reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Reported entity
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reported_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    
    -- Report details
    report_type TEXT NOT NULL, -- harassment, spam, inappropriate_content, fraud, other
    description TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, investigating, resolved, dismissed
    
    -- Resolution
    action_taken TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_provider ON reviews(provider_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_published ON reviews(is_published);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

CREATE INDEX idx_review_votes_review ON review_votes(review_id);
CREATE INDEX idx_review_votes_user ON review_votes(user_id);

CREATE INDEX idx_provider_reviews_summary_rating ON provider_reviews_summary(average_rating DESC);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(feedback_type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

CREATE INDEX idx_feedback_responses_feedback ON feedback_responses(feedback_id);
CREATE INDEX idx_feedback_responses_responder ON feedback_responses(responder_id);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created ON disputes(created_at DESC);

CREATE INDEX idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_sender ON dispute_messages(sender_id);

CREATE INDEX idx_abuse_reports_reported_by ON abuse_reports(reported_by);
CREATE INDEX idx_abuse_reports_reported_user ON abuse_reports(reported_user_id);
CREATE INDEX idx_abuse_reports_status ON abuse_reports(status);

-- Apply updated_at triggers
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_reviews_summary_updated_at BEFORE UPDATE ON provider_reviews_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abuse_reports_updated_at BEFORE UPDATE ON abuse_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update provider rating on new review
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_summary provider_reviews_summary%ROWTYPE;
BEGIN
    -- Get or create summary record
    INSERT INTO provider_reviews_summary (provider_id)
    VALUES (NEW.provider_id)
    ON CONFLICT (provider_id) DO NOTHING;
    
    -- Update summary statistics
    UPDATE provider_reviews_summary
    SET
        total_reviews = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND is_published = TRUE
        ),
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews 
            WHERE provider_id = NEW.provider_id AND is_published = TRUE
        ),
        rating_5_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND rating = 5 AND is_published = TRUE
        ),
        rating_4_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND rating = 4 AND is_published = TRUE
        ),
        rating_3_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND rating = 3 AND is_published = TRUE
        ),
        rating_2_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND rating = 2 AND is_published = TRUE
        ),
        rating_1_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND rating = 1 AND is_published = TRUE
        ),
        avg_service_quality = (
            SELECT ROUND(AVG(service_quality_rating)::numeric, 2) FROM reviews 
            WHERE provider_id = NEW.provider_id AND service_quality_rating IS NOT NULL AND is_published = TRUE
        ),
        avg_punctuality = (
            SELECT ROUND(AVG(punctuality_rating)::numeric, 2) FROM reviews 
            WHERE provider_id = NEW.provider_id AND punctuality_rating IS NOT NULL AND is_published = TRUE
        ),
        avg_professionalism = (
            SELECT ROUND(AVG(professionalism_rating)::numeric, 2) FROM reviews 
            WHERE provider_id = NEW.provider_id AND professionalism_rating IS NOT NULL AND is_published = TRUE
        ),
        avg_value_for_money = (
            SELECT ROUND(AVG(value_for_money_rating)::numeric, 2) FROM reviews 
            WHERE provider_id = NEW.provider_id AND value_for_money_rating IS NOT NULL AND is_published = TRUE
        ),
        response_count = (
            SELECT COUNT(*) FROM reviews 
            WHERE provider_id = NEW.provider_id AND provider_response IS NOT NULL AND is_published = TRUE
        ),
        updated_at = NOW()
    WHERE provider_id = NEW.provider_id;
    
    -- Update response rate
    UPDATE provider_reviews_summary
    SET response_rate = CASE 
        WHEN total_reviews > 0 THEN ROUND((response_count::DECIMAL / total_reviews * 100)::numeric, 2)
        ELSE 0
    END
    WHERE provider_id = NEW.provider_id;
    
    -- Update provider profile rating
    UPDATE profiles
    SET 
        rating = (SELECT average_rating FROM provider_reviews_summary WHERE provider_id = NEW.provider_id),
        total_reviews = (SELECT total_reviews FROM provider_reviews_summary WHERE provider_id = NEW.provider_id)
    WHERE id = NEW.provider_id AND role = 'provider';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    WHEN (NEW.is_published = TRUE)
    EXECUTE FUNCTION update_provider_rating();

-- Function to update review helpfulness counts
CREATE OR REPLACE FUNCTION update_review_helpfulness()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE reviews
    SET
        helpful_count = (
            SELECT COUNT(*) FROM review_votes 
            WHERE review_id = NEW.review_id AND is_helpful = TRUE
        ),
        not_helpful_count = (
            SELECT COUNT(*) FROM review_votes 
            WHERE review_id = NEW.review_id AND is_helpful = FALSE
        )
    WHERE id = NEW.review_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_helpfulness_trigger
    AFTER INSERT OR UPDATE OR DELETE ON review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpfulness();

-- Comments
COMMENT ON TABLE reviews IS 'Customer reviews and ratings for providers';
COMMENT ON TABLE review_votes IS 'Helpfulness votes for reviews';
COMMENT ON TABLE provider_reviews_summary IS 'Aggregated review statistics for providers';
COMMENT ON TABLE feedback IS 'General user feedback and suggestions';
COMMENT ON TABLE feedback_responses IS 'Admin responses to feedback';
COMMENT ON TABLE disputes IS 'Order disputes and resolution tracking';
COMMENT ON TABLE dispute_messages IS 'Communication during dispute resolution';
COMMENT ON TABLE abuse_reports IS 'Reports of inappropriate content or behavior';
