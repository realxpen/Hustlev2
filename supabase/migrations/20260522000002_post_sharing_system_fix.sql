-- Create post_shares table
CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_type text NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add shares_count column to posts table safely
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0 NOT NULL;

-- Enable RLS
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view share activity" ON public.post_shares;
CREATE POLICY "Anyone can view share activity" ON public.post_shares FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own share tracking" ON public.post_shares;
CREATE POLICY "Users can create their own share tracking" ON public.post_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment shares count
CREATE OR REPLACE FUNCTION public.increment_shares_count(post_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET shares_count = shares_count + 1
  WHERE id = post_id_param;
END;
$$;
