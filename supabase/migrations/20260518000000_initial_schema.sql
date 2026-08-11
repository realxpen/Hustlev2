-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USER_ROLES
create table public.user_roles (
  id text primary key,
  description text
);

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  role text references public.user_roles(id),
  interests text[],
  has_completed_onboarding boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ONBOARDING_STATUS
create table public.onboarding_status (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  step text not null default 'initial',
  completed_at timestamp with time zone
);

-- Insert default roles
insert into public.user_roles (id, description) values
  ('user', 'Standard user'),
  ('creator', 'Creator with monetization enabled'),
  ('admin', 'Platform administrator');

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.onboarding_status enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);
create policy "Users can insert their own profile." 
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." 
  on public.profiles for update using (auth.uid() = id);

-- Onboarding Policies
create policy "Users can view own onboarding status." 
  on public.onboarding_status for select using (auth.uid() = user_id);
create policy "Users can insert own onboarding status." 
  on public.onboarding_status for insert with check (auth.uid() = user_id);
create policy "Users can update own onboarding status." 
  on public.onboarding_status for update using (auth.uid() = user_id);

-- User Roles Policies
create policy "Roles are viewable by everyone." 
  on public.user_roles for select using (true);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'user'
  );
  
  insert into public.onboarding_status (user_id, step)
  values (new.id, 'started');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
