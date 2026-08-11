-- Social Graph Foundation Migration

-- 1. Profile Count System - Extend profiles table FIRST to prevent any trigger reference issues during table creation or migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mutuals_count INT DEFAULT 0;

-- Safely drop any existing triggers/trigger functions that might conflict or use old/stale logic
DROP TRIGGER IF EXISTS tr_update_profile_follow_counts ON public.follows;
DROP TRIGGER IF EXISTS handle_follow_count ON public.follows CASCADE;
DROP TRIGGER IF EXISTS tr_handle_follow_count ON public.follows CASCADE;
DROP TRIGGER IF EXISTS handle_follow_count ON public.followers CASCADE;
DROP TRIGGER IF EXISTS tr_handle_follow_count ON public.followers CASCADE;
DROP TRIGGER IF EXISTS tr_update_profile_follow_counts ON public.followers CASCADE;
DROP FUNCTION IF EXISTS public.handle_follow_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_profile_follow_counts() CASCADE;

-- Clean drop of the follows table so it is rebuilt with explicit foreign keys
DROP TABLE IF EXISTS public.follows CASCADE;

-- 2. Create the 'follows' table and handle historical data migration from 'followers'
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Safely copy any existing follow records from 'followers' table to 'follows' table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers') THEN
        -- Check if it's a table first (not a view)
        IF (SELECT table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'followers') = 'BASE TABLE' THEN
            INSERT INTO public.follows (follower_id, following_id, created_at)
            SELECT follower_id, following_id, created_at FROM public.followers
            ON CONFLICT (follower_id, following_id) DO NOTHING;
            
            DROP TABLE public.followers CASCADE;
        END IF;
    END IF;
END;
$$;

-- Create followers view to act as backward compatibility synonym
CREATE OR REPLACE VIEW public.followers AS
SELECT id, follower_id, following_id, created_at FROM public.follows;

-- Enable Realtime for follows table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            -- Ensure it is added
            ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'Could not add follows to publication: %', SQLERRM;
        END;
    END IF;
END;
$$;


-- Trigger to atomically increment/decrement follow counts
CREATE OR REPLACE FUNCTION public.update_profile_follow_counts()
RETURNS TRIGGER AS $$
DECLARE
    is_mutual BOOLEAN;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Update follower (following_count)
        UPDATE public.profiles
        SET following_count = COALESCE(following_count, 0) + 1
        WHERE id = NEW.follower_id;

        -- Update followed user (followers_count)
        UPDATE public.profiles
        SET followers_count = COALESCE(followers_count, 0) + 1
        WHERE id = NEW.following_id;

        -- Check if mutual follow has been established
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id
        ) INTO is_mutual;

        IF is_mutual THEN
            UPDATE public.profiles
            SET mutuals_count = COALESCE(mutuals_count, 0) + 1
            WHERE id IN (NEW.follower_id, NEW.following_id);
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Update follower (following_count)
        UPDATE public.profiles
        SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1)
        WHERE id = OLD.follower_id;

        -- Update followed user (followers_count)
        UPDATE public.profiles
        SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1)
        WHERE id = OLD.following_id;

        -- Check if mutual follow existed previously and was broken
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = OLD.following_id AND following_id = OLD.follower_id
        ) INTO is_mutual;

        IF is_mutual THEN
            UPDATE public.profiles
            SET mutuals_count = GREATEST(0, COALESCE(mutuals_count, 0) - 1)
            WHERE id IN (OLD.follower_id, OLD.following_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_update_profile_follow_counts ON public.follows;
CREATE TRIGGER tr_update_profile_follow_counts
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.update_profile_follow_counts();

-- 3. Triggers for Follow Notifications
CREATE OR REPLACE FUNCTION public.tr_notify_follow()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_notification(
        NEW.following_id,
        NEW.follower_id,
        'follow',
        NEW.id,
        'profile'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_follow_trigger ON public.follows;
CREATE TRIGGER tr_notify_follow_trigger
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.tr_notify_follow();

-- Reconcile existings profiles stats
UPDATE public.profiles p
SET 
  following_count = (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id),
  followers_count = (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id),
  mutuals_count = (
      SELECT COUNT(*) 
      FROM public.follows f1
      JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = p.id
  );

-- 4. Mutual Detection System RPC Function
CREATE OR REPLACE FUNCTION public.check_mutual(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = user_a AND following_id = user_b
) AND EXISTS (
    SELECT 1 FROM public.follows WHERE follower_id = user_b AND following_id = user_a
);
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Lightweight connection strength scoring RPC Function
CREATE OR REPLACE FUNCTION public.get_connection_strength(user_a UUID, user_b UUID)
RETURNS NUMERIC AS $$
DECLARE
    score NUMERIC := 0;
    has_follow_ab BOOLEAN;
    has_follow_ba BOOLEAN;
    likes_count INT := 0;
    comments_count INT := 0;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.follows WHERE follower_id = user_a AND following_id = user_b) INTO has_follow_ab;
    SELECT EXISTS (SELECT 1 FROM public.follows WHERE follower_id = user_b AND following_id = user_a) INTO has_follow_ba;
    
    -- Follow weights: 10 points for each direction
    IF has_follow_ab THEN score := score + 10; END IF;
    IF has_follow_ba THEN score := score + 10; END IF;
    
    -- Likes weights: 2 points each
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
        SELECT COUNT(*) INTO likes_count FROM public.post_likes pl
        JOIN public.posts p ON pl.post_id = p.id
        WHERE (pl.user_id = user_a AND p.user_id = user_b)
           OR (pl.user_id = user_b AND p.user_id = user_a);
    ELSEIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'likes') THEN
        SELECT COUNT(*) INTO likes_count FROM public.likes l
        JOIN public.posts p ON l.post_id = p.id
        WHERE (l.user_id = user_a AND p.user_id = user_b)
           OR (l.user_id = user_b AND p.user_id = user_a);
    END IF;
    score := score + (likes_count * 2);
    
    -- Comments weights: 5 points each
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        SELECT COUNT(*) INTO comments_count FROM public.comments c
        JOIN public.posts p ON c.post_id = p.id
        WHERE (c.user_id = user_a AND p.user_id = user_b)
           OR (c.user_id = user_b AND p.user_id = user_a);
    END IF;
    score := score + (comments_count * 5);
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Row Level Security (RLS) Rules for follows table
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own follows" ON public.follows;
CREATE POLICY "Users can insert their own follows" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);
