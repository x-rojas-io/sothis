-- FIX NEXTAUTH SCHEMA PERMISSIONS
-- The NextAuth Supabase Adapter tries to create tables in the 'next_auth' schema by default
-- or expects to find them in 'public' if not configured otherwise.
-- The error "The schema must be one of the following: public, graphql_public" means
-- we need to ensure the tables are in 'public' or permissions are set.

-- We will create the necessary NextAuth tables in PUBLIC schema to avoid permission issues

CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text,
  email_verified timestamp with time zone,
  image text,
  role text DEFAULT 'user',
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_provider_unique UNIQUE (provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  userId uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires timestamp with time zone NOT NULL,
  sessionToken text NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_sessionToken_key UNIQUE (sessionToken)
);

CREATE TABLE IF NOT EXISTS public.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT verification_tokens_identifier_token_key UNIQUE (identifier, token)
);

-- Grant permissions to service_role (which NextAuth uses)
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.accounts TO service_role;
GRANT ALL ON TABLE public.sessions TO service_role;
GRANT ALL ON TABLE public.verification_tokens TO service_role;

-- Ensure RLS is active but allows service_role full access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything" ON public.users
  USING (true) WITH CHECK (true);
  
CREATE POLICY "Service role can do everything" ON public.accounts
  USING (true) WITH CHECK (true);
  
CREATE POLICY "Service role can do everything" ON public.sessions
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything" ON public.verification_tokens
  USING (true) WITH CHECK (true);
