-- Add missing auth fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE;
