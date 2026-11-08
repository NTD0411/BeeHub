-- Provider bidding / báo giá cho đơn yêu cầu báo giá
CREATE TYPE quote_schedule_fit AS ENUM (
    'exact_match',
    'alternate_proposed',
    'unavailable'
);

CREATE TYPE order_quote_status AS ENUM (
    'submitted',
    'selected',
    'rejected',
    'withdrawn',
    'expired'
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS quote_request BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS order_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    base_price DECIMAL(10,2) NOT NULL,
    surcharges JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_price DECIMAL(10,2) NOT NULL,
    schedule_fit quote_schedule_fit NOT NULL DEFAULT 'exact_match',
    proposed_pickup_at TIMESTAMPTZ,
    note TEXT,
    status order_quote_status NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_order_quotes_order ON order_quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_quotes_provider ON order_quotes(provider_id);
CREATE INDEX IF NOT EXISTS idx_order_quotes_status ON order_quotes(status);

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quote_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'quote_selected';

ALTER TABLE order_quotes ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE order_quotes IS 'Báo giá từ nhiều nhà xe cho một đơn quote_request';
COMMENT ON COLUMN orders.quote_request IS 'TRUE = khách chờ nhiều nhà xe báo giá, không nhận đơn trực tiếp';
