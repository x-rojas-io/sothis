-- 1. Remove Unique Constraints from intake_forms
-- This allows a client to have multiple intake forms (e.g., annual updates, per treatment)
-- instead of just a single profile record.

-- Drop the unique constraint on client_id (usually named intake_forms_client_id_key)
ALTER TABLE intake_forms 
DROP CONSTRAINT IF EXISTS intake_forms_client_id_key;

-- Drop the specific unique constraint on client_email that was added previously
ALTER TABLE intake_forms 
DROP CONSTRAINT IF EXISTS unique_intake_client_email;

-- 2. Ensure we have an index on client_id and client_email for performance
CREATE INDEX IF NOT EXISTS idx_intake_forms_client_id ON intake_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_client_email ON intake_forms(client_email);

-- 3. Note: The logic in the API and Frontend must be updated from 'upsert' to 'insert'
-- to ensure new clinical snapshots are created instead of overwriting existing ones.
