-- 1. Normalize all existing emails in clients and users tables to lowercase and trimmed
UPDATE clients SET email = LOWER(TRIM(email));
UPDATE users SET email = LOWER(TRIM(email));

-- 2. Replace case-sensitive unique constraints with case-insensitive unique indexes

-- Drop the standard unique constraint on clients(email) if it exists
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;
-- Create case-insensitive unique index on clients(LOWER(email))
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_lower_idx ON clients (LOWER(email));

-- Drop the standard unique constraint on users(email) if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
-- Create case-insensitive unique index on users(LOWER(email))
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));
