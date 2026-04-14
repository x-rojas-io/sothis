-- Add IP Address tracking to clinical intake forms and audits
-- This provides forensic evidence for digital signatures.

-- 1. Update intake_forms
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- 2. Update intake_form_audit
ALTER TABLE intake_form_audit 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

COMMENT ON COLUMN intake_forms.ip_address IS 'The IP address of the client at the time of submission.';
COMMENT ON COLUMN intake_form_audit.ip_address IS 'The IP address captured during this specific audit snapshot.';
