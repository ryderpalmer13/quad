-- Agora U: messaging opens only after an order.
-- Run this once in the Supabase SQL editor.
--
-- Two students can message each other when ANY of these is true:
--   1. They have an order together that is paid, completed, or disputed.
--   2. They have already exchanged messages (so ongoing conversations keep working).
--   3. The person being messaged has an unsold listing under $3.00
--      (those items are arranged in person, so they have no checkout).

create or replace function public.can_message(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from public.orders o
      where o.status in ('paid', 'completed', 'disputed')
        and (
          (o.buyer_id::text = a::text and o.seller_id::text = b::text)
          or (o.seller_id::text = a::text and o.buyer_id::text = b::text)
        )
    )
    or exists (
      select 1 from public.messages m
      where (m.sender_id::text = a::text and m.receiver_id::text = b::text)
         or (m.sender_id::text = b::text and m.receiver_id::text = a::text)
    )
    or exists (
      select 1 from public.listings l
      where l.user_id::text = b::text
        and coalesce(l.sold, false) = false
        and l.price::numeric < 3
    );
$$;

grant execute on function public.can_message(uuid, uuid) to authenticated;

-- A restrictive policy is combined with the existing ones, so it only adds the rule.
drop policy if exists "Messaging needs an order" on public.messages;
create policy "Messaging needs an order" on public.messages
  as restrictive
  for insert to authenticated
  with check (public.can_message(sender_id::uuid, receiver_id::uuid));
