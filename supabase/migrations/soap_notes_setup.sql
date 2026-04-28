-- SOAP Notes Setup Migration
-- Introduces structured clinical documentation for massage therapy sessions

CREATE TABLE IF NOT EXISTS soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    provider_id UUID, -- References users(id)

    -- General Metadata
    treatment_goal TEXT,

    -- Subjective (S): Patient's complaints and perspective
    subjective_symptoms TEXT,
    subjective_pain_intensity INTEGER CHECK (subjective_pain_intensity >= 0 AND subjective_pain_intensity <= 10),
    subjective_notes TEXT,

    -- Objective (O): Measurable data, physical exam
    objective_findings TEXT,
    objective_tests TEXT,

    -- Assessment (A): Clinical interpretation
    assessment_summary TEXT,
    assessment_conclusion TEXT,

    -- Plan (P): Treatment steps
    plan_treatment TEXT,
    plan_frequency TEXT,
    plan_self_care TEXT,

    -- Visual Data
    body_markings JSONB DEFAULT '[]',

    -- Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'completed')) DEFAULT 'draft',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_soap_notes_booking_id ON soap_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_soap_notes_client_email ON soap_notes(client_email);

-- RLS
ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Providers can manage all soap notes" 
ON soap_notes FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'provider')
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_soap_notes_updated_at
    BEFORE UPDATE ON soap_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
