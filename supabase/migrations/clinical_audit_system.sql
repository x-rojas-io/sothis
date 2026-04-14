-- Clinical Audit System Migration
-- Adds traceability and historical snapshots to intake forms

-- 1. Ensure intake_forms has necessary clinical metadata columns
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone_day TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city_state_zip TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS initial_visit_date DATE,
ADD COLUMN IF NOT EXISTS consent_name TEXT,
ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS therapist_signature_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_by UUID,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS therapist_signature_name TEXT,
ADD COLUMN IF NOT EXISTS therapist_signature_ip TEXT;

-- Ensure unique_intake_client_email constraint is idempotent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_intake_client_email') THEN
        ALTER TABLE intake_forms ADD CONSTRAINT unique_intake_client_email UNIQUE (client_email);
    END IF;
END $$;

-- 2. Update existing column types if necessary (UI expects text for these simple fields)
ALTER TABLE intake_forms ALTER COLUMN emergency_contact DROP DEFAULT;
ALTER TABLE intake_forms ALTER COLUMN emergency_contact TYPE TEXT USING emergency_contact::text;
ALTER TABLE intake_forms ALTER COLUMN signature_name DROP NOT NULL;
ALTER TABLE intake_forms ALTER COLUMN signature_date DROP NOT NULL;

-- 3. Create Audit Snapshot Table
CREATE TABLE IF NOT EXISTS intake_form_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
    modified_by UUID,
    modified_by_email TEXT,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT,
    therapist_signature_name TEXT,
    therapist_signature_ip TEXT
);

-- 4. Enable RLS on Audit Table
ALTER TABLE intake_form_audit ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy: Admins/Providers can view audit history
CREATE POLICY "Admins can view all audit logs" 
ON intake_form_audit FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
);

-- 6. RLS Policy: Allow all authenticated users to create audit snapshots (dual-write)
CREATE POLICY "Allow all authenticated users to create audit logs" 
ON intake_form_audit FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 7. RLS Policy: Admins/Providers can modify client intake for clinical updates
CREATE POLICY "Admins and Providers can manage all intake forms" 
ON intake_forms FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
);

-- Note: Patients do NOT have access to the audit table as per requirement.
