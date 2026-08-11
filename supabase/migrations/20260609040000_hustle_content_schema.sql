-- Hustle Content System Relational Database Layout
-- Designed with Third Normal Form (3NF) relational structures, fast multi-index query branches,
-- and specialized pipelines for search engines, recommendation systems, and clickstream analytics.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. REFERENCE TABLE: CONTENT FORMAT TYPES (e.g. Demonstration, Before/After)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'skill_demonstration', 'before_after'
    title VARCHAR(100) NOT NULL, -- e.g. 'Skill Demonstration'
    description TEXT,
    human_example TEXT, -- illustrative examples for low digital literacy users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed core reference content formats
INSERT INTO public.content_types (code, title, description, human_example) VALUES
    ('skill_demonstration', 'Skill Demonstration', 'Prove your trade craftsmanship in real time', 'Showing how you sand and seal a raw wooden dining table to look perfect.'),
    ('project_showcase', 'Project Showcase', 'A beautiful walk-through of a finished job', 'A slow pan showing kitchen cabinets remodel you completed.'),
    ('before_after', 'Before & After', 'Dramatic visual proof of your effectiveness', 'Showing copper heating pipes covered in heavy rust alongside polished shiny pipework.'),
    ('educational_tip', 'Educational Tip', 'Teach your professional knowledge to win trust', 'A rapid 3-step method to cleanly patch a circular hole in drywall.'),
    ('customer_testimonial', 'Customer Testimonial', 'Let satisfied customers sell for you', 'A quick client endorsement sharing how fast you repaired their heating system.'),
    ('service_promotion', 'Service Promotion', 'Promote a structured service option directly', 'An overview of a $120 home gutter deep-clean service ready for bookings.')
ON CONFLICT (code) DO NOTHING;

-- =========================================================================
-- 2. CENTRAL REGISTRY: PORTFOLIO CONTENT ENTRIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_type_id UUID NOT NULL REFERENCES public.content_types(id) ON DELETE RESTRICT,
    title VARCHAR(150),
    description TEXT NOT NULL,
    location VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    visibility VARCHAR(20) DEFAULT 'public' NOT NULL CONSTRAINT check_visibility_domains CHECK (visibility IN ('public', 'clients', 'private')),
    
    -- Analytics & Recommendation Engine scoring indices
    views_count INT DEFAULT 0 NOT NULL CONSTRAINT check_views_non_negative CHECK (views_count >= 0),
    likes_count INT DEFAULT 0 NOT NULL CONSTRAINT check_likes_non_negative CHECK (likes_count >= 0),
    shares_count INT DEFAULT 0 NOT NULL CONSTRAINT check_shares_non_negative CHECK (shares_count >= 0),
    saves_count INT DEFAULT 0 NOT NULL CONSTRAINT check_saves_non_negative CHECK (saves_count >= 0),
    avg_watch_duration_sec NUMERIC(6, 2) DEFAULT 0.00 NOT NULL,
    engagement_score NUMERIC(10, 4) DEFAULT 1.0000 NOT NULL, -- composite weight calculated by backend triggers
    
    -- Search Vector support
    search_vector TSVECTOR,

    -- Compliance and temporal counters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. SUB-DIMENSION TABLE: CONTENT MULTI-MEDIA REPOSITORY (1:N Support)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) DEFAULT 'image' NOT NULL CONSTRAINT check_media_classes CHECK (media_type IN ('video', 'image')),
    display_order INT DEFAULT 0 NOT NULL CONSTRAINT check_order_non_negative CHECK (display_order >= 0),
    duration_seconds NUMERIC(6, 2), -- nullable for image type
    cover_url TEXT, -- thumbnail pointer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 4. ASSOCIATIVE BRIDGE: CONTENT TRADE SKILLS MAPPING (Many-to-Many Relationship)
-- =========================================================================
-- Maps content items to skills directly (using the existing public.skills reference)
CREATE TABLE IF NOT EXISTS public.content_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    confidence_score NUMERIC(3, 2) DEFAULT 1.00 NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00), -- for machine-learning/tag matching accuracy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_content_skill_pairing UNIQUE (content_id, skill_id)
);

-- =========================================================================
-- 5. DICTIONARY REFERENCE: UNIFIED SOCIAL HASHTAGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag VARCHAR(50) UNIQUE NOT NULL CONSTRAINT check_hashtag_prefix CHECK (tag LIKE '#%'),
    usage_count INT DEFAULT 0 NOT NULL CONSTRAINT check_usage_non_negative CHECK (usage_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed basic trade hashtags
INSERT INTO public.hashtags (tag, usage_count) VALUES
    ('#handyman', 0),
    ('#plumbingsolutions', 0),
    ('#carpentrylife', 0),
    ('#constructionhustle', 0),
    ('#beforeandafter', 0),
    ('#craftmanship', 0),
    ('#hustlehard', 0),
    ('#barberlife', 0)
ON CONFLICT (tag) DO NOTHING;

-- =========================================================================
-- 6. ASSOCIATIVE BRIDGE: CONTENT HASHTAGS MAPPING (Many-to-Many Relationship)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_content_hashtag_pairing UNIQUE (content_id, hashtag_id)
);

-- =========================================================================
-- 7. PERFORMANCE & ANALYTICS: CLICKSTREAM RETENTION LOGGER
-- =========================================================================
-- Highly optimized logger supporting recommendation algorithms
CREATE TABLE IF NOT EXISTS public.content_engagement_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    user_id UUID, -- nullable to support guests / non-authenticated leads
    action_type VARCHAR(30) NOT NULL CONSTRAINT check_action_domain CHECK (action_type IN ('view_start', 'view_complete', 'view_loop_count', 'like', 'share', 'bookmark')),
    dwell_duration_seconds NUMERIC(6, 2) DEFAULT 0.00,
    device_fingerprint VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 8. HIGH PERFORMANCE INDEX ARCHITECTURE & PIPELINES
-- =========================================================================

-- INDEX A: Full-Text-Search (FTS) vector system for Search Engines
CREATE INDEX IF NOT EXISTS idx_content_search_vector_gin 
ON public.content USING gin(search_vector);

-- Trigger to auto-generate vector indexes on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.sync_content_search_vector() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_content_fts
BEFORE INSERT OR UPDATE ON public.content
FOR EACH ROW EXECUTE FUNCTION public.sync_content_search_vector();

-- INDEX B: Geospatial index covering latitude / longitude
CREATE INDEX IF NOT EXISTS idx_content_geospatial 
ON public.content (latitude, longitude) 
WHERE visibility = 'public';

-- INDEX C: Recommendation Engine ranking optimizer composite key
CREATE INDEX IF NOT EXISTS idx_content_recommendation_score 
ON public.content (content_type_id, engagement_score DESC) 
WHERE visibility = 'public';

-- INDEX D: Creator-specific feed directories
CREATE INDEX IF NOT EXISTS idx_content_creator_directories 
ON public.content (creator_id, created_at DESC);

-- INDEX E: Foreign keys cascading mapping prevention index
CREATE INDEX IF NOT EXISTS idx_content_media_parent ON public.content_media(content_id, display_order);
CREATE INDEX IF NOT EXISTS idx_content_skills_lookup ON public.content_skills(content_id, skill_id);
CREATE INDEX IF NOT EXISTS idx_content_hashtags_lookup ON public.content_hashtags(content_id, hashtag_id);
CREATE INDEX IF NOT EXISTS idx_engagement_analytics_tracking ON public.content_engagement_log(user_id, created_at DESC);

-- =========================================================================
-- 9. TRIGGERS: RECOMMENDATION COLD-START CALCULATION PIPELINE
-- =========================================================================

-- Dynamically updates hashtag global usage counters on linking
CREATE OR REPLACE FUNCTION public.sync_hashtag_use_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.hashtags SET usage_count = usage_count + 1 WHERE id = NEW.hashtag_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.hashtags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.hashtag_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_hashtags_use
AFTER INSERT OR DELETE ON public.content_hashtags
FOR EACH ROW EXECUTE FUNCTION public.sync_hashtag_use_counts();

-- Dynamically handles composite recommendations weighting on raw engagement loops
CREATE OR REPLACE FUNCTION public.update_content_engagement_index()
RETURNS TRIGGER AS $$
DECLARE
    v_views INT;
    v_likes INT;
    v_shares INT;
    v_saves INT;
    v_score NUMERIC(10, 4);
BEGIN
    -- Pull metrics
    SELECT views_count, likes_count, shares_count, saves_count 
    INTO v_views, v_likes, v_shares, v_saves 
    FROM public.content 
    WHERE id = NEW.content_id;

    -- Calculate algorithmic engagement weights:
    -- Views base 1.0x, Saves 5.0x, Likes 3.0x, Shares 8.0x
    v_score := (v_views * 1.0) + (v_likes * 3.0) + (v_saves * 5.0) + (v_shares * 8.0);
    
    -- Enforce standard algorithm damping
    UPDATE public.content 
    SET engagement_score = v_score 
    WHERE id = NEW.content_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- 10. DRAFTS: UNFINISHED PORTFOLIO CONTENT (Auto-Save Capability)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.draft_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    step_reached VARCHAR(50) DEFAULT 'upload' NOT NULL, -- tracks flow: upload, select_skill, fill_details, summary
    media_ids TEXT[], -- Array of strings mapping to processed media prior to final publish
    content_type_id UUID REFERENCES public.content_types(id) ON DELETE SET NULL,
    skill VARCHAR(100), -- Explicitly chosen or auto-detected target skill name
    title VARCHAR(150),
    description TEXT,
    price NUMERIC(10, 2),
    location VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index to quickly load user drafts
CREATE INDEX IF NOT EXISTS idx_draft_content_creator ON public.draft_content(creator_id, updated_at DESC);

-- =========================================================================
-- 11. DEEP ENGAGEMENT: COMMENTS & REPORTS
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.content_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE, -- Nullable. Self-reference for replies
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    replies_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_comments_parent ON public.content_comments(content_id, parent_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL, -- pending, reviewed, dismissed, actionable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 12. EXTENDING ENGAGEMENT LOGS CONSTRAINT
-- =========================================================================
-- Modify existing engagement constraint to support not_interested, report, hire_creator, and follow_creator
ALTER TABLE public.content_engagement_log DROP CONSTRAINT IF EXISTS check_action_domain;
ALTER TABLE public.content_engagement_log ADD CONSTRAINT check_action_domain 
CHECK (action_type IN ('view_start', 'view_complete', 'view_loop_count', 'like', 'share', 'bookmark', 'save', 'not_interested', 'follow_creator', 'hire_creator', 'report'));
