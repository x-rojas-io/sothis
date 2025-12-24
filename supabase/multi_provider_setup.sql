-- Migration: Multi-Provider Setup

-- 1. Create Providers Table
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Can be linked to auth.users or public.users later
  name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[], 
  image_url TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add provider_id to existing tables
ALTER TABLE availability_templates 
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id);

ALTER TABLE time_slots
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES providers(id);

-- 3. Backfill data (Create Default Provider 'Nancy')
DO $$
DECLARE
    nancy_id UUID;
BEGIN
    -- Check if Nancy exists or create her
    SELECT id INTO nancy_id FROM providers WHERE name = 'Nancy' LIMIT 1;
    
    IF nancy_id IS NULL THEN
        INSERT INTO providers (name, bio, color_code)
        VALUES ('Nancy', 'Lead Therapist', '#EA580C') -- Orange-600
        RETURNING id INTO nancy_id;
    END IF;

    -- Update templates
    UPDATE availability_templates 
    SET provider_id = nancy_id 
    WHERE provider_id IS NULL;

    -- Update slots
    UPDATE time_slots 
    SET provider_id = nancy_id 
    WHERE provider_id IS NULL;
END $$;

-- 4. Enforce constraints
-- Remove old unique constraint on time_slots if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'time_slots_date_start_time_key') THEN
        ALTER TABLE time_slots DROP CONSTRAINT time_slots_date_start_time_key;
    END IF;
END $$;

-- Add new scoped constraint
ALTER TABLE time_slots
DROP CONSTRAINT IF EXISTS unique_provider_slot; -- Idempotency

ALTER TABLE time_slots
ADD CONSTRAINT unique_provider_slot UNIQUE (provider_id, date, start_time);


-- 5. Enable RLS and Policies
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active providers
DROP POLICY IF EXISTS "Public read access" ON providers;
CREATE POLICY "Public read access" ON providers FOR SELECT USING (true);

-- Policy: Admins can update
DROP POLICY IF EXISTS "Admin write access" ON providers;
CREATE POLICY "Admin write access" ON providers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
  -- Note: Adjust the subquery depending on how admin check is implemented in other policies
  -- schema.sql uses: auth.jwt() ->> 'email' IN (SELECT email FROM users WHERE role = 'admin')
);

-- Update RLS for Slots so they are filtered by provider?
-- Existing policy "Anyone can view available slots" uses (status = 'available' AND date >= CURRENT_DATE).
-- This is still fine, it will just show slots from all providers.
