-- Create story_reactions table
CREATE TABLE public.story_reactions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reaction_type text check (reaction_type in ('❤️', '🔥', '😂', '😮', '👏')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(story_id, user_id)
);

-- Enable RLS for reactions
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- Reactions Policies
CREATE POLICY "Reactions are viewable by everyone" ON public.story_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reactions" ON public.story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions" ON public.story_reactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.story_reactions
  FOR DELETE USING (auth.uid() = user_id);


-- Create story_replies table
CREATE TABLE public.story_replies (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

-- Enable RLS for replies
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Replies Policies
CREATE POLICY "Users can see replies they sent or received" ON public.story_replies
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send replies as themselves" ON public.story_replies
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status on received replies" ON public.story_replies
  FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id);


-- Enable supabase realtime for updates
alter publication supabase_realtime add table public.story_reactions;
alter publication supabase_realtime add table public.story_replies;
