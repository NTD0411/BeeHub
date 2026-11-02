-- Add dorm_image_urls column to orders table
-- Stores public URLs of dorm photos uploaded by customers during booking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS dorm_image_urls TEXT[] DEFAULT NULL;

COMMENT ON COLUMN orders.dorm_image_urls IS 'Public URLs of dorm/room photos uploaded by customer during booking flow';
