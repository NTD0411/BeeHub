-- API-073: Ảnh tin chợ sinh viên (upload qua Node service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "marketplace_images_public_read" ON storage.objects;
CREATE POLICY "marketplace_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketplace-images');
