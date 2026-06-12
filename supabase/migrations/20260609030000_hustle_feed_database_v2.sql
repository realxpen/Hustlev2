-- Hustle App: TikTok-Style Feed Database Schema (v2 Production Spec)
-- Designed to support millions of real-time professional discovery interactions, 
-- optimized querying, recommendation engine scoring, and event-driven output logic via outbox triggers.

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. CONTENT SYSTEM TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_contents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL, -- references profiles/auth ID
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL DEFAULT 'video' CHECK (media_type IN ('video', 'image')),
    caption TEXT,
    category VARCHAR(100) NOT NULL, -- Skill Tag / Profession Area
    location VARCHAR(200) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    has_music BOOLEAN DEFAULT FALSE,
    music_track TEXT,
    
    -- Cached Denormalized engagement counters (high performance read pathways)
    likes_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    saves_count BIGINT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    
    -- Metadata & Auditing
    content_quality_score FLOAT DEFAULT 1.0, -- assigned by auto-grading/moderation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Highly optimized indexes for discovery & location query lookups
CREATE INDEX IF NOT EXISTS idx_feed_contents_category ON public.feed_contents(category);
CREATE INDEX IF NOT EXISTS idx_feed_contents_location ON public.feed_contents(latitude, longitude) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_feed_contents_created_at ON public.feed_contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_contents_provider ON public.feed_contents(provider_id);

-- =========================================================================
-- 2. LIKES TABLE (High concurrency tracking)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES public.feed_contents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_content_like UNIQUE (user_id, content_id)
);

-- Composite Index for feed state extraction ("Did active user like this post?")
CREATE INDEX IF NOT EXISTS idx_feed_likes_user_content ON public.feed_likes(user_id, content_id);
-- Index to count/fetch likes for a specific content block
CREATE INDEX IF NOT EXISTS idx_feed_likes_content ON public.feed_likes(content_id);

-- =========================================================================
-- 3. COMMENTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.feed_contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE, -- supports infinite nested threads
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for threaded reading speed
CREATE INDEX IF NOT EXISTS idx_feed_comments_content ON public.feed_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_feed_comments_parent ON public.feed_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON public.feed_comments(user_id);

-- =========================================================================
-- 4. SHARES TABLE (Analytics & Virality Pipeline)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.feed_contents(id) ON DELETE CASCADE,
    user_id UUID, -- NULL if guest share link action
    share_target VARCHAR(100) DEFAULT 'clipboard', -- e.g. 'whatsapp', 'twitter', 'link_copy'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feed_shares_content ON public.feed_shares(content_id);
CREATE INDEX IF NOT EXISTS idx_feed_shares_user ON public.feed_shares(user_id) WHERE user_id IS NOT NULL;

-- =========================================================================
-- 5. SAVES TABLE (Engagement persistence bookmarks)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL REFERENCES public.feed_contents(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_content_save UNIQUE (user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_saves_user_content ON public.feed_saves(user_id, content_id);
CREATE INDEX IF NOT EXISTS idx_feed_saves_content ON public.feed_saves(content_id);

-- =========================================================================
-- 6. FOLLOWS PUBLIC TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL,   -- Active user subscribing
    following_id UUID NOT NULL,  -- Professional Creator receiving subscription
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
    CONSTRAINT check_cannot_follow_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_follows_mapping ON public.feed_follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_feed_follows_reverse_mapping ON public.feed_follows(following_id);

-- =========================================================================
-- 7. CONTENT VIEWS TABLE (Partitioned or Optimized for Hyper-Scale Analytics)
-- =========================================================================
-- For scale containing billions of views, this is optimized with key indices 
-- ready for timescaled partition layouts.
CREATE TABLE IF NOT EXISTS public.feed_content_views (
    id UUID DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL REFERENCES public.feed_contents(id) ON DELETE CASCADE,
    user_id UUID, -- NULL if guest view loop
    watch_duration_sec INT, -- critical for recommendation algorithm calculations
    completed_loop BOOLEAN DEFAULT FALSE,
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optimize analytics query pathways for recommendations
CREATE INDEX IF NOT EXISTS idx_feed_views_content_user ON public.feed_content_views(content_id, user_id);
CREATE INDEX IF NOT EXISTS idx_feed_views_rec_weights ON public.feed_content_views(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- =========================================================================
-- 8. OUTBOX EVENT ARCHITECTURE
-- =========================================================================
-- Houses transactional outbox stream for microservices / notification services
CREATE TABLE IF NOT EXISTS public.feed_event_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL, -- e.g. 'feed.view', 'feed.like', 'feed.comment'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feed_event_outbox_unprocessed ON public.feed_event_outbox(created_at) WHERE processed = FALSE;

-- =========================================================================
-- 9. TRIGGERS: AUTOMATED STATE SYNCHRONIZATION & DENORMALIZATION
-- =========================================================================

-- Function to handle content rating counter aggregation updates
CREATE OR REPLACE FUNCTION public.sync_feed_counters()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'feed_likes') THEN
            UPDATE public.feed_contents SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.like', jsonb_build_object('user_id', NEW.user_id, 'content_id', NEW.content_id, 'status', 'created'));
        ELSIF (TG_TABLE_NAME = 'feed_comments') THEN
            UPDATE public.feed_contents SET comments_count = comments_count + 1 WHERE id = NEW.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.comment', jsonb_build_object('user_id', NEW.user_id, 'content_id', NEW.content_id, 'comment_id', NEW.id, 'status', 'created'));
        ELSIF (TG_TABLE_NAME = 'feed_shares') THEN
            UPDATE public.feed_contents SET shares_count = shares_count + 1 WHERE id = NEW.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.share', jsonb_build_object('user_id', NEW.user_id, 'content_id', NEW.content_id, 'target', NEW.share_target));
        ELSIF (TG_TABLE_NAME = 'feed_saves') THEN
            UPDATE public.feed_contents SET saves_count = saves_count + 1 WHERE id = NEW.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.save', jsonb_build_object('user_id', NEW.user_id, 'content_id', NEW.content_id, 'status', 'created'));
        ELSIF (TG_TABLE_NAME = 'feed_content_views') THEN
            UPDATE public.feed_contents SET views_count = views_count + 1 WHERE id = NEW.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.view', jsonb_build_object('user_id', NEW.user_id, 'content_id', NEW.content_id, 'duration', NEW.watch_duration_sec, 'loop_completed', NEW.completed_loop));
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'feed_likes') THEN
            UPDATE public.feed_contents SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.like', jsonb_build_object('user_id', OLD.user_id, 'content_id', OLD.content_id, 'status', 'removed'));
        ELSIF (TG_TABLE_NAME = 'feed_comments') THEN
            UPDATE public.feed_contents SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.content_id;
        ELSIF (TG_TABLE_NAME = 'feed_saves') THEN
            UPDATE public.feed_contents SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.content_id;
            INSERT INTO public.feed_event_outbox (event_type, payload) 
            VALUES ('feed.save', jsonb_build_object('user_id', OLD.user_id, 'content_id', OLD.content_id, 'status', 'removed'));
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers across tracking layers
CREATE TRIGGER trg_sync_feed_likes
AFTER INSERT OR DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_counters();

CREATE TRIGGER trg_sync_feed_comments
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_counters();

CREATE TRIGGER trg_sync_feed_shares
AFTER INSERT ON public.feed_shares
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_counters();

CREATE TRIGGER trg_sync_feed_saves
AFTER INSERT OR DELETE ON public.feed_saves
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_counters();

CREATE TRIGGER trg_sync_feed_views
AFTER INSERT ON public.feed_content_views
FOR EACH ROW EXECUTE FUNCTION public.sync_feed_counters();
