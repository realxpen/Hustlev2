# Hustle Profile Database Schema

This document details the production-ready PostgreSQL relational database schema for Hustle User Profiles. The architecture isolates authentication data from secondary user-facing profile dimensions, ensures strict data integrity, optimizes lookup queries using targeted indexes, and supports scalable future extensions for marketplace trading, escrows, trust scoring, and agency management.

---

## 1. Schema Diagram & Relationships

```
  +-----------------------+              +------------------------+
  |      auth.users       |              |         skills         |
  +-----------------------+              +------------------------+
  | PK | id         (UUID)|              | PK | id          (UUID)|
  +-----------------------+              |    | name      (VARCHAR)|
             | (1:1)                     +------------------------+
             v                                       | (1:N)
  +-----------------------+                          v
  |       profiles        |              +------------------------+
  +-----------------------+              |     profile_skills     |
  | PK | id         (UUID)|<------------| PK | id          (UUID)|
  |    | username (VARCHAR)|(1:N)        | FK | profile_id  (UUID)|
  |    | full_name (VARCHAR)|            | FK | skill_id    (UUID)|
  |    | bio        (TEXT)|              +------------------------+
  |    | location (VARCHAR)|
  |    | trust_score (NUM)|
  |    | is_hustler (BOOL)|
  |    | is_agent   (BOOL)|              +------------------------+
  +-----------------------+              |       languages        |
     | (1:N)          | (1:N)            +------------------------+
     v                v                  | PK | id          (UUID)|
  +------------+   +-------------------+ |    | code    (VARCHAR5)|
  |verification|   |  user_languages   | |    | name    (VARCHAR) |
  |   status   |   +-------------------+ +------------------------+
  +------------+   | PK | id     (UUID)|             | (1:N)
  | PK|id(UUID)|   | FK |profile_(UUID)|<------------+
  | FK|profile_|   | FK |lang_id (UUID)|
  +------------+   +-------------------+
```

- **Authentication Isolation Diagram**: Client/User logins are handled by the core security subsystem (`auth.users`), while profile directories, metrics, search indices, and bio parameters are housed in the isolated, high-performance `public.profiles` schema layer.
- **One-to-One Relationships**: Each registered `auth.users` row maps to exactly one record in `public.profiles`.
- **Many-to-Many Mappings**: 
  - Profiles are mapped to Skills via the associative ledger `profile_skills`.
  - Profiles are mapped to Languages via the associative ledger `user_languages`.
- **One-to-Many Mappings**: Each Profile may possess multiple different certified badges stored in the `verification_status` schema table.

---

## 2. SQL Schema DDL Statements

Below are the safe PostgreSQL queries designed to deploy the target layout under Supabase or any standard relational SQL engine:

```sql
-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. PROFILES TABLE (Isolates metadata from auth state, includes trust scoring)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL CONSTRAINT username_length_check CHECK (char_length(username) >= 3),
    full_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    location VARCHAR(100),
    primary_skill VARCHAR(100),
    
    -- Future Marketplace flags
    is_hustler BOOLEAN DEFAULT false NOT NULL,
    hourly_rate DECIMAL(10, 2) DEFAULT 0.00 NOT NULL CONSTRAINT hourly_rate_positive CHECK (hourly_rate >= 0.00),
    currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    
    -- Future Trust System metrics (composite ratings + disputes)
    rating_average NUMERIC(3, 2) DEFAULT 5.00 NOT NULL CONSTRAINT rating_range CHECK (rating_average >= 0.00 AND rating_average <= 5.00),
    review_count INT DEFAULT 0 NOT NULL CONSTRAINT review_count_positive CHECK (review_count >= 0),
    trust_score NUMERIC(5, 2) DEFAULT 100.00 NOT NULL CONSTRAINT trust_score_range CHECK (trust_score >= 0.00 AND trust_score <= 100.00),
    dispute_count INT DEFAULT 0 NOT NULL CONSTRAINT dispute_count_positive CHECK (dispute_count >= 0),
    
    -- Future Agent/Agency features
    is_agent BOOLEAN DEFAULT false NOT NULL,
    agency_name VARCHAR(100),
    managed_hustlers_count INT DEFAULT 0 NOT NULL CHECK (managed_hustlers_count >= 0),

    -- Compliance and timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 2. PROFILE_SKILLS TABLE (Associative mapping, supports experience metrics)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profile_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    
    -- Future Marketplace matching signals
    experience_months INT DEFAULT 0 NOT NULL CONSTRAINT experience_months_positive CHECK (experience_months >= 0),
    proficiency_level VARCHAR(30) DEFAULT 'Intermediate' NOT NULL CONSTRAINT proficiency_level_check CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Expert', 'Specialist')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_profile_skill UNIQUE (profile_id, skill_id)
);

-- =========================================================================
-- 3. LANGUAGES TABLE (Core reference dictionary for spoken languages)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(5) UNIQUE NOT NULL, -- e.g. 'en', 'es', 'fr', 'pt', 'de'
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'English', 'Spanish', 'French'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed core language table references
INSERT INTO public.languages (code, name) VALUES
    ('en', 'English'),
    ('es', 'Spanish'),
    ('fr', 'French'),
    ('de', 'German'),
    ('pt', 'Portuguese'),
    ('it', 'Italian'),
    ('zh', 'Chinese'),
    ('ja', 'Japanese')
ON CONFLICT (code) DO NOTHING;

-- =========================================================================
-- 4. USER_LANGUAGES TABLE (Spoken capability matrices)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
    
    -- Spoken and communication accuracy levels
    proficiency_level VARCHAR(30) DEFAULT 'Fluent' NOT NULL CONSTRAINT lang_proficiency_check CHECK (proficiency_level IN ('Beginner', 'Conversational', 'Professional', 'Fluent', 'Native')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_profile_language UNIQUE (profile_id, language_id)
);

-- =========================================================================
-- 5. VERIFICATION_STATUS TABLE (Hustle Secure™ Badge Framework)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.verification_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Strict category enum-like verification barriers
    verification_type VARCHAR(50) NOT NULL CONSTRAINT verification_type_check CHECK (verification_type IN ('sms_auth', 'identity_card', 'background_check', 'professional_license', 'business_registration')),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CONSTRAINT verification_status_check CHECK (status IN ('pending', 'verified', 'rejected', 'expired', 'none')),
    
    -- Compliance and secure reference digests (no storage of raw raw files in SQL)
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    verifier_notes TEXT,
    document_hash_digest VARCHAR(64), -- SHA-256 secure integrity checksum
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_profile_verification_category UNIQUE (profile_id, verification_type)
);
```

---

## 3. High Performance Query Indexes

To optimize rendering speeds, lower response times for service finders, and prevent sequential full-table scans under high loads:

```sql
-- 1. Fast unique profile routing based on clean screen username
CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup 
ON public.profiles (username);

-- 2. Discovery page/Geographic search optimization index (covering hustler flags and rate)
CREATE INDEX IF NOT EXISTS idx_profiles_marketplace_routing 
ON public.profiles (is_hustler, is_available, location) 
WHERE is_hustler = true;

-- 3. Composite skills mapping index to speed service matching queries
CREATE INDEX IF NOT EXISTS idx_profile_skills_lookup 
ON public.profile_skills (profile_id, skill_id);

-- 4. Trust badge evaluation performance index (filters only active green verifications)
CREATE INDEX IF NOT EXISTS idx_verification_badge_lookup 
ON public.verification_status (profile_id, verification_type) 
WHERE status = 'verified';

-- 5. Foreign keys index to eliminate sub-table scanning cascades during relational deletions
CREATE INDEX IF NOT EXISTS idx_user_languages_profile_fk ON public.user_languages (profile_id);
CREATE INDEX IF NOT EXISTS idx_user_languages_lang_fk ON public.user_languages (language_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_skill_fk ON public.profile_skills (skill_id);
```

---

## 4. Normalization & Optimization Strategy

The database layout strictly conforms to **Third Normal Form (3NF)** requirements to manage scalability, improve index efficiency, and ensure transaction durability:

1. **Isolation of Credentials and Biography**: User credentials, encryption keys, and session cookies are stored in Supabase's secure, internal `auth.users` schema. The user-facing public properties, review metrics, and active profiles are isolated inside `public.profiles`.
2. **Third Normal Form (3NF)**:
   - All tables enforce strong entity identifiers (PK) to satisfy **First Normal Form (1NF)**.
   - All non-key columns depend wholly on the primary key, eliminating partial dependencies to satisfy **Second Normal Form (2NF)**.
   - Transitive dependencies are eliminated. For instance, instead of storing language names as free-form text strings in the profile, languages are mapped to a core global `languages` table using a clean foreign key relationship. This guarantees that updating a language name (e.g., localized translation tags) happens in exactly one place, meeting **Third Normal Form (3NF)**.
3. **Optimizations for Future Scale**:
   - **Partial Indexes**: Highly performant partial indices are defined for marketplace-active users (`WHERE is_hustler = true`) and verified safe providers (`WHERE status = 'verified'`). This filters out offline or unverified users, reducing index storage and accelerating target lookups.
   - **No Raw Compliance Storage**: The verification engine stores safe SHA-256 hash digests of proof documents rather than raw media or plain-text compliance rows, optimizing cell constraints and aligning with data protection acts like GDPR.
   - **Composite Multi-Index Unique Constraints**: Foreign key matches on skills and languages use unique composite keys (`unique_profile_skill`, `unique_profile_language`), allowing high-speed lookup and guarding against duplicate relationships seamlessly.
