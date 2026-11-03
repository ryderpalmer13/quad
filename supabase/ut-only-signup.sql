-- Agora U: only UT Austin emails can create an account.
-- Run this once in the Supabase SQL editor.
-- It does not change or remove any account that already exists.

create or replace function public.enforce_ut_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d text;
begin
  d := lower(split_part(coalesce(new.email, ''), '@', 2));
  if d <> 'utexas.edu' and d not like '%.utexas.edu' then
    raise exception 'Agora U is open to UT Austin students only. Please use your @utexas.edu email.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_ut_email on auth.users;
create trigger enforce_ut_email
  before insert on auth.users
  for each row execute function public.enforce_ut_email();
