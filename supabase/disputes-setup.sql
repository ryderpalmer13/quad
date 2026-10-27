-- Lets an order be flagged "disputed" and remembers who reported it and why.
-- Safe to run more than once.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'disputed', 'completed', 'refunded', 'cancelled'));

alter table public.orders add column if not exists disputed_at timestamptz;
alter table public.orders add column if not exists disputed_by uuid;
alter table public.orders add column if not exists dispute_reason text;
