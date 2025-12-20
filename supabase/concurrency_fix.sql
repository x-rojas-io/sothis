-- Concurrency Fix: Prevent Double Bookings
-- Run this in Supabase SQL Editor

-- Create a unique index on time_slot_id, but ONLY for bookings that are NOT cancelled.
-- This allows multiple 'cancelled' records for a slot, but only ONE 'confirmed' or 'completed' one.
-- Effectively preventing race conditions at the database level.

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings(time_slot_id) 
WHERE status NOT IN ('cancelled', 'no_show');
