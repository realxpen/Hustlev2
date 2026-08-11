-- Create stories table
CREATE TABLE public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_url text,
  media_type text not null check (media_type in ('image', 'video', 'text')),
  caption text,
  background_music_url text,
  sticker_data jsonb,
  story_type text default 'general' check (story_type in ('service', 'product', 'training', 'general')),
  linked_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null,
  is_active boolean default true
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Stories Policies
CREATE POLICY "Stories are viewable by everyone" ON public.stories
  FOR SELECT USING (true); -- Real visibility filtering will happen at the query level or edge function

CREATE POLICY "Users can insert their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- Create story views table
CREATE TABLE public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Story Views Policies
CREATE POLICY "Users can see views on their stories" ON public.story_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    ) OR viewer_id = auth.uid()
  );

CREATE POLICY "Users can record their own views" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Enable realtime
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.story_views;
