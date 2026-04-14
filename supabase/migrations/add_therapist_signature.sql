-- Adds therapist forensic signature tracking to intake forms
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS therapist_signature_name TEXT,
ADD COLUMN IF NOT EXISTS therapist_signature_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS therapist_signature_ip TEXT;
