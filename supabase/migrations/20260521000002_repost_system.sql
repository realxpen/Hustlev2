-- Add repost columns to posts table safely
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_repost boolean DEFAULT false NOT NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS repost_comment text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reposts_count integer DEFAULT 0 NOT NULL;

-- Constraint to ensure reposts_count is never negative
ALTER TABLE public.posts ADD CONSTRAINT chk_reposts_count_non_negative CHECK (reposts_count >= 0);

-- Partial unique index to prevent a user from reposting the same original post multiple times
CREATE UNIQUE INDEX IF NOT EXISTS post_reposts_user_original_idx 
ON public.posts (user_id, original_post_id) 
WHERE (is_repost = true);

-- Enable RLS for updated/inserted columns (they inherit from posts table RLS)
-- The existing insert/select/delete policies on public.posts already allow:
-- - Select: Anyone can view posts (reposts will also be viewable!)
-- - Insert: Users can create their own posts (check auth.uid() = user_id)
-- - Delete: Users can delete their own posts (check auth.uid() = user_id)
-- This matches perfectly because a repost IS a post in the posts table!

-- PostgreSQL Function for Atomically Toggling Post Reposts
CREATE OR REPLACE FUNCTION public.toggle_repost(p_post_id uuid, p_comment text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
  v_target_post_id uuid;
  v_target_is_repost boolean;
  v_target_original_post_id uuid;
  v_repost_post_id uuid;
  v_new_count integer;
  v_action text;
BEGIN
  -- Authenticated user validation
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure the source post exists
  SELECT id, is_repost, original_post_id INTO v_target_post_id, v_target_is_repost, v_target_original_post_id
  FROM public.posts
  WHERE id = p_post_id;

  IF v_target_post_id IS NULL THEN
    RAISE EXCEPTION 'Source post not found';
  END IF;

  -- Resolve ultimate original post to prevent repost loops
  IF v_target_is_repost THEN
    v_target_post_id := v_target_original_post_id;
  END IF;

  -- Check if user already reposted this original post
  SELECT EXISTS (
    SELECT 1 FROM public.posts 
    WHERE user_id = v_user_id AND original_post_id = v_target_post_id AND is_repost = true
  ) INTO v_exists;

  IF v_exists THEN
    -- UNREPOST: Delete the repost post(s)
    DELETE FROM public.posts
    WHERE user_id = v_user_id AND original_post_id = v_target_post_id AND is_repost = true;

    -- Decrement reposts_count on original post
    UPDATE public.posts 
    SET reposts_count = GREATEST(0, reposts_count - 1)
    WHERE id = v_target_post_id
    RETURNING reposts_count INTO v_new_count;

    v_action := 'unreposted';
    v_repost_post_id := NULL;
  ELSE
    -- REPOST: Insert the repost as a new post
    INSERT INTO public.posts (user_id, is_repost, original_post_id, repost_comment, caption, media_type)
    VALUES (v_user_id, true, v_target_post_id, p_comment, NULL, 'none')
    RETURNING id INTO v_repost_post_id;

    -- Increment reposts_count on original post
    UPDATE public.posts 
    SET reposts_count = reposts_count + 1
    WHERE id = v_target_post_id
    RETURNING reposts_count INTO v_new_count;

    v_action := 'reposted';
  END IF;

  RETURN jsonb_build_object(
    'action', v_action,
    'original_post_id', v_target_post_id,
    'repost_post_id', v_repost_post_id,
    'reposts_count', COALESCE(v_new_count, 0)
  );
END;
$$;
