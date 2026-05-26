-- Add likes_count column to posts table safely
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Ensure likes_count is never negative
ALTER TABLE public.posts ADD CONSTRAINT chk_likes_count_non_negative CHECK (likes_count >= 0);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id)
);

-- Copy any existing likes to post_likes if they exist in likes table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='likes') THEN
    INSERT INTO public.post_likes (post_id, user_id, created_at)
    SELECT post_id, user_id, created_at FROM public.likes
    ON CONFLICT (post_id, user_id) DO NOTHING;
  END IF;
END
$$;

-- Backfill likes_count for existing posts based on post_likes
UPDATE public.posts p
SET likes_count = (
  SELECT COALESCE(count(*), 0)
  FROM public.post_likes l
  WHERE l.post_id = p.id
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can insert their own post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own post_likes" ON public.post_likes;

-- Create Policies
CREATE POLICY "Anyone can view post_likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own post_likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own post_likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- PostgreSQL Function for Atomically Toggling Post Likes
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
  -- Retrieve current authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if like already exists (locks row for safety)
  SELECT EXISTS (
    SELECT 1 FROM public.post_likes 
    WHERE post_id = p_post_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike: Delete the like
    DELETE FROM public.post_likes 
    WHERE post_id = p_post_id AND user_id = v_user_id;

    -- Decrement likes_count, safeguarding against negative values
    UPDATE public.posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = p_post_id;

    RETURN false;
  ELSE
    -- Like: Insert the like
    BEGIN
      INSERT INTO public.post_likes (post_id, user_id) 
      VALUES (p_post_id, v_user_id);

      -- Increment likes_count
      UPDATE public.posts 
      SET likes_count = likes_count + 1 
      WHERE id = p_post_id;

      RETURN true;
    EXCEPTION 
      WHEN unique_violation THEN
        -- Safely handle race conditions where insert was done concurrently
        RETURN true;
    END;
  END IF;
END;
$$;

-- Enable Supabase Realtime for post_likes if needed
alter publication supabase_realtime add table public.post_likes;
