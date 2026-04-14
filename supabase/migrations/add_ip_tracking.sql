-- Adds IP address tracking for clinical forensic audit
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

ALTER TABLE intake_form_audit 
ADD COLUMN IF NOT EXISTS ip_address TEXT;
