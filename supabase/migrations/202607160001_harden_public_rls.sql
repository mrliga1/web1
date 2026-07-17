begin;

-- Chuẩn hóa bản ghi công khai cũ trước khi siết chính sách đọc.
update public.projects
set data = jsonb_set(coalesce(data, '{}'::jsonb), '{approvalStatus}', '"approved"'::jsonb, true)
where coalesce(data->>'approvalStatus', '') = '';

update public.news
set data = jsonb_set(coalesce(data, '{}'::jsonb), '{approvalStatus}', '"approved"'::jsonb, true)
where coalesce(data->>'approvalStatus', '') = '';

delete from public.settings where id = 'github';

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select role::text
  from public.users
  where uid::text = auth.uid()::text
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  table_name text;
  policy_record record;
begin
  foreach table_name in array array[
    'products', 'projects', 'news', 'settings', 'layouts', 'users', 'consultations'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy %I on public.%I', policy_record.policyname, table_name);
    end loop;
  end loop;
end
$$;

create policy "public_read_approved_products"
on public.products for select
to anon, authenticated
using (coalesce(data->>'approvalStatus', 'approved') = 'approved');

create policy "public_read_approved_projects"
on public.projects for select
to anon, authenticated
using (coalesce(data->>'approvalStatus', 'approved') = 'approved');

create policy "public_read_approved_news"
on public.news for select
to anon, authenticated
using (coalesce(data->>'approvalStatus', 'approved') = 'approved');

create policy "public_read_safe_settings"
on public.settings for select
to anon, authenticated
using (id in ('general', 'filters'));

create policy "public_read_layouts"
on public.layouts for select
to anon, authenticated
using (true);

create policy "public_submit_consultations"
on public.consultations for insert
to anon, authenticated
with check (true);

create policy "users_create_own_profile"
on public.users for insert
to authenticated
with check (uid::text = auth.uid()::text and role::text = 'user');

create policy "users_read_own_profile"
on public.users for select
to authenticated
using (uid::text = auth.uid()::text);

create policy "users_update_own_profile"
on public.users for update
to authenticated
using (uid::text = auth.uid()::text)
with check (
  uid::text = auth.uid()::text
  and role::text = public.current_app_role()
);

create policy "admins_manage_products"
on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_projects"
on public.projects for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_news"
on public.news for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_settings"
on public.settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_layouts"
on public.layouts for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_users"
on public.users for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "admins_manage_consultations"
on public.consultations for all to authenticated
using (public.is_admin()) with check (public.is_admin());

commit;
