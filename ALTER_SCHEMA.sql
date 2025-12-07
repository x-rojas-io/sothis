-- Add missing columns for NextAuth
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS image text;

-- Ensure permissions are set for these new columns (inherits from table generally, but good to be safe)
GRANT ALL ON TABLE public.users TO service_role;
