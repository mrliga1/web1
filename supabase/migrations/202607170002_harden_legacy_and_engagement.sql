begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_app_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select role::text
  from public.users
  where uid::text = (select auth.uid())::text
  limit 1;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
  select coalesce(private.current_app_role() = 'admin', false);
$$;

revoke all on function private.current_app_role() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.current_app_role() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

do $$
declare
  table_name text;
  policy_record record;
begin
  foreach table_name in array array[
    'products', 'projects', 'news', 'settings', 'layouts', 'users', 'consultations',
    'contacts', 'configuration', 'categories', 'activity_logs', 'reviews'
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

drop function if exists public.is_admin();
drop function if exists public.current_app_role();

-- Thu hồi grant mặc định rộng; chỉ cấp lại đúng thao tác ứng dụng cần dùng.
revoke all on all tables in schema public from public, anon, authenticated;

grant select on public.products, public.projects, public.news, public.settings, public.layouts to anon;
grant insert on public.consultations to anon;

grant select, insert, update, delete on
  public.products,
  public.projects,
  public.news,
  public.settings,
  public.layouts,
  public.users,
  public.consultations
to authenticated;

alter default privileges in schema public revoke all on tables from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Nội dung công khai: anon chỉ đọc bản ghi đã duyệt; admin có quyền quản trị riêng.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['products', 'projects', 'news'] loop
    execute format(
      'create policy %I on public.%I for select to anon using '
      || '(coalesce(data->>''approvalStatus'', ''approved'') = ''approved'')',
      'anon_read_approved_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for select to authenticated using '
      || '(coalesce(data->>''approvalStatus'', ''approved'') = ''approved'' or (select private.is_admin()))',
      'authenticated_read_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.is_admin()))',
      'admins_insert_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated '
      || 'using ((select private.is_admin())) with check ((select private.is_admin()))',
      'admins_update_' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.is_admin()))',
      'admins_delete_' || table_name,
      table_name
    );
  end loop;
end
$$;

create policy "anon_read_layouts"
on public.layouts for select
to anon
using (true);

create policy "authenticated_read_layouts"
on public.layouts for select
to authenticated
using (true);

create policy "admins_insert_layouts"
on public.layouts for insert
to authenticated
with check ((select private.is_admin()));

create policy "admins_update_layouts"
on public.layouts for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins_delete_layouts"
on public.layouts for delete
to authenticated
using ((select private.is_admin()));

create policy "anon_read_safe_settings"
on public.settings for select
to anon
using (id in ('general', 'filters'));

create policy "authenticated_read_settings"
on public.settings for select
to authenticated
using (id in ('general', 'filters') or (select private.is_admin()));

create policy "admins_insert_settings"
on public.settings for insert
to authenticated
with check ((select private.is_admin()));

create policy "admins_update_settings"
on public.settings for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins_delete_settings"
on public.settings for delete
to authenticated
using ((select private.is_admin()));

create policy "public_submit_consultations"
on public.consultations for insert
to anon, authenticated
with check (
  jsonb_typeof(data) = 'object'
  and pg_column_size(data) <= 131072
  and char_length(btrim(coalesce(data->>'name', ''))) between 1 and 200
  and (
    char_length(btrim(coalesce(data->>'phone', ''))) between 5 and 50
    or char_length(btrim(coalesce(data->>'email', ''))) between 3 and 320
  )
  and coalesce(data->>'status', 'pending') in ('pending', 'new')
  and char_length(coalesce(data->>'message', '')) <= 5000
  and char_length(coalesce(data->>'demand', '')) <= 5000
  and char_length(coalesce(data->>'propertyTitle', '')) <= 1000
  and (
    not (data ? 'images')
    or (
      jsonb_typeof(data->'images') = 'array'
      and jsonb_array_length(data->'images') <= 5
    )
  )
);

create policy "admins_read_consultations"
on public.consultations for select
to authenticated
using ((select private.is_admin()));

create policy "admins_update_consultations"
on public.consultations for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admins_delete_consultations"
on public.consultations for delete
to authenticated
using ((select private.is_admin()));

create policy "authenticated_read_users"
on public.users for select
to authenticated
using (uid::text = (select auth.uid())::text or (select private.is_admin()));

create policy "authenticated_insert_users"
on public.users for insert
to authenticated
with check (
  (
    uid::text = (select auth.uid())::text
    and role::text = 'user'
  )
  or (select private.is_admin())
);

create policy "authenticated_update_users"
on public.users for update
to authenticated
using (uid::text = (select auth.uid())::text or (select private.is_admin()))
with check (
  (select private.is_admin())
  or (
    uid::text = (select auth.uid())::text
    and role::text = private.current_app_role()
  )
);

create policy "admins_delete_users"
on public.users for delete
to authenticated
using ((select private.is_admin()));

-- Bảng legacy chưa dùng được giữ nguyên dữ liệu nhưng không còn đường truy cập API.
revoke all on
  public.contacts,
  public.configuration,
  public.categories,
  public.activity_logs,
  public.reviews
from anon, authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'contacts', 'configuration', 'categories', 'activity_logs', 'reviews'
  ] loop
    execute format(
      'create policy %I on public.%I for all to anon, authenticated '
      || 'using (false) with check (false)',
      'deny_all_legacy_' || table_name,
      table_name
    );
  end loop;
end
$$;

create table if not exists private.engagement_rate_limits (
  rate_key text primary key,
  action text not null check (action in ('view', 'rating')),
  window_started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  hit_count integer not null default 1 check (hit_count > 0)
);

create index if not exists engagement_rate_limits_last_seen_idx
on private.engagement_rate_limits (last_seen_at);

revoke all on private.engagement_rate_limits from public, anon, authenticated;

create or replace function public.record_content_engagement(
  p_table text,
  p_id text,
  p_action text,
  p_value integer,
  p_rate_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
set row_security = off
as $$
declare
  current_hits integer;
  updated_data jsonb;
  window_size interval;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Không có quyền ghi tương tác' using errcode = '42501';
  end if;

  if p_table is null or p_table not in ('products', 'projects', 'news') then
    raise exception 'Loại nội dung không hợp lệ' using errcode = '22023';
  end if;

  if p_action is null or p_action not in ('view', 'rating') then
    raise exception 'Loại tương tác không hợp lệ' using errcode = '22023';
  end if;

  if p_id is null or char_length(p_id) not between 1 and 200 then
    raise exception 'Mã nội dung không hợp lệ' using errcode = '22023';
  end if;

  if p_rate_key is null or p_rate_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Mã giới hạn tần suất không hợp lệ' using errcode = '22023';
  end if;

  if p_action = 'rating' and (p_value is null or p_value not between 1 and 5) then
    raise exception 'Điểm đánh giá không hợp lệ' using errcode = '22023';
  end if;

  window_size := case when p_action = 'rating' then interval '24 hours' else interval '15 minutes' end;

  insert into private.engagement_rate_limits as limits (
    rate_key,
    action,
    window_started_at,
    last_seen_at,
    hit_count
  ) values (
    p_rate_key,
    p_action,
    now(),
    now(),
    1
  )
  on conflict (rate_key) do update
  set
    action = excluded.action,
    window_started_at = case
      when limits.window_started_at < now() - window_size then now()
      else limits.window_started_at
    end,
    last_seen_at = now(),
    hit_count = case
      when limits.window_started_at < now() - window_size then 1
      else limits.hit_count + 1
    end
  returning hit_count into current_hits;

  if current_hits = 1 then
    if p_action = 'view' then
      execute format(
        'update public.%I '
        || 'set data = jsonb_set('
        || 'coalesce(data, ''{}''::jsonb), '
        || '''{viewsCount}'', '
        || 'to_jsonb(case when coalesce(data->>''viewsCount'', '''') ~ ''^[0-9]+$'' '
        || 'then (data->>''viewsCount'')::bigint + 1 else 1 end), true) '
        || 'where id = $1 and coalesce(data->>''approvalStatus'', ''approved'') = ''approved'' '
        || 'returning data',
        p_table
      ) using p_id into updated_data;
    else
      execute format(
        'update public.%I '
        || 'set data = jsonb_set('
        || 'jsonb_set(coalesce(data, ''{}''::jsonb), ''{userTotalRating}'', '
        || 'to_jsonb(case when coalesce(data->>''userTotalRating'', '''') ~ ''^[0-9]+$'' '
        || 'then (data->>''userTotalRating'')::bigint + $2 else $2::bigint end), true), '
        || '''{userReviewCount}'', '
        || 'to_jsonb(case when coalesce(data->>''userReviewCount'', '''') ~ ''^[0-9]+$'' '
        || 'then (data->>''userReviewCount'')::bigint + 1 else 1 end), true) '
        || 'where id = $1 and coalesce(data->>''approvalStatus'', ''approved'') = ''approved'' '
        || 'returning data',
        p_table
      ) using p_id, p_value into updated_data;
    end if;
  else
    execute format(
      'select data from public.%I '
      || 'where id = $1 and coalesce(data->>''approvalStatus'', ''approved'') = ''approved''',
      p_table
    ) using p_id into updated_data;
  end if;

  if updated_data is null then
    raise exception 'Không tìm thấy nội dung công khai' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'accepted', current_hits = 1,
    'viewsCount', case
      when coalesce(updated_data->>'viewsCount', '') ~ '^[0-9]+$'
      then (updated_data->>'viewsCount')::bigint
      else 0
    end,
    'userTotalRating', case
      when coalesce(updated_data->>'userTotalRating', '') ~ '^[0-9]+$'
      then (updated_data->>'userTotalRating')::bigint
      else 0
    end,
    'userReviewCount', case
      when coalesce(updated_data->>'userReviewCount', '') ~ '^[0-9]+$'
      then (updated_data->>'userReviewCount')::bigint
      else 0
    end
  );
end;
$$;

revoke all on function public.record_content_engagement(text, text, text, integer, text)
from public, anon, authenticated;
grant execute on function public.record_content_engagement(text, text, text, integer, text)
to service_role;

commit;
