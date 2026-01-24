-- Add missing unique constraint to time_slots table
-- This is required for the generate-slots API to function correctly (upsert)

ALTER TABLE time_slots
ADD CONSTRAINT time_slots_date_start_time_key UNIQUE (date, start_time);
