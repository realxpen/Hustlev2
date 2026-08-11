-- Add missing columns for profile completion
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer default 0,
ADD COLUMN IF NOT EXISTS has_completed_initial_onboarding boolean default true,
ADD COLUMN IF NOT EXISTS has_completed_profile_setup boolean default false;

-- Update the handle_new_user trigger function to set these defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    role,
    has_completed_initial_onboarding,
    has_completed_profile_setup,
    profile_completion_percentage
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'user',
    true,
    false,
    0
  );
  
  INSERT INTO public.onboarding_status (user_id, step)
  VALUES (new.id, 'started');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
