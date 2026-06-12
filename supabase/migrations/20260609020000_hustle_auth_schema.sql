-- Hustle Authentication Schema Migration
-- Created At: 2026-06-09T13:40:06Z
-- Support: Email, Phone, Future Social Logins, JWT Sessions, Token Rotation, Secure OTP Verifications

-- 1. Create custom types or domains if needed (PostgreSQL)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hustler_application_status_type') THEN
        CREATE TYPE hustler_application_status_type AS ENUM ('none', 'pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM ('Client', 'Hustler');
    END IF;
END$$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE CHECK (email ~* '^[0-9a-zA-Z._%+-]+@[0-9a-zA-Z.-]+\.[a-zA-Z]{2,4}$'),
    phone VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255), -- Nullable to allow social login only accounts
    full_name VARCHAR(100) NOT NULL,
    role user_role_type NOT NULL DEFAULT 'Client', -- Default role is 'Client'
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    hustler_application_status hustler_application_status_type NOT NULL DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Ensure user identity satisfies at least one login channel
    CONSTRAINT chk_identity_channel CHECK (
        email IS NOT NULL OR 
        phone IS NOT NULL
    )
);

-- 3. SOCIAL IDENTITIES TABLE (For Future Social Provider Logins: Google, Apple, GitHub, etc.)
CREATE TABLE IF NOT EXISTS public.social_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL, -- 'google', 'apple', 'github'
    provider_user_id VARCHAR(255) NOT NULL, -- Provider's unique external ID
    provider_meta JSONB, -- Stores metadata e.g. avatars, scopes, usernames
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_provider_account UNIQUE (provider_name, provider_user_id)
);

-- 4. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. REFRESH TOKENS TABLE (With replay attack detection and token rotation linkage)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Store hashes of refresh tokens for ultimate database seed safety
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    replaced_by UUID REFERENCES public.refresh_tokens(id) ON DELETE SET NULL -- Threat checking chain
);

-- 6. OTP VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'phone')),
    code_hash VARCHAR(255) NOT NULL, -- Store hashed code for defense-in-depth security
    attempts INTEGER NOT NULL DEFAULT 0, -- Limit dynamic code cracking
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==================== SCHEMA INDEXING FOR OPTIONAL SCALING ====================

-- Index for scanning matching email & phones during login flows
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

-- Index for foreign keys and verification checks
CREATE INDEX IF NOT EXISTS idx_social_identities_user ON public.social_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session ON public.refresh_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);

-- Search and expiry indices for otp verifications
CREATE INDEX IF NOT EXISTS idx_otp_user_channel ON public.otp_verifications(user_id, channel, is_used);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at) WHERE is_used = FALSE;

-- ==================== TRIGGERS & PROCEDURES ====================

-- Automatic Updated_At trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_column();
