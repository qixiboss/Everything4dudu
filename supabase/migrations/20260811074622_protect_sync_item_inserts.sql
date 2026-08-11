-- Apply the timestamp guard to both new rows and subsequent updates.
drop trigger if exists sync_items_keep_newest on public.sync_items;

create trigger sync_items_keep_newest
before insert or update on public.sync_items
for each row execute function public.keep_newest_sync_item();
