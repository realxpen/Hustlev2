-- =========================================================================
-- HUSTLE FOLLOW SYSTEM DATABASE DESIGN
-- Provides efficient tracking of user follower/following relationships.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Prevent duplicate follows (a user can only follow another user once)
    CONSTRAINT unique_user_follow UNIQUE (follower_id, following_id),

    -- Prevent self-follows (a user cannot follow themselves)
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- =========================================================================
-- INDEXES
-- =========================================================================

-- 1. Get a user's followers efficiently ("Who is following me?")
-- Needs to quickly filter by following_id
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id 
ON public.user_follows(following_id, created_at DESC);

-- 2. Get who a user is following efficiently ("Who am I following?")
-- Needs to quickly filter by follower_id
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id 
ON public.user_follows(follower_id, created_at DESC);

-- Note: The UNIQUE constraint automatically creates a B-tree index on (follower_id, following_id)
-- which makes the "is A following B?" direct lookup very fast.
