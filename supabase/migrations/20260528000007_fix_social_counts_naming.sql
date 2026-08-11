-- 20260528000007_fix_social_counts_naming.sql
-- FIX: Standardize social count column names to match frontend expectations (singular)

-- 1. Rename columns in profiles table
ALTER TABLE public.profiles RENAME COLUMN followers_count TO follower_count;
ALTER TABLE public.profiles RENAME COLUMN mutuals_count TO mutual_count;

-- 2. Update the trigger function to use the new column names
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

        -- Update followed user (follower_count)
        UPDATE public.profiles
        SET follower_count = COALESCE(follower_count, 0) + 1
        WHERE id = NEW.following_id;

        -- Check if mutual follow has been established
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = NEW.following_id AND following_id = NEW.follower_id
        ) INTO is_mutual;

        IF is_mutual THEN
            UPDATE public.profiles
            SET mutual_count = COALESCE(mutual_count, 0) + 1
            WHERE id IN (NEW.follower_id, NEW.following_id);
        END IF;

    ELSIF (TG_OP = 'DELETE') THEN
        -- Update follower (following_count)
        UPDATE public.profiles
        SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1)
        WHERE id = OLD.follower_id;

        -- Update followed user (follower_count)
        UPDATE public.profiles
        SET follower_count = GREATEST(0, COALESCE(follower_count, 0) - 1)
        WHERE id = OLD.following_id;

        -- Check if mutual follow existed previously and was broken
        SELECT EXISTS (
            SELECT 1 FROM public.follows
            WHERE follower_id = OLD.following_id AND following_id = OLD.follower_id
        ) INTO is_mutual;

        IF is_mutual THEN
            UPDATE public.profiles
            SET mutual_count = GREATEST(0, COALESCE(mutual_count, 0) - 1)
            WHERE id IN (OLD.follower_id, OLD.following_id);
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-run reconciliation to ensure any stale data is fixed during this migration
UPDATE public.profiles p
SET 
  following_count = (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id),
  follower_count = (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id),
  mutual_count = (
      SELECT COUNT(*) 
      FROM public.follows f1
      JOIN public.follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = p.id
  );
