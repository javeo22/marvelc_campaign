-- Optional cloud-sync schema for PostgreSQL / Supabase.
-- The first release remains fully usable with IndexedDB and no account.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null check (campaign_id = 'core-protocol'),
  definition_version text not null,
  name text not null default 'Core Protocol',
  play_mode text not null check (play_mode in ('fail-forward', 'canon')),
  latest_sequence bigint not null default 0 check (latest_sequence >= 0),
  snapshot jsonb not null,
  snapshot_checksum text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_events (
  id uuid primary key,
  save_id uuid not null references public.campaign_saves(id) on delete cascade,
  sequence bigint not null check (sequence > 0),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  device_id text,
  client_mutation_id text,
  created_at timestamptz not null default now(),
  unique (save_id, sequence),
  unique (save_id, client_mutation_id)
);

create index if not exists campaign_events_save_sequence_idx
  on public.campaign_events (save_id, sequence);

create table if not exists public.deck_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  save_id uuid references public.campaign_saves(id) on delete set null,
  logged_at timestamptz not null default now(),
  deck_id text,
  hero_id text not null,
  aspect_ids text[] not null default '{}',
  deck_name text,
  version_label text,
  scenario_id text,
  result text,
  marvelcdb_url text,
  notes text
);

create table if not exists public.rules_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  save_id uuid references public.campaign_saves(id) on delete set null,
  topic text not null,
  ruling text not null,
  example_en text,
  example_es text,
  status text not null default 'personal-note',
  source_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.campaign_saves enable row level security;
alter table public.campaign_events enable row level security;
alter table public.deck_logs enable row level security;
alter table public.rules_logs enable row level security;
alter table public.user_settings enable row level security;

create policy profiles_owner_all on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy campaign_saves_owner_all on public.campaign_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy campaign_events_owner_select on public.campaign_events
  for select using (
    exists (select 1 from public.campaign_saves s where s.id = save_id and s.user_id = auth.uid())
  );
create policy campaign_events_owner_insert on public.campaign_events
  for insert with check (
    exists (select 1 from public.campaign_saves s where s.id = save_id and s.user_id = auth.uid())
  );
-- Events are append-only. No update/delete policies are intentionally defined.

create policy deck_logs_owner_all on public.deck_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy rules_logs_owner_all on public.rules_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_settings_owner_all on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger touch_campaign_saves before update on public.campaign_saves
for each row execute function public.touch_updated_at();
create trigger touch_rules_logs before update on public.rules_logs
for each row execute function public.touch_updated_at();
create trigger touch_user_settings before update on public.user_settings
for each row execute function public.touch_updated_at();
