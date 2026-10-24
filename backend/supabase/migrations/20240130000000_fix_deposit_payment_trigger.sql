-- Fix: deposit completed fails because create_provider_earnings updates profiles.total_earnings
-- (column moved to provider_profiles). Deposits are escrow — do not credit provider yet.

CREATE OR REPLACE FUNCTION create_provider_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_commission_rate DECIMAL(5,2) := 15.00;
    v_commission_amount DECIMAL(12,2);
    v_net_earnings DECIMAL(12,2);
BEGIN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
        -- Cọc giữ escrow — chỉ ghi nhận thu nhập khi thanh toán đủ / release
        IF COALESCE(NEW.payment_purpose, 'deposit') = 'deposit' THEN
            RETURN NEW;
        END IF;

        SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;

        IF v_order.provider_id IS NOT NULL THEN
            v_commission_amount := NEW.amount * (v_commission_rate / 100);
            v_net_earnings := NEW.amount - v_commission_amount;

            INSERT INTO provider_earnings (
                provider_id, order_id, payment_id,
                order_amount, platform_commission, net_earnings,
                commission_rate, status
            ) VALUES (
                v_order.provider_id, NEW.order_id, NEW.id,
                NEW.amount, v_commission_amount, v_net_earnings,
                v_commission_rate, 'available'
            );

            UPDATE provider_profiles
            SET total_earnings = COALESCE(total_earnings, 0) + v_net_earnings
            WHERE id = v_order.provider_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
