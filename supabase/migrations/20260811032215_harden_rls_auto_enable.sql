-- The event trigger invokes this internally; browser-facing roles never need RPC access.
-- Some fresh projects do not have this dashboard-created helper, so keep the
-- repository migration history replayable without assuming external objects.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public';
    execute 'revoke all on function public.rls_auto_enable() from anon';
    execute 'revoke all on function public.rls_auto_enable() from authenticated';
  end if;
end;
$$;
