-- Unified Likes System Fix
-- This migration ensures we use the 'likes' table consistently and fixes toggle_like RPC.

-- 0. Ensure all required columns exist for trending engine
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- 1. Create collections and saved_posts tables if they don't exist
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections') THEN
        CREATE POLICY "Users can manage their collections" ON public.collections
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_posts') THEN
        CREATE POLICY "Users can manage their saved posts" ON public.saved_posts
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Sync any stray data from post_likes to likes if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
        -- Safely copy data if likes table has same structure
        INSERT INTO public.likes (user_id, post_id, created_at)
        SELECT user_id, post_id, created_at FROM public.post_likes
        ON CONFLICT (user_id, post_id) DO NOTHING;
    END IF;
END $$;

-- 2. Update toggle_like RPC to use the 'likes' table
CREATE OR REPLACE FUNCTION public.toggle_like(p_post_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.likes 
    WHERE post_id = p_post_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.likes 
    WHERE post_id = p_post_id AND user_id = v_user_id;
    
    -- Count is handled by tr_update_post_likes_count trigger
    
    RETURN false;
  ELSE
    BEGIN
      INSERT INTO public.likes (post_id, user_id) 
      VALUES (p_post_id, v_user_id);
      
      RETURN true;
    EXCEPTION 
      WHEN unique_violation THEN
        RETURN true;
    END;
  END IF;
END;
$$;

-- 3. Ensure likes_count is accurate
UPDATE posts p SET likes_count = (SELECT count(*) FROM likes l WHERE l.post_id = p.id);

-- 5. Ensure saves_count is accurate
UPDATE posts p SET saves_count = (SELECT count(*) FROM saved_posts sp WHERE sp.post_id = p.id);

-- 6. Trigger to keep saves_count in sync
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE posts SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_post_saves_count ON saved_posts;
CREATE TRIGGER tr_update_post_saves_count
AFTER INSERT OR DELETE ON saved_posts
FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- 8. Robust Trending Score Auto-Refresh
CREATE OR REPLACE FUNCTION public.recalculate_trending_for_post()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trending_score = public.calculate_trending_score(
        NEW.likes_count,
        NEW.comments_count,
        COALESCE(NEW.reposts_count, 0),
        COALESCE(NEW.shares_count, 0),
        COALESCE(NEW.saves_count, 0),
        NEW.created_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_recalculate_trending_on_update ON public.posts;
CREATE TRIGGER tr_recalculate_trending_on_update
BEFORE UPDATE OF likes_count, comments_count, reposts_count, shares_count, saves_count ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.recalculate_trending_for_post();

-- Initial recalculation for all posts
UPDATE public.posts SET trending_score = public.calculate_trending_score(
    likes_count,
    comments_count,
    COALESCE(reposts_count, 0),
    COALESCE(shares_count, 0),
    COALESCE(saves_count, 0),
    created_at
);

-- 9. Enable realtime for likes, collections and saved_posts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
        EXCEPTION WHEN OTHERS THEN END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.collections;
        EXCEPTION WHEN OTHERS THEN END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_posts;
        EXCEPTION WHEN OTHERS THEN END;
    END IF;
END $$;
