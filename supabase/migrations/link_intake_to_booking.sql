-- Step 1: Add intake_form_id to bookings table
-- This allows linking a specific session to a specific clinical snapshot/medical reason.
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS intake_form_id UUID REFERENCES intake_forms(id) ON DELETE SET NULL;

-- Step 2: Add RLS policy if needed (assuming admin/owner access)
-- No special RLS needed if we use supabaseAdmin for session context.

COMMENT ON COLUMN bookings.intake_form_id IS 'Link to the clinical intake form associated with this specific visit.';
