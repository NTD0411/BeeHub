-- Add delivery photo column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;

-- Create storage bucket for delivery photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'delivery-photos',
  'delivery-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for delivery photos storage
DROP POLICY IF EXISTS "Providers can upload delivery photos" ON storage.objects;
CREATE POLICY "Providers can upload delivery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'delivery-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Everyone can view delivery photos" ON storage.objects;
CREATE POLICY "Everyone can view delivery photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'delivery-photos');
