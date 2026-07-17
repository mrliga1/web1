begin;

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
  request_role text;
  request_claims text;
begin
  request_claims := nullif(current_setting('request.jwt.claims', true), '');
  request_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    case
      when request_claims is not null then request_claims::jsonb ->> 'role'
      else null
    end,
    nullif(current_setting('role', true), '')
  );

  if request_role <> 'service_role' then
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
