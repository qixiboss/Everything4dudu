-- One cloud profile per authenticated WordTales learner.
-- This table is exposed through the Data API, so RLS and explicit grants are required.
create table if not exists public.learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_profiles enable row level security;

grant select, insert, update on public.learning_profiles to authenticated;
revoke all on public.learning_profiles from anon;

drop policy if exists "read own learning profile" on public.learning_profiles;
create policy "read own learning profile"
on public.learning_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "create own learning profile" on public.learning_profiles;
create policy "create own learning profile"
on public.learning_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update own learning profile" on public.learning_profiles;
create policy "update own learning profile"
on public.learning_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.set_learning_profiles_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_learning_profiles_updated_at() from public;

drop trigger if exists learning_profiles_set_updated_at on public.learning_profiles;
create trigger learning_profiles_set_updated_at
before update on public.learning_profiles
for each row execute function public.set_learning_profiles_updated_at();
