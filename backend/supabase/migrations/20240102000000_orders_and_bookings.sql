-- UniMove Database Schema - Orders & Bookings
-- Description: Order management and service requests
-- Optimized: Merged order_items into orders (JSONB), removed provider_bids (overkill for MVP)

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE order_status AS ENUM (
    'pending',        -- Chờ tìm provider
    'accepted',       -- Provider đã chấp nhận
    'picking_up',     -- Đang đến lấy hàng
    'in_progress',    -- Đang vận chuyển
    'completed',      -- Hoàn thành
    'cancelled',      -- Đã hủy
    'disputed'        -- Có tranh chấp
);

CREATE TYPE service_type AS ENUM (
    'standard',       -- Tiêu chuẩn
    'express',        -- Nhanh
    'premium'         -- Cao cấp (có bảo hiểm)
);

CREATE TYPE vehicle_size AS ENUM (
    'motorbike',      -- Xe máy (< 50kg)
    'small_truck',    -- Xe tải nhỏ (< 500kg)
    'medium_truck',   -- Xe tải trung (< 1000kg)
    'large_truck'     -- Xe tải lớn (> 1000kg)
);

-- =====================================================
-- ORDERS
-- =====================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    provider_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,

    -- Service details
    service_type service_type NOT NULL DEFAULT 'standard',
    vehicle_size vehicle_size NOT NULL,

    -- Pickup location
    pickup_address TEXT NOT NULL,
    pickup_city TEXT NOT NULL,
    pickup_district TEXT NOT NULL,
    pickup_ward TEXT,
    pickup_latitude DECIMAL(10,8),
    pickup_longitude DECIMAL(11,8),
    pickup_floor INTEGER DEFAULT 1,
    pickup_has_elevator BOOLEAN DEFAULT FALSE,
    pickup_contact_name TEXT NOT NULL,
    pickup_contact_phone TEXT NOT NULL,
    pickup_notes TEXT,

    -- Delivery location
    delivery_address TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_district TEXT NOT NULL,
    delivery_ward TEXT,
    delivery_latitude DECIMAL(10,8),
    delivery_longitude DECIMAL(11,8),
    delivery_floor INTEGER DEFAULT 1,
    delivery_has_elevator BOOLEAN DEFAULT FALSE,
    delivery_contact_name TEXT NOT NULL,
    delivery_contact_phone TEXT NOT NULL,
    delivery_notes TEXT,

    -- Pricing
    estimated_distance DECIMAL(10,2),
    base_price DECIMAL(10,2) NOT NULL,
    distance_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    floor_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    service_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,

    -- Timing
    scheduled_pickup_time TIMESTAMPTZ,
    actual_pickup_time TIMESTAMPTZ,
    actual_delivery_time TIMESTAMPTZ,

    -- Status
    status order_status NOT NULL DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,

    -- Items (JSONB replaces order_items table for simple cases)
    -- Format: [{"name": "Tủ lạnh", "qty": 1, "weight_kg": 50, "fragile": true, "image_url": "..."}]
    items JSONB,
    items_description TEXT,
    estimated_weight DECIMAL(10,2),
    has_fragile_items BOOLEAN DEFAULT FALSE,
    requires_helpers BOOLEAN DEFAULT FALSE,
    number_of_helpers INTEGER DEFAULT 0,

    -- Additional services
    has_insurance BOOLEAN DEFAULT FALSE,
    insurance_value DECIMAL(12,2),
    has_packing_service BOOLEAN DEFAULT FALSE,

    -- Images (JSONB replaces order_images table)
    -- Format: [{"url": "...", "type": "pickup_items|completion", "uploaded_by": "uuid"}]
    images JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT valid_pickup_coords CHECK (
        (pickup_latitude IS NULL AND pickup_longitude IS NULL) OR
        (pickup_latitude BETWEEN -90 AND 90 AND pickup_longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_delivery_coords CHECK (
        (delivery_latitude IS NULL AND delivery_longitude IS NULL) OR
        (delivery_latitude BETWEEN -90 AND 90 AND delivery_longitude BETWEEN -180 AND 180)
    )
);

-- =====================================================
-- ORDER STATUS HISTORY (audit trail)
-- =====================================================

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_provider ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_scheduled_time ON orders(scheduled_pickup_time);
CREATE INDEX idx_orders_pickup_city ON orders(pickup_city);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    new_number := 'UNI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
    SELECT COUNT(*) + 1 INTO counter
    FROM orders WHERE order_number LIKE new_number || '%';
    RETURN new_number || LPAD(counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Track status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_order_status_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION track_order_status_change();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE orders IS 'Main orders table - items and images stored as JSONB for simplicity';
COMMENT ON TABLE order_status_history IS 'Audit trail for order status changes';
COMMENT ON COLUMN orders.items IS 'JSON array of items: [{name, qty, weight_kg, fragile, image_url}]';
COMMENT ON COLUMN orders.images IS 'JSON array of images: [{url, type, uploaded_by}]';
