-- One item is a mergeable unit of state (a training day, schedule task, etc.).
-- The client may safely send stale retries: the trigger keeps the newer copy.
create table if not exists public.sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  app_id text not null check (app_id in ('words', 'training', 'exam-schedule')),
  item_key text not null check (char_length(item_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, app_id, item_key)
);

alter table public.sync_items enable row level security;
grant select, insert, update on public.sync_items to authenticated;
revoke all on public.sync_items from anon;

drop policy if exists "read own sync items" on public.sync_items;
create policy "read own sync items" on public.sync_items
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "insert own sync items" on public.sync_items;
create policy "insert own sync items" on public.sync_items
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "update own sync items" on public.sync_items;
create policy "update own sync items" on public.sync_items
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.keep_newest_sync_item()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.updated_at > new.updated_at then
    return old;
  end if;
  new.updated_at = coalesce(new.updated_at, now());
  return new;
end;
$$;

revoke all on function public.keep_newest_sync_item() from public;

drop trigger if exists sync_items_keep_newest on public.sync_items;
create trigger sync_items_keep_newest
before update on public.sync_items
for each row execute function public.keep_newest_sync_item();

do $$
begin
  alter publication supabase_realtime add table public.sync_items;
exception when duplicate_object then
  null;
end;
$$;
