-- Create post_shares table for tracking share types
CREATE TABLE IF NOT EXISTS public.post_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    share_type TEXT NOT NULL, -- e.g., 'copy_link', 'internal_message', 'other'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can share posts freely"
    ON public.post_shares FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own shares"
    ON public.post_shares FOR SELECT
    USING (auth.uid() = user_id);

-- Check if shares_count exists on posts table, add it if not
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count INT DEFAULT 0;

-- Drop if exists and create RPC for safe increment
DROP FUNCTION IF EXISTS public.increment_shares_count(UUID);
CREATE OR REPLACE FUNCTION public.increment_shares_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET shares_count = COALESCE(shares_count, 0) + 1
  WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
