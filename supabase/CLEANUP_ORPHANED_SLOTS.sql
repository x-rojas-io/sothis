-- Cleanup orphaned slots (no provider_id)
-- These slots are invalid because they cannot be booked for a specific provider.

DELETE FROM time_slots
WHERE provider_id IS NULL;
