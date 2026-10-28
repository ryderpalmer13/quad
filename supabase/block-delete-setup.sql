-- Agora U: blocking users, and keeping order records when an account is deleted.
-- Run this once in Supabase: SQL Editor, paste, Run. Safe to run more than once.

-- 1. Who has blocked whom
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "See own blocks" on public.blocks;
create policy "See own blocks" on public.blocks
  for select to authenticated using (auth.uid() = blocker_id);

drop policy if exists "Block people" on public.blocks;
create policy "Block people" on public.blocks
  for insert to authenticated with check (auth.uid() = blocker_id);

drop policy if exists "Unblock people" on public.blocks;
create policy "Unblock people" on public.blocks
  for delete to authenticated using (auth.uid() = blocker_id);

-- 2. Nobody can message someone who blocked them (or someone they blocked)
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

drop policy if exists "Blocked users cannot message" on public.messages;
create policy "Blocked users cannot message" on public.messages
  as restrictive
  for insert to authenticated
  with check (not public.is_blocked_between(sender_id::uuid, receiver_id::uuid));

-- 3. When an account is deleted, keep its past orders for payment records
alter table public.orders alter column buyer_id drop not null;
alter table public.orders alter column seller_id drop not null;
alter table public.orders drop constraint if exists orders_buyer_id_fkey;
alter table public.orders drop constraint if exists orders_seller_id_fkey;
alter table public.orders
  add constraint orders_buyer_id_fkey foreign key (buyer_id) references auth.users(id) on delete set null;
alter table public.orders
  add constraint orders_seller_id_fkey foreign key (seller_id) references auth.users(id) on delete set null;
