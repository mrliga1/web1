-- Chỉ đọc cấu trúc, quyền hiện có và số lượng hồ sơ trước khi nâng cấp CRM.
select jsonb_build_object(
  'captured_at', now(),
  'database_version', current_setting('server_version'),
  'lead_count', (select count(*) from public.consultations),
  'relations', (select jsonb_agg(jsonb_build_object(
    'name', c.relname, 'rls_enabled', c.relrowsecurity, 'rls_forced', c.relforcerowsecurity,
    'columns', (select jsonb_agg(jsonb_build_object('name', a.attname, 'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull)) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
    'constraints', (select jsonb_agg(pg_get_constraintdef(k.oid)) from pg_constraint k where k.conrelid=c.oid),
    'indexes', (select jsonb_agg(indexdef) from pg_indexes i where i.schemaname='public' and i.tablename=c.relname),
    'policies', (select jsonb_agg(to_jsonb(p)) from pg_policies p where p.schemaname='public' and p.tablename=c.relname),
    'triggers', (select jsonb_agg(pg_get_triggerdef(t.oid)) from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal),
    'grants', (select jsonb_agg(jsonb_build_object('role', g.grantee, 'privilege', g.privilege_type)) from information_schema.role_table_grants g where g.table_schema='public' and g.table_name=c.relname)
  )) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('consultations','users','consultation_activity')),
  'functions', (select jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', p.proname, 'definition', pg_get_functiondef(p.oid), 'grants', p.proacl))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private') and p.proname in ('current_app_role','current_app_email','patch_consultation','append_consultation_care_history','query_consultations','guard_consultation_update','record_consultation_activity','crm_follow_up_due'))
) as crm_preflight;
