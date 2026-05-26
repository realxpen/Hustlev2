-- Add cover_url to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cover_url text;
