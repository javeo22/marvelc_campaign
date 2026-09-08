create table if not exists public.core_protocol_saves (
  save_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  schema_version text not null,
  campaign_id text not null,
  definition_version text not null,
  play_mode text not null check (play_mode in ('fail-forward', 'canon')),
  device_id text not null,
  sequence integer not null check (sequence >= 1),
  snapshot jsonb not null,
  checksum text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  cloud_updated_at timestamptz not null default now()
);

create table if not exists public.core_protocol_events (
  save_id text not null references public.core_protocol_saves(save_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence >= 1),
  event_id text not null,
  client_mutation_id text,
  event jsonb not null,
  occurred_at timestamptz not null,
  inserted_at timestamptz not null default now(),
  primary key (save_id, sequence),
  unique (save_id, event_id)
);

create unique index if not exists core_protocol_events_user_mutation_unique
  on public.core_protocol_events(user_id, client_mutation_id)
  where client_mutation_id is not null;

create index if not exists core_protocol_saves_user_updated_idx
  on public.core_protocol_saves(user_id, cloud_updated_at desc);

create index if not exists core_protocol_events_user_save_idx
  on public.core_protocol_events(user_id, save_id, sequence);

alter table public.core_protocol_saves enable row level security;
alter table public.core_protocol_events enable row level security;

drop policy if exists "Users read their own Core Protocol saves" on public.core_protocol_saves;
create policy "Users read their own Core Protocol saves"
  on public.core_protocol_saves
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert their own Core Protocol saves" on public.core_protocol_saves;
create policy "Users insert their own Core Protocol saves"
  on public.core_protocol_saves
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own Core Protocol saves" on public.core_protocol_saves;
create policy "Users update their own Core Protocol saves"
  on public.core_protocol_saves
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete their own Core Protocol saves" on public.core_protocol_saves;
create policy "Users delete their own Core Protocol saves"
  on public.core_protocol_saves
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Users read their own Core Protocol events" on public.core_protocol_events;
create policy "Users read their own Core Protocol events"
  on public.core_protocol_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users append their own Core Protocol events" on public.core_protocol_events;
create policy "Users append their own Core Protocol events"
  on public.core_protocol_events
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.core_protocol_saves saves
      where saves.save_id = core_protocol_events.save_id
        and saves.user_id = auth.uid()
    )
  );
