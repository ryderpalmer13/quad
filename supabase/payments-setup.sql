-- Agora U: in app payments (escrow with a handoff code)
-- Run this once in Supabase: SQL Editor, paste everything, Run.
-- Nothing here can be written from the app by a student. Only our server writes these tables.

-- One row per seller who has set up payouts with Stripe.
create table if not exists public.seller_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  details_submitted boolean not null default false,
  payouts_ready boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.seller_accounts enable row level security;

drop policy if exists "Sellers can read their own payout status" on public.seller_accounts;
create policy "Sellers can read their own payout status"
  on public.seller_accounts for select
  to authenticated
  using (auth.uid() = user_id);

-- One row per purchase.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  listing_title text not null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null,
  fee_cents integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'completed', 'refunded', 'cancelled')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  failed_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  completed_at timestamptz
);

create index if not exists orders_buyer_idx on public.orders (buyer_id);
create index if not exists orders_seller_idx on public.orders (seller_id);
create index if not exists orders_listing_idx on public.orders (listing_id);

alter table public.orders enable row level security;

drop policy if exists "Buyers and sellers can read their orders" on public.orders;
create policy "Buyers and sellers can read their orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- The secret handoff code. No policies on purpose, so nobody can read it from the app.
-- Only our server reads it, and it shows it to the buyer only.
create table if not exists public.order_secrets (
  order_id uuid primary key references public.orders(id) on delete cascade,
  code text not null
);

alter table public.order_secrets enable row level security;
