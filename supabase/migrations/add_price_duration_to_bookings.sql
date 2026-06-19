-- Migration: Add price and duration columns to bookings table
-- Description: Supports storing custom service variation prices and durations for reports and dynamic scheduling.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Comment for documentation
COMMENT ON COLUMN bookings.price IS 'The cost of the service for this specific booking in USD.';
COMMENT ON COLUMN bookings.duration IS 'The duration of the appointment in minutes.';
