-- Existing rows were checked before this validation migration was applied.
alter table public.sync_items
  validate constraint sync_items_payload_size_check;
