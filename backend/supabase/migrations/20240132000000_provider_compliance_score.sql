-- Provider compliance score system
-- Each cancellation after accepting deducts 2 points from a 20-point scale
-- Thresholds: ≤15 warning1, ≤10 warning2+ban1d, ≤5 warning3+ban3d (relapse=ban30d), ≤0 ban30d
-- Auto-reset: 30 days after last_violation_at with no new violation → score resets to 20

ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS compliance_score   integer      NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS warning_level      integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ban_until          timestamptz  NULL,
  ADD COLUMN IF NOT EXISTS last_violation_at  timestamptz  NULL;

-- Backfill existing rows
UPDATE provider_profiles
SET compliance_score = 20, warning_level = 0
WHERE compliance_score IS NULL;
