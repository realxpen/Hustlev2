-- BUYER RESTRICTIONS
create table if not exists public.buyer_restrictions (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(seller_id, buyer_id)
);

-- RLS
alter table public.buyer_restrictions enable row level security;

create policy "Sellers can view their own restrictions"
  on public.buyer_restrictions for select using (auth.uid() = seller_id);

create policy "Sellers can manage their own restrictions"
  on public.buyer_restrictions for all using (auth.uid() = seller_id);

create policy "Buyers can see if they are restricted by a seller"
  on public.buyer_restrictions for select using (auth.uid() = buyer_id);
