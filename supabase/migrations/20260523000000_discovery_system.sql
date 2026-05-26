-- Step 1: Hashtag System
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag_name TEXT UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(post_id, hashtag_id)
);

-- Step 3: Trending Engine
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trending_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION public.calculate_trending_score(
    p_likes_count INTEGER,
    p_comments_count INTEGER,
    p_reposts_count INTEGER,
    p_shares_count INTEGER,
    p_saves_count INTEGER,
    p_created_at TIMESTAMP WITH TIME ZONE
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
AS $$
DECLARE
    v_hours_since FLOAT;
    v_velocity FLOAT;
BEGIN
    v_hours_since := EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600;
    -- TikTok-style velocity: Recent actions weighted more
    -- Formula: (Engagements + 1) / (Age + 2)^1.5
    -- We use a base +1 to avoid log(0) or 0 scores for new content.
    v_velocity := (p_likes_count + (p_comments_count * 2) + (COALESCE(p_reposts_count, 0) * 3) + (COALESCE(p_shares_count, 0) * 4) + (COALESCE(p_saves_count, 0) * 5) + 1);
    RETURN v_velocity / POWER(v_hours_since + 2, 1.5);
END;
$$;

-- Function to refresh a post's trending score
CREATE OR REPLACE FUNCTION public.refresh_post_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET trending_score = public.calculate_trending_score(
        likes_count,
        comments_count,
        COALESCE(reposts_count, 0),
        COALESCE(shares_count, 0),
        COALESCE(saves_count, 0),
        created_at
    )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id, NEW.id, OLD.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for engagement tables to refresh trending score automatically
DROP TRIGGER IF EXISTS tr_refresh_trending_on_like ON public.likes;
CREATE TRIGGER tr_refresh_trending_on_like
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.refresh_post_trending_score();

DROP TRIGGER IF EXISTS tr_refresh_trending_on_comment ON public.comments;
CREATE TRIGGER tr_refresh_trending_on_comment
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE public.refresh_post_trending_score();

-- Reposts trigger (Refreshes original post score)
CREATE OR REPLACE FUNCTION public.refresh_original_post_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_repost AND NEW.original_post_id IS NOT NULL THEN
        UPDATE public.posts
        SET trending_score = public.calculate_trending_score(
            likes_count,
            comments_count,
            COALESCE(reposts_count, 0),
            COALESCE(shares_count, 0),
            COALESCE(saves_count, 0),
            created_at
        )
        WHERE id = NEW.original_post_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_refresh_trending_on_repost ON public.posts;
CREATE TRIGGER tr_refresh_trending_on_repost
AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE public.refresh_original_post_trending_score();

-- Preparation for Geo (PostGIS must be enabled check disabled due to potential issues in Supabase Studio, 
-- but will just add column manually)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- We'll skip GEOGRAPHY due to missing extension in some envs unless requested, dropping for safety.

-- Step 10: RLS for discovery
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view hashtags" ON public.hashtags;
CREATE POLICY "Anyone can view hashtags" ON public.hashtags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view post_hashtags" ON public.post_hashtags;
CREATE POLICY "Anyone can view post_hashtags" ON public.post_hashtags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated can insert hashtags" ON public.hashtags;
CREATE POLICY "Authenticated can insert hashtags" ON public.hashtags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Authenticated can insert post_hashtags" ON public.post_hashtags;
CREATE POLICY "Authenticated can insert post_hashtags" ON public.post_hashtags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RPC for incrementing hashtag usage
CREATE OR REPLACE FUNCTION public.increment_hashtag_usage(tag_name_param TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_normalized_tag TEXT;
BEGIN
    v_normalized_tag := lower(trim(tag_name_param));
    
    INSERT INTO public.hashtags (tag_name, usage_count)
    VALUES (v_normalized_tag, 1)
    ON CONFLICT (tag_name)
    DO UPDATE SET usage_count = hashtags.usage_count + 1
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

-- RPC for syncing post hashtags efficiently
CREATE OR REPLACE FUNCTION public.sync_post_hashtags(p_post_id UUID, p_hashtags TEXT[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    tag TEXT;
    v_tag_id UUID;
BEGIN
    -- Delete old post hashtags (not fully decrementing but relying on batch processing for now)
    DELETE FROM public.post_hashtags WHERE post_id = p_post_id;
    
    FOREACH tag IN ARRAY p_hashtags LOOP
        v_tag_id := public.increment_hashtag_usage(tag);
        
        INSERT INTO public.post_hashtags (post_id, hashtag_id)
        VALUES (p_post_id, v_tag_id)
        ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
END;
$$;

-- RPC for incrementing shares count
CREATE OR REPLACE FUNCTION public.increment_shares_count(post_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.posts
    SET shares_count = COALESCE(shares_count, 0) + 1
    WHERE id = post_id_param;
END;
$$;

-- Enable Supabase Realtime
DO $$
BEGIN
    -- Check if publications exist before adding
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.hashtags;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add hashtags to publication: %', SQLERRM;
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.post_hashtags;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add post_hashtags to publication: %', SQLERRM;
        END;
    END IF;
END;
$$;
