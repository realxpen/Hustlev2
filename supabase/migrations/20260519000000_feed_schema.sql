-- Create Posts Table
CREATE TABLE public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    caption TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'none')) DEFAULT 'none' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Likes Table
CREATE TABLE public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, post_id)
);

-- Create Comments Table
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Followers Table (for personalization placeholder)
CREATE TABLE public.followers (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_posts_modtime
BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_comments_modtime
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Policies

-- Posts
CREATE POLICY "Anyone can view posts"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "Anyone can view likes"
  ON public.likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Followers
CREATE POLICY "Anyone can view followers"
  ON public.followers FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own followers"
  ON public.followers FOR ALL
  USING (auth.uid() = follower_id);

-- Create feed bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('feed', 'feed', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for feed
CREATE POLICY "Feed media are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed');

CREATE POLICY "Anyone can upload feed media."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'feed' AND auth.uid() = owner);

CREATE POLICY "Anyone can update their own feed media."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'feed' AND auth.uid() = owner);

CREATE POLICY "Anyone can delete their own feed media."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'feed' AND auth.uid() = owner);
