-- UniMove MVP Cleanup — for fresh installs after all migrations
-- Mirrors manual_fix_step4_optimize_mvp.sql
-- Note: wallets & wallet_transactions are KEPT (not dropped) for payment processing

ALTER TABLE orders DROP COLUMN IF EXISTS items;
ALTER TABLE orders DROP COLUMN IF EXISTS images;
ALTER TABLE profiles DROP COLUMN IF EXISTS fcm_token;

DROP TABLE IF EXISTS provider_bids CASCADE;
DROP TABLE IF EXISTS geofence_events CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS typing_indicators CASCADE;
DROP TABLE IF EXISTS feedback_responses CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS abuse_reports CASCADE;
