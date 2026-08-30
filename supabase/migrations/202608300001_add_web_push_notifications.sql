begin;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_uid text not null,
  user_email text not null,
  user_role text not null check (user_role in ('admin', 'editor', 'member')),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_uid_idx on public.push_subscriptions (user_uid);
create index if not exists push_subscriptions_user_email_idx on public.push_subscriptions (lower(user_email));
create index if not exists push_subscriptions_user_role_idx on public.push_subscriptions (user_role);

create table if not exists public.push_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.push_events enable row level security;

revoke all on public.push_subscriptions, public.push_events from public, anon, authenticated;
grant all on public.push_subscriptions, public.push_events to service_role;

commit;
