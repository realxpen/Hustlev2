-- =========================================================================
-- HUSTLE COMMENTS THREADING ENGINE
-- Two-level hierarchy design for extreme scalability, avoiding recursive CTEs.
-- =========================================================================

-- =========================================================================
-- 1. COMMENTS (Top-Level)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    
    -- Denormalized Counters
    likes_count INT DEFAULT 0 NOT NULL,
    replies_count INT DEFAULT 0 NOT NULL,
    
    -- Curation
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    
    -- Moderation & Trust
    moderation_status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (moderation_status IN ('active', 'flagged', 'hidden', 'deleted')),
    auto_flagged BOOLEAN DEFAULT false,
    
    -- Knowledge Graph extensions
    is_question BOOLEAN DEFAULT false,
    ai_extracted_knowledge BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES
-- Fetch post comments fast (active ones only). Pinned first, then chronological.
CREATE INDEX IF NOT EXISTS idx_comments_curated ON public.comments (post_id, is_pinned DESC, created_at DESC) WHERE moderation_status = 'active';
-- Moderation Queue Index
CREATE INDEX IF NOT EXISTS idx_comments_flagged ON public.comments (created_at DESC) WHERE moderation_status = 'flagged';
-- Profile query index: fetch all comments by a user
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments (author_id, created_at DESC);


-- =========================================================================
-- 2. COMMENT REPLIES (Thread Depth = 1)
-- Flat hierarchy under a parent comment prevents infinite nesting loops and 
-- recursive queries, matching TikTok/Instagram scaling models.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.comment_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    
    -- Reply targeting (If user is replying to someone else's reply in the same thread)
    replying_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Metrics
    likes_count INT DEFAULT 0 NOT NULL,
    
    -- Moderation & Trust
    moderation_status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (moderation_status IN ('active', 'flagged', 'hidden', 'deleted')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES
-- Fetch all replies to a specific comment (usually chronologically ascending)
CREATE INDEX IF NOT EXISTS idx_replies_parent_time ON public.comment_replies (parent_comment_id, created_at ASC) WHERE moderation_status = 'active';
-- Author lookups
CREATE INDEX IF NOT EXISTS idx_replies_author ON public.comment_replies (author_id, created_at DESC);


-- =========================================================================
-- 3. COMMENT MENTIONS
-- Normalize mentions to easily query "Where was I mentioned?" without searching 
-- through raw text bodies, which is extremely expensive at scale.
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.comment_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Polymorphic relationship using mutually exclusive columns
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES public.comment_replies(id) ON DELETE CASCADE,
    
    -- Constraint ensuring it belongs to either a comment OR a reply, never both
    CHECK (
        (comment_id IS NOT NULL AND reply_id IS NULL) OR 
        (comment_id IS NULL AND reply_id IS NOT NULL)
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- INDEXES
-- Drive the Notification Service efficiently: "Give me my recent mentions"
CREATE INDEX IF NOT EXISTS idx_mentions_user_time ON public.comment_mentions (mentioned_user_id, created_at DESC);
-- Reverse lookup: who is mentioned in this comment/reply?
CREATE INDEX IF NOT EXISTS idx_mentions_comment ON public.comment_mentions (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mentions_reply ON public.comment_mentions (reply_id) WHERE reply_id IS NOT NULL;
