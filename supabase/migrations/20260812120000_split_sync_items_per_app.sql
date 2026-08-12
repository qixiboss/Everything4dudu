-- 一张 sync_items 拆成三张按应用隔离的表（words/training/exam_sync_items），
-- 每张表不再需要 app_id 列，主键 (user_id, item_key)。防护逐表复制：
-- RLS、payload 大小约束、keep_newest_sync_item 时间戳守卫触发器、realtime。
-- 一次性迁移：先在 SQL 编辑器执行本文件（含数据搬迁与删旧表，不可重复运行），
-- 再在 Data API 暴露三张新表（旧表的暴露随删表移除）。

create table if not exists public.words_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object')
    check (octet_length(payload::text) <= 262144),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, item_key)
);

create table if not exists public.training_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object')
    check (octet_length(payload::text) <= 262144),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, item_key)
);

create table if not exists public.exam_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object')
    check (octet_length(payload::text) <= 262144),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, item_key)
);

-- RLS：三张表同一套策略（只读写自己的行）。
do $$
declare t text;
begin
  foreach t in array array['words_sync_items', 'training_sync_items', 'exam_sync_items']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "read own sync items" on public.%I', t);
    execute format('create policy "read own sync items" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('drop policy if exists "insert own sync items" on public.%I', t);
    execute format('create policy "insert own sync items" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('drop policy if exists "update own sync items" on public.%I', t);
    execute format('create policy "update own sync items" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('drop trigger if exists %I on public.%I', t || '_keep_newest', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.keep_newest_sync_item()', t || '_keep_newest', t);
  end loop;
end;
$$;

-- realtime：三张表都进 supabase_realtime publication。
do $$
begin
  alter publication supabase_realtime add table public.words_sync_items;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.training_sync_items;
exception when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.exam_sync_items;
exception when duplicate_object then null;
end;
$$;

-- 数据搬迁：按 app_id 拆分到各自的表（先搬迁、后删旧表）。
insert into public.words_sync_items (user_id, item_key, payload, updated_at, deleted_at)
select user_id, item_key, payload, updated_at, deleted_at
from public.sync_items where app_id = 'words';

insert into public.training_sync_items (user_id, item_key, payload, updated_at, deleted_at)
select user_id, item_key, payload, updated_at, deleted_at
from public.sync_items where app_id = 'training';

insert into public.exam_sync_items (user_id, item_key, payload, updated_at, deleted_at)
select user_id, item_key, payload, updated_at, deleted_at
from public.sync_items where app_id = 'exam-schedule';

-- 旧表删除（keep_newest_sync_item 函数保留，三张新表共用）。
drop table public.sync_items;
