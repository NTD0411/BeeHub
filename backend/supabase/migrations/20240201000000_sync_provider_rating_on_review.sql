-- Đồng bộ rating vào provider_profiles khi có review mới (bảng API đọc)
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO provider_reviews_summary (provider_id)
    VALUES (NEW.provider_id)
    ON CONFLICT (provider_id) DO NOTHING;

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

    UPDATE provider_reviews_summary
    SET response_rate = CASE
        WHEN total_reviews > 0 THEN ROUND((response_count::DECIMAL / total_reviews * 100)::numeric, 2)
        ELSE 0
    END
    WHERE provider_id = NEW.provider_id;

    -- profiles (legacy)
    UPDATE profiles
    SET
        rating = (SELECT average_rating FROM provider_reviews_summary WHERE provider_id = NEW.provider_id),
        total_reviews = (SELECT total_reviews FROM provider_reviews_summary WHERE provider_id = NEW.provider_id)
    WHERE id = NEW.provider_id AND role = 'provider';

    -- provider_profiles (API đọc từ đây)
    UPDATE provider_profiles
    SET
        rating = (SELECT average_rating FROM provider_reviews_summary WHERE provider_id = NEW.provider_id),
        total_reviews = (SELECT total_reviews FROM provider_reviews_summary WHERE provider_id = NEW.provider_id),
        updated_at = NOW()
    WHERE id = NEW.provider_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
