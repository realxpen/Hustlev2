-- =========================================================================
-- HUSTLE FEED ANALYTICS & RANKING ENGINE SCHEMA
-- Provides dedicated tables for recommendation, ranking, and analytics tracking
-- =========================================================================

-- =========================================================================
-- 1. RAW FEED EVENT STREAM
-- Useful for complex ML pipelines, session tracking, and generic event bus
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.feed_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for anonymous guests
    session_id UUID NOT NULL, -- Ties together a continuous scroll session
    event_type VARCHAR(50) NOT NULL, -- e.g., 'scroll', 'dwell', 'click', 'swipe_up', 'swipe_down'
    event_data JSONB DEFAULT '{}'::jsonb NOT NULL, -- Flexible payload (e.g. scroll_speed, screen_x, screen_y)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feed_events_user ON public.feed_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_session ON public.feed_events(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feed_events_type ON public.feed_events(event_type, created_at DESC);

-- =========================================================================
-- 2. CONTENT VIEWS (Detailed consumption tracking)
-- Tracks watch duration, completions, skips, and loops
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
    watch_duration_ms INT DEFAULT 0 NOT NULL,
    completion_rate NUMERIC(5, 4) DEFAULT 0.0000 NOT NULL, -- 1.0000 = 100% complete
    repeat_views INT DEFAULT 0 NOT NULL, -- How many times it looped
    skipped BOOLEAN DEFAULT FALSE NOT NULL, -- True if the user swiped away within 3 seconds
    device_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Compound index for rapid recommendation filtering and creator analytics
CREATE INDEX IF NOT EXISTS idx_content_views_post ON public.content_views(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_views_user ON public.content_views(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_content_views_analytics ON public.content_views(post_id, completion_rate DESC, repeat_views DESC);

-- =========================================================================
-- 3. CONTENT LIKES
-- Binary positive signals for collaborative filtering
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    source VARCHAR(50) DEFAULT 'feed' NOT NULL, -- feed, profile, shared_link
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_content_like UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_content_likes_post ON public.content_likes(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_likes_user ON public.content_likes(user_id, created_at DESC);

-- =========================================================================
-- 4. CONTENT SAVES
-- High-intent signals indicating utility and future value
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    collection_id UUID, -- Optional foreign key if folders/boards are implemented
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_content_save UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_content_saves_post ON public.content_saves(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_saves_user ON public.content_saves(user_id, created_at DESC);

-- =========================================================================
-- 5. CONTENT SHARES
-- Network expansion signals indicating high relevance
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.content_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null if anonymous sharing
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    target_platform VARCHAR(50) NOT NULL, -- e.g., 'copy_link', 'whatsapp', 'messages', 'instagram'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_shares_post ON public.content_shares(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_shares_user ON public.content_shares(user_id, created_at DESC);

-- =========================================================================
-- 6. NOT INTERESTED (Negative Signals)
-- Critical for trimming feeds and updating user embedding clusters
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.not_interested (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    skipped_at_ms INT, -- Watch duration when the negative signal was fired
    reason VARCHAR(100), -- Optional: 'irrelevant', 'repetitive', 'inappropriate'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_content_not_interested UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_not_interested_user ON public.not_interested(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_not_interested_post ON public.not_interested(post_id, created_at DESC);
