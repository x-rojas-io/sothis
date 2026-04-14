-- Add Therapist Signature fields for separate forensic tracking
-- This ensures the patient's signature metadata remains untouched when the therapist signs.

-- 1. Update intake_forms
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS therapist_signature_name TEXT,
ADD COLUMN IF NOT EXISTS therapist_signature_ip TEXT;

-- 2. Update intake_form_audit (for historical integrity)
ALTER TABLE intake_form_audit 
ADD COLUMN IF NOT EXISTS therapist_signature_name TEXT,
ADD COLUMN IF NOT EXISTS therapist_signature_ip TEXT;

COMMENT ON COLUMN intake_forms.therapist_signature_name IS 'The typed name of the massage therapist/provider.';
COMMENT ON COLUMN intake_forms.therapist_signature_ip IS 'The IP address of the therapist at the time of signing.';
