-- Customer booking location preferences (choose-location screen)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hidden_recent_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS default_pickup_address TEXT;

INSERT INTO platform_settings (key, value, description)
VALUES (
  'combo_flow_hint',
  '"Combo — giá niêm yết, không chờ báo giá. Bước sau: mô tả trọ → chọn ngày giờ → chọn gói."',
  'Hint text on customer combo choose-location screen'
),
(
  'quote_flow_hint',
  '{"title":"Báo giá minh bạch — không cần bản đồ","subtitle":"Bước tiếp: mô tả trọ → chọn giờ mong muốn → nhà xe báo giá theo khung đó."}',
  'Hint text on customer quote/full-move choose-location screen'
)
ON CONFLICT (key) DO NOTHING;
