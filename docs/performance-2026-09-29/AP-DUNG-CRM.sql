-- Áp dụng CRM lên cơ sở dữ liệu đang chạy; giao dịch hoàn tác nếu có lỗi.
-- Nguồn: supabase/migrations/20260930164042_atomic_crm_updates.sql.
begin;
set local statement_timeout='30s';
set local lock_timeout='5s';
lock table public.consultations in share row exclusive mode;
create temporary table crm_release_before on commit drop as select id,data from public.consultations;

-- Cập nhật từng trường của hồ sơ khách trong một lệnh SQL để tránh ghi đè thay đổi đồng thời.
create or replace function public.patch_consultation(p_id text, p_patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  updated_data jsonb;
begin
  if p_id is null or length(p_id) > 200 or p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise exception 'Dữ liệu cập nhật khách hàng không hợp lệ' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_object_keys(p_patch) as fields(name)
    where name not in ('status', 'priority', 'assignee', 'notes', 'expectedValue', 'nextFollowUpAt')) then
    raise exception 'Trường khách hàng không được phép cập nhật' using errcode = '22023';
  end if;
  if p_patch ? 'status' and coalesce(p_patch->>'status', '') not in ('new', 'contacted', 'negotiating', 'won', 'lost', 'pending', 'processed') then
    raise exception 'Giai đoạn khách hàng không hợp lệ' using errcode = '22023';
  end if;
  if p_patch ? 'priority' and coalesce(p_patch->>'priority', '') not in ('high', 'medium', 'low') then
    raise exception 'Mức độ ưu tiên không hợp lệ' using errcode = '22023';
  end if;
  if length(coalesce(p_patch->>'notes', '')) > 10000 or length(coalesce(p_patch->>'assignee', '')) > 320 then
    raise exception 'Nội dung cập nhật vượt giới hạn' using errcode = '22023';
  end if;
  if p_patch ? 'assignee' and (select private.current_app_role()) not in ('admin', 'editor') then
    raise exception 'Chỉ quản lý được phân công khách hàng' using errcode = '42501';
  end if;
  if p_patch ? 'expectedValue' and (jsonb_typeof(p_patch->'expectedValue') <> 'number' or (p_patch->>'expectedValue')::numeric < 0) then
    raise exception 'Giá trị dự kiến không hợp lệ' using errcode = '22023';
  end if;
  if p_patch ? 'nextFollowUpAt' and p_patch->'nextFollowUpAt' <> 'null'::jsonb then
    perform (p_patch->>'nextFollowUpAt')::timestamptz;
  end if;
  if p_patch->>'status' = 'pending' then p_patch := jsonb_set(p_patch, '{status}', '"new"'::jsonb); end if;
  if p_patch->>'status' = 'processed' then p_patch := jsonb_set(p_patch, '{status}', '"contacted"'::jsonb); end if;

  update public.consultations
  set data = coalesce(data, '{}'::jsonb) || p_patch || jsonb_build_object('updatedAt', clock_timestamp())
  where id::text = p_id
  returning data into updated_data;

  if updated_data is null then
    raise exception 'Không tìm thấy khách hàng hoặc không có quyền cập nhật' using errcode = 'P0002';
  end if;
  return updated_data;
end;
$$;

-- Thêm ghi chú bằng phép nối mảng nguyên tử; thời điểm và tác giả do máy chủ xác định.
create or replace function public.append_consultation_care_history(p_id text, p_note text)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  history_item jsonb;
  updated_data jsonb;
begin
  if p_id is null or length(p_id) > 200 or p_note is null or length(btrim(p_note)) < 1 or length(p_note) > 3000 then
    raise exception 'Ghi chú chăm sóc không hợp lệ' using errcode = '22023';
  end if;

  history_item := jsonb_build_object(
    'time', floor(extract(epoch from clock_timestamp()) * 1000)::bigint,
    'note', btrim(p_note),
    'author', coalesce(nullif(private.current_app_email(), ''), auth.uid()::text)
  );

  update public.consultations
  set data = jsonb_set(
    coalesce(data, '{}'::jsonb),
    '{careHistory}',
    case when jsonb_typeof(data->'careHistory') = 'array'
      then data->'careHistory' || jsonb_build_array(history_item)
      else jsonb_build_array(history_item)
    end,
    true
  )
  where id::text = p_id
  returning data into updated_data;

  if updated_data is null then
    raise exception 'Không tìm thấy khách hàng hoặc không có quyền cập nhật' using errcode = 'P0002';
  end if;
  return updated_data;
end;
$$;

revoke all on function public.patch_consultation(text, jsonb) from public, anon;
revoke all on function public.append_consultation_care_history(text, text) from public, anon;
grant execute on function public.patch_consultation(text, jsonb) to authenticated;
grant execute on function public.append_consultation_care_history(text, text) to authenticated;

-- Áp dụng giới hạn cả khi trình duyệt gọi cập nhật bảng trực tiếp, không chỉ qua RPC.
create or replace function private.guard_consultation_update()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public as $$
declare
  old_history jsonb;
  new_history jsonb;
  entry jsonb;
  app_role text;
begin
  if current_user <> 'authenticated' then return new; end if;
  app_role := coalesce(private.current_app_role(), '');
  if app_role not in ('admin', 'editor', 'member') or new.id is distinct from old.id then
    raise exception 'Không có quyền sửa hồ sơ khách hàng' using errcode = '42501';
  end if;
  if exists (select 1 from jsonb_object_keys(coalesce(old.data, '{}'::jsonb) || coalesce(new.data, '{}'::jsonb)) as fields(name)
    where old.data->name is distinct from new.data->name
      and name not in ('status', 'priority', 'assignee', 'notes', 'expectedValue', 'nextFollowUpAt', 'careHistory', 'updatedAt')) then
    raise exception 'Trường khách hàng không được phép cập nhật' using errcode = '22023';
  end if;
  if old.data->'assignee' is distinct from new.data->'assignee' and app_role not in ('admin', 'editor') then
    raise exception 'Chỉ quản lý được phân công khách hàng' using errcode = '42501';
  end if;
  if old.data->'status' is distinct from new.data->'status'
    and coalesce(new.data->>'status', '') not in ('new', 'contacted', 'negotiating', 'won', 'lost', 'pending', 'processed') then
    raise exception 'Giai đoạn khách hàng không hợp lệ' using errcode = '22023';
  end if;
  if old.data->'priority' is distinct from new.data->'priority'
    and coalesce(new.data->>'priority', '') not in ('high', 'medium', 'low') then
    raise exception 'Mức độ ưu tiên không hợp lệ' using errcode = '22023';
  end if;
  if old.data->'careHistory' is distinct from new.data->'careHistory' then
    old_history := case when jsonb_typeof(old.data->'careHistory') = 'array' then old.data->'careHistory' else '[]'::jsonb end;
    new_history := new.data->'careHistory';
    if jsonb_typeof(new_history) is distinct from 'array' then
      raise exception 'Lịch sử chăm sóc chỉ được thêm mới' using errcode = '22023';
    end if;
    if jsonb_array_length(new_history) <> jsonb_array_length(old_history) + 1
      or new_history - jsonb_array_length(old_history) <> old_history then
      raise exception 'Lịch sử chăm sóc chỉ được thêm mới' using errcode = '22023';
    end if;
    entry := new_history->jsonb_array_length(old_history);
    if jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry->'note') is distinct from 'string'
      or length(btrim(entry->>'note')) not between 1 and 3000
      or jsonb_typeof(entry->'time') is distinct from 'number' then
      raise exception 'Danh tính hoặc ghi chú chăm sóc không hợp lệ' using errcode = '22023';
    end if;
    if abs((entry->>'time')::numeric - extract(epoch from clock_timestamp()) * 1000) > 60000 then
      raise exception 'Thời điểm chăm sóc không hợp lệ' using errcode = '22023';
    end if;
    -- Chuẩn hóa tác giả từ phiên thật để tương thích cách ghi tên của ứng dụng cũ.
    entry := jsonb_build_object('note', btrim(entry->>'note'), 'time', entry->'time',
      'author', coalesce(nullif(private.current_app_email(), ''), auth.uid()::text));
    new.data := jsonb_set(new.data, '{careHistory}', old_history || jsonb_build_array(entry), true);
  end if;
  new.data := jsonb_set(new.data, '{updatedAt}', to_jsonb(clock_timestamp()), true);
  return new;
end;
$$;
revoke all on function private.guard_consultation_update() from public, anon;
grant execute on function private.guard_consultation_update() to authenticated;
drop trigger if exists guard_consultation_update on public.consultations;
create trigger guard_consultation_update before update on public.consultations
for each row execute function private.guard_consultation_update();

-- Nhật ký riêng, chỉ máy chủ ghi; quyền đọc bám theo quyền xem khách hàng hiện tại.
create table if not exists public.consultation_activity (
  id bigint generated always as identity primary key,
  lead_id text not null,
  changed_fields jsonb not null,
  author text not null,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists consultation_activity_lead_time_idx on public.consultation_activity (lead_id, id desc);
alter table public.consultation_activity enable row level security;
revoke all on public.consultation_activity from public, anon, authenticated;
grant select on public.consultation_activity to authenticated;
grant all on public.consultation_activity to service_role;
drop policy if exists "crm_read_visible_activity" on public.consultation_activity;
create policy "crm_read_visible_activity" on public.consultation_activity for select to authenticated
using (exists (select 1 from public.consultations c where c.id::text = lead_id));

create or replace function private.record_consultation_activity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare changes jsonb;
begin
  select jsonb_object_agg(field, jsonb_build_object('before', old.data->field, 'after', new.data->field))
  into changes
  from unnest(array['status', 'assignee', 'priority', 'notes', 'expectedValue', 'nextFollowUpAt']) as fields(field)
  where old.data->field is distinct from new.data->field;
  if changes is not null then
    insert into public.consultation_activity (lead_id, changed_fields, author)
    values (new.id::text, changes, coalesce(nullif(private.current_app_email(), ''), auth.uid()::text, 'Hệ thống'));
  end if;
  return new;
end;
$$;
revoke all on function private.record_consultation_activity() from public, anon, authenticated;
drop trigger if exists record_consultation_activity on public.consultations;
create trigger record_consultation_activity after update on public.consultations
for each row execute function private.record_consultation_activity();

-- Phân trang và tổng hợp tại cơ sở dữ liệu; mỗi vai trò chỉ tính trên các khách được RLS cho phép xem.
create or replace function private.crm_follow_up_due(p_value text)
returns boolean language plpgsql stable set search_path = pg_catalog as $$
begin
  return coalesce(nullif(p_value, '')::timestamptz <= now(), false);
exception when invalid_datetime_format or datetime_field_overflow then return false;
end;
$$;
revoke all on function private.crm_follow_up_due(text) from public, anon;
grant execute on function private.crm_follow_up_due(text) to authenticated;

create or replace function public.query_consultations(
  p_search text default '', p_status text default 'all', p_assignee text default '',
  p_due boolean default false, p_page integer default 1, p_page_size integer default 25
)
returns jsonb language plpgsql security invoker set search_path = pg_catalog, public as $$
declare result jsonb;
begin
  if coalesce((select private.current_app_role()), '') not in ('admin', 'editor', 'member') then
    raise exception 'Không có quyền truy cập CRM' using errcode = '42501';
  end if;
  if p_search is null or length(p_search) > 200 or p_status is null or p_status not in ('all', 'new', 'contacted', 'negotiating', 'won', 'lost')
    or length(coalesce(p_assignee, '')) > 320 or p_page is null or p_page < 1 or p_page > 100000
    or p_page_size is null or p_page_size not in (25, 50, 100) then
    raise exception 'Bộ lọc khách hàng không hợp lệ' using errcode = '22023';
  end if;
  with visible as materialized (
    select id, data,
      case data->>'status' when 'pending' then 'new' when 'processed' then 'contacted' else coalesce(data->>'status', 'new') end as stage,
      private.crm_follow_up_due(data->>'nextFollowUpAt') as due
    from public.consultations
  ), matched as (
    select * from visible
    where (p_status = 'all' or stage = p_status)
      and (coalesce(p_assignee, '') = '' or lower(coalesce(data->>'assignee', '')) = lower(p_assignee))
      and (not coalesce(p_due, false) or (due and stage not in ('won', 'lost')))
      and (btrim(p_search) = '' or position(lower(btrim(p_search)) in lower(concat_ws(' ',
        data->>'name', data->>'phone', data->>'email', data->>'propertyTitle', data->>'demand', data->>'message'))) > 0)
  ), page_rows as (
    select id, data from matched order by data->>'createdAt' desc nulls last, id desc
    limit p_page_size offset ((p_page - 1) * p_page_size)
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'data', data)) from page_rows), '[]'::jsonb),
    'total', (select count(*) from matched),
    'stats', (select jsonb_build_object(
      'total', count(*), 'new', count(*) filter (where stage = 'new'),
      'contacted', count(*) filter (where stage = 'contacted'),
      'negotiating', count(*) filter (where stage = 'negotiating'),
      'won', count(*) filter (where stage = 'won'), 'lost', count(*) filter (where stage = 'lost'),
      'due', count(*) filter (where due and stage not in ('won', 'lost'))
    ) from visible)
  ) into result;
  return result;
end;
$$;
revoke all on function public.query_consultations(text, text, text, boolean, integer, integer) from public, anon;
grant execute on function public.query_consultations(text, text, text, boolean, integer, integer) to authenticated;
create index if not exists consultations_created_at_idx on public.consultations ((data->>'createdAt') desc, id desc);

-- Kiểm tra migration không thay đổi bất kỳ hồ sơ khách hiện có nào.
do $$
begin
  if exists (select 1 from (
    (select id,data from public.consultations except select id,data from crm_release_before)
    union all
    (select id,data from crm_release_before except select id,data from public.consultations)
  ) changes) then raise exception 'Dữ liệu khách thay đổi trong lúc nâng cấp, giao dịch đã bị hủy'; end if;
end $$;
notify pgrst, 'reload schema';
commit;
select jsonb_build_object(
  'crm_migration_applied',true,
  'lead_count',(select count(*) from public.consultations),
  'query_rpc_exists',to_regprocedure('public.query_consultations(text,text,text,boolean,integer,integer)') is not null,
  'patch_rpc_exists',to_regprocedure('public.patch_consultation(text,jsonb)') is not null,
  'history_rpc_exists',to_regprocedure('public.append_consultation_care_history(text,text)') is not null
) as crm_release_status;
