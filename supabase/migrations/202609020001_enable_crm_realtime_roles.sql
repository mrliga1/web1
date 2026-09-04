begin;

create or replace function private.current_app_email()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select lower(coalesce(email::text, ''))
  from public.users
  where uid::text = (select auth.uid())::text
  limit 1;
$$;

revoke all on function private.current_app_email() from public, anon;
grant execute on function private.current_app_email() to authenticated, service_role;

drop policy if exists "admins_read_consultations" on public.consultations;
drop policy if exists "admins_update_consultations" on public.consultations;
drop policy if exists "admins_delete_consultations" on public.consultations;
drop policy if exists "crm_staff_read_consultations" on public.consultations;
drop policy if exists "crm_staff_update_consultations" on public.consultations;

create policy "crm_staff_read_consultations"
on public.consultations for select
to authenticated
using (
  (select private.current_app_role()) in ('admin', 'editor')
  or (
    (select private.current_app_role()) = 'member'
    and (select private.current_app_email()) <> ''
    and lower(substring(coalesce(data->>'assignee', '') from '[A-Za-z0-9._%+''-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')) = (select private.current_app_email())
  )
);

create policy "crm_staff_update_consultations"
on public.consultations for update
to authenticated
using (
  (select private.current_app_role()) in ('admin', 'editor')
  or (
    (select private.current_app_role()) = 'member'
    and (select private.current_app_email()) <> ''
    and lower(substring(coalesce(data->>'assignee', '') from '[A-Za-z0-9._%+''-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')) = (select private.current_app_email())
  )
)
with check (
  (select private.current_app_role()) in ('admin', 'editor')
  or (
    (select private.current_app_role()) = 'member'
    and (select private.current_app_email()) <> ''
    and lower(substring(coalesce(data->>'assignee', '') from '[A-Za-z0-9._%+''-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')) = (select private.current_app_email())
  )
);

create policy "admins_delete_consultations"
on public.consultations for delete
to authenticated
using ((select private.current_app_role()) = 'admin');

drop policy if exists "authenticated_read_users" on public.users;
drop policy if exists "crm_staff_read_users" on public.users;
create policy "crm_staff_read_users"
on public.users for select
to authenticated
using (
  uid::text = (select auth.uid())::text
  or (select private.current_app_role()) in ('admin', 'editor')
);

alter table public.consultations replica identity full;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array['consultations', 'products', 'projects', 'news', 'settings', 'layouts']
  loop
    if not exists (
      select 1
      from pg_publication_tables as ppt
      where ppt.pubname = 'supabase_realtime'
        and ppt.schemaname = 'public'
        and ppt.tablename = realtime_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
end
$$;

commit;
