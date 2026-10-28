-- Agora U: seller reviews
-- Run this once in Supabase: SQL Editor, paste, Run. Safe to run more than once.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid references auth.users(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_seller_idx on public.reviews (seller_id);

alter table public.reviews enable row level security;

-- Anyone can read reviews. Only our server writes them, after checking the order was completed.
drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews
  for select using (true);
