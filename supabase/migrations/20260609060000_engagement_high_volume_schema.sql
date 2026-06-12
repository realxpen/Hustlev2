-- =========================================================================
-- HUSTLE ENGAGEMENT ENGINE
-- High-Volume Scaling Schema for Engagement Actions
-- Optimized with composite primary keys, targeted indexing, and strict relationships
-- =========================================================================

-- =========================================================================
-- 1. LIKES 
-- Volume: Extremely High. Read: Yes. Write: Yes.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- Composite primary key automatically creates a unique btree index 
    -- and prevents duplicate likes naturally without an extra surrogate UUID.
    PRIMARY KEY (user_id, post_id)
);

-- Index for fetching all likes on a specific post rapidly, ordered by newest
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes (post_id, created_at DESC);
-- We don't need a specific user_id index for unique constraint because it's first in PK, 
-- but if we want to fetch user's likes sorted by time:
CREATE INDEX IF NOT EXISTS idx_likes_user_id_time ON public.likes (user_id, created_at DESC);


-- =========================================================================
-- 2. SAVES
-- Volume: Medium-High. Read: High (User profiles). Write: High.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.saves (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    collection_id UUID, -- Optional grouping
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_post_id ON public.saves (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saves_user_id_time ON public.saves (user_id, created_at DESC);


-- =========================================================================
-- 3. FOLLOWS (Social Graph)
-- Volume: High. Read: Extremely High (Feed gen). Write: Medium.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Index to find who a user is following
-- (Covered by PK, but an explicit one with created_at is good for chronological feeds)
CREATE INDEX IF NOT EXISTS idx_follows_follower_time ON public.follows (follower_id, created_at DESC);

-- Index to find followers of a specific user (critical for broadcasting posts)
CREATE INDEX IF NOT EXISTS idx_follows_following_time ON public.follows (following_id, created_at DESC);


-- =========================================================================
-- 4. SHARES
-- Volume: Medium. Read: Low. Write: Medium.
-- Unlike likes/saves, a user might share the same post multiple times to different places.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Allow anonymous tracking
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'copy_link', 'whatsapp', 'messages', 'instagram'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shares_post_id ON public.shares (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON public.shares (user_id, created_at DESC);


-- =========================================================================
-- 5. REPORTS (Trust & Safety)
-- Volume: Low. Read: Low/Admin. Write: Low.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL, -- Polymorphic relation (could be post, user, or comment)
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'user', 'comment')),
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status, created_at DESC);

-- Prevent user from spam-reporting the same exact entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_reporter_target ON public.reports (reporter_id, target_id, target_type);


-- =========================================================================
-- 6. NOT INTERESTED (Recommendation Tuning)
-- Volume: Medium. Read: High (Feed generation exclusion). Write: Medium.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.not_interested (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    reason VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

-- Index for rapid exclusion filtering during feed generation
-- (e.g., SELECT post_id FROM not_interested WHERE user_id = :user)
-- PK covers (user_id, post_id), which is precisely what's needed for exclusion lookups.
CREATE INDEX IF NOT EXISTS idx_not_interested_post_id ON public.not_interested (post_id);
