ALTER TABLE provider_documents
  ADD COLUMN IF NOT EXISTS document_slot TEXT;

UPDATE provider_documents
SET document_slot = CASE
  WHEN notes IN (
    'cccd_front',
    'cccd_back',
    'vehicle_registration',
    'driver_license',
    'vehicle_photo'
  ) THEN notes
  ELSE 'legacy:' || id::TEXT
END
WHERE document_slot IS NULL;

WITH ranked_documents AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY provider_id, document_slot
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS duplicate_rank
  FROM provider_documents
)
UPDATE provider_documents AS documents
SET document_slot = 'legacy:' || documents.id::TEXT
FROM ranked_documents
WHERE documents.id = ranked_documents.id
  AND ranked_documents.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_documents_provider_slot
  ON provider_documents (provider_id, document_slot);
