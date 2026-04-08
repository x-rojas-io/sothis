-- 1. Drop Foreign Key Constraints that are blocking client-side intake updates
-- The 'updated_by' and 'modified_by' columns currently point to 'auth.users(id)',
-- but since Clients are stored in a separate public table with different UUIDs,
-- this constraint is preventing valid intake form saves.

-- Drop constraint from 'intake_forms'
ALTER TABLE intake_forms 
DROP CONSTRAINT IF EXISTS intake_forms_updated_by_fkey;

-- Drop constraint from 'intake_form_audit'
ALTER TABLE intake_form_audit 
DROP CONSTRAINT IF EXISTS intake_form_audit_modified_by_fkey;

-- 2. Add Email-based Audit Columns for human-readable clinical audits
-- This ensures that even if IDs change, we have a readable record of the actor.

ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS updated_by_email TEXT;

ALTER TABLE intake_form_audit 
ADD COLUMN IF NOT EXISTS modified_by_email TEXT;

-- 3. Note: The columns 'updated_by' and 'modified_by' remain as UUIDs to capture 
-- the Actor ID (whether from 'public.users' or 'public.clients'), 
-- but they are no longer strictly validated against the internal 'auth' schema.
