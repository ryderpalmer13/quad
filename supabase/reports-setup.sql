-- Agora U: reports (flag bad listings or people)
-- Run this once in Supabase: SQL Editor, paste, Run.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  listing_id text,
  reported_user_id text,
  reason text not null,
  details text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Logged in students can file a report as themselves.
drop policy if exists "Users can file reports" on public.reports;
create policy "Users can file reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- Nobody can read reports from the app. You read them in the Supabase Table Editor.
