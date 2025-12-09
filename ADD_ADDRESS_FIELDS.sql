-- Add address fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS client_address text,
ADD COLUMN IF NOT EXISTS client_city text,
ADD COLUMN IF NOT EXISTS client_state text,
ADD COLUMN IF NOT EXISTS client_zip text;

-- Notify that we need to run this against the DB
