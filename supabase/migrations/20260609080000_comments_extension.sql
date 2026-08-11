-- =========================================================================
-- HUSTLE COMMENTS EXTENSION
-- Adds Support for Pinned Comments and Mentions
-- =========================================================================

-- Add Pinned and Mentions to content_comments
ALTER TABLE public.content_comments
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb; -- array of user IDs

-- Ensure only one pinned comment per content, or just allow sorting by it
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON public.content_comments(content_id) WHERE is_pinned = true;

-- The creator badge is usually computed at runtime: if author_id == content.author_id
