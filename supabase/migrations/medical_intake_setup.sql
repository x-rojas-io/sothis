-- Sothis Therapeutic Massage: Secure Health Intake & Consent Migration
-- This script adds the audit trail for personal data consent and the new medical intake table.

-- 1. Update Clients Table for General Privacy Consent (Audit Trail)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consent_version TEXT DEFAULT 'v1.0-2024-04';

-- 2. Create Health Intake Forms Table
CREATE TABLE IF NOT EXISTS intake_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    medical_history JSONB NOT NULL DEFAULT '{}'::jsonb,
    emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    concentrate_on JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of body region IDs
    signature_name TEXT NOT NULL,
    signature_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    consent_version TEXT NOT NULL DEFAULT 'v1.0-clinical-2024-04',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one active form per client (clients can update, but we keep history if desired, or just overwrite)
    UNIQUE(client_id)
);

-- 3. Enable RLS
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Clients can only see and manage their own intake form
CREATE POLICY "Clients can only view their own intake" 
ON intake_forms FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Clients can only create/update their own intake" 
ON intake_forms FOR ALL 
USING (auth.uid() = client_id);

-- 5. RLS Policy: Admins (Clinic Owners) can see all intake forms
CREATE POLICY "Admins can view all intake forms" 
ON intake_forms FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 6. RLS Policy: Providers (LMTs) can see intake forms for their booked clients
CREATE POLICY "Providers can view intake for assigned bookings" 
ON intake_forms FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM bookings b
        JOIN time_slots ts ON b.time_slot_id = ts.id
        WHERE b.client_email = (SELECT email FROM clients WHERE id = intake_forms.client_id) -- Link by email/id
        AND ts.provider_id = (SELECT id FROM providers WHERE user_id = auth.uid())
    )
);

-- 7. Trigger for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_intake_forms_updated_at
BEFORE UPDATE ON intake_forms
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
