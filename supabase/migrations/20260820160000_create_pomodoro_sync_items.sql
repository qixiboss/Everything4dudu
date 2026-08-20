-- Pomodoro 按日同步表：每天一条 day:YYYY-MM-DD 行（包含当天的番茄、专注与休息记录）。
-- 与 training 类似，记录的设置是设备本地偏好，不参与云端同步。
create table if not exists public.pomodoro_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object')
    check (octet_length(payload::text) <= 262144),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, item_key)
);

alter table public.pomodoro_sync_items enable row level security;
grant select, insert, update on public.pomodoro_sync_items to authenticated;
revoke delete, truncate, references, trigger on public.pomodoro_sync_items from authenticated;
revoke all on public.pomodoro_sync_items from anon;

drop policy if exists "read own sync items" on public.pomodoro_sync_items;
create policy "read own sync items" on public.pomodoro_sync_items
for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own sync items" on public.pomodoro_sync_items;
create policy "insert own sync items" on public.pomodoro_sync_items
for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own sync items" on public.pomodoro_sync_items;
create policy "update own sync items" on public.pomodoro_sync_items
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists pomodoro_sync_items_keep_newest on public.pomodoro_sync_items;
create trigger pomodoro_sync_items_keep_newest before insert or update
on public.pomodoro_sync_items for each row execute function public.keep_newest_sync_item();

do $$
begin
  alter publication supabase_realtime add table public.pomodoro_sync_items;
exception when duplicate_object then null;
end;
$$;