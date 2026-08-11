-- Migration: Add attached listing support to posts
-- This allows posts to be directly linked to a service, product, or training.

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attached_listing_id UUID;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attached_listing_type TEXT;

-- Index for performance when filtering and joining
CREATE INDEX IF NOT EXISTS idx_posts_attached_listing ON public.posts(attached_listing_id, attached_listing_type);
