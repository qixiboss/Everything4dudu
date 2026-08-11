-- Bound browser-controlled state and keep client clock skew from freezing a row.
alter table public.sync_items
  drop constraint if exists sync_items_payload_size_check;

alter table public.sync_items
  add constraint sync_items_payload_size_check
  check (octet_length(payload::text) <= 262144) not valid;

create or replace function public.keep_newest_sync_item()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at = coalesce(new.updated_at, now());

  -- A badly skewed or malicious client clock must not make the row immutable.
  if tg_op = 'UPDATE' and old.updated_at > now() + interval '5 minutes' then
    new.updated_at = now();
    return new;
  end if;
  if new.updated_at > now() + interval '5 minutes' then
    new.updated_at = now();
  end if;
  if tg_op = 'UPDATE' and old.updated_at > new.updated_at then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.keep_newest_sync_item() from public;
