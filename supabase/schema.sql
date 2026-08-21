-- ---------------------------------------------------------------------------
-- FamilyFlow database schema
--
-- Release 0.1 gebruikt `family_state` (JSONB) als opslag achter de Repository-
-- interface, zodat de pilot zonder migratiewerk kan draaien. De genormaliseerde
-- tabellen hieronder zijn het doelmodel voor 0.2: dezelfde velden, dezelfde
-- relaties, maar per entiteit opvraagbaar.
--
-- Privacy-uitgangspunten in dit schema:
--   * elke rij hangt aan een family_id -> RLS kan altijd op gezin filteren
--   * geen vrije medische velden, geen diagnoses
--   * check_ins en coach_messages zijn verwijderbaar zonder de rest te breken
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- 0.1: snapshotopslag
-- --------------------------------------------------------------------------
create table if not exists family_state (
  family_id   text primary key,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table family_state enable row level security;

-- Er is nog geen echt auth-systeem (mensen kiezen een profiel uit een lijst,
-- geen login) — access control loopt in release 0.1 via het family_id zelf,
-- niet via auth.uid(). Zonder deze policy staat RLS op "enabled, 0 policies",
-- wat betekent: alle toegang geweigerd, ook met de geldige anon key. Dat
-- maakte de Supabase-opslag (en dus ook push-subscriptions, die in dezelfde
-- blob leven) stil onbruikbaar zodra iemand er echt verbinding mee maakte.
create policy family_state_rw on family_state
  for all using (true) with check (true);

-- --------------------------------------------------------------------------
-- 0.2: genormaliseerd model
-- --------------------------------------------------------------------------
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pilot_code  text,
  created_at  timestamptz not null default now()
);

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique,
  email       text unique,
  created_at  timestamptz not null default now()
);

create type family_role as enum ('parent', 'child', 'coach');

create table if not exists family_members (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  user_id     uuid references users(id) on delete set null,
  name        text not null,
  role        family_role not null,
  color       text not null default '#315C4A',
  created_at  timestamptz not null default now()
);
create index if not exists family_members_family_idx on family_members(family_id);

create table if not exists children_profiles (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references family_members(id) on delete cascade,
  age           int check (age between 0 and 25),
  school        text,
  interests     text[] not null default '{}',
  likes         text,
  finds_hard    text,
  created_at    timestamptz not null default now()
);

create table if not exists parent_profiles (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references family_members(id) on delete cascade,
  timezone      text default 'Europe/Amsterdam',
  created_at    timestamptz not null default now()
);

create table if not exists intakes (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  answers     jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists coach_profiles (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  focus_areas   text[] not null default '{}',
  motivation    text[] not null default '{}',
  tone          text[] not null default '{}',
  summary       text not null,
  source        text not null default 'rules',
  created_at    timestamptz not null default now()
);

create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid references family_members(id) on delete cascade,
  title       text not null,
  target      int not null default 1,
  progress    int not null default 0,
  points      int not null default 25,
  due_date    date,
  created_at  timestamptz not null default now()
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid not null references family_members(id) on delete cascade,
  title       text not null,
  category    text not null,
  time_of_day time,
  days        int[] not null default '{1,2,3,4,5}',
  points      int not null default 5,
  shared      boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists tasks_member_idx on tasks(member_id) where active;

create table if not exists task_completions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references tasks(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  completed_on  date not null default current_date,
  completed_at  timestamptz not null default now(),
  unique (task_id, completed_on)
);
create index if not exists task_completions_member_date_idx on task_completions(member_id, completed_on desc);

create table if not exists check_ins (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references family_members(id) on delete cascade,
  checked_on  date not null default current_date,
  mood        text not null check (mood in ('good', 'ok', 'low')),
  note        text,
  created_at  timestamptz not null default now(),
  unique (member_id, checked_on)
);

create table if not exists rewards (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null,
  cost        int not null,
  type        text not null default 'activiteit',
  created_at  timestamptz not null default now()
);

create table if not exists reward_redemptions (
  id            uuid primary key default gen_random_uuid(),
  reward_id     uuid not null references rewards(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  status        text not null default 'aangevraagd',
  redeemed_on   date not null default current_date,
  created_at    timestamptz not null default now()
);

create table if not exists family_activities (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  title         text not null,
  description   text,
  planned_on    date not null,
  points        int not null default 10,
  created_at    timestamptz not null default now()
);

create table if not exists family_activity_participants (
  activity_id   uuid not null references family_activities(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  primary key (activity_id, member_id)
);

create table if not exists coach_messages (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  member_id     uuid not null references family_members(id) on delete cascade,
  kind          text not null,
  body          text not null,
  suggestions   text[] not null default '{}',
  source        text not null default 'rules',
  answered_at   timestamptz,
  dismissed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists coach_messages_member_idx on coach_messages(member_id, created_at desc);

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references family_members(id) on delete cascade,
  channel       text not null default 'in_app',
  payload       jsonb not null,
  sent_at       timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists pilot_feedback (
  id            uuid primary key default gen_random_uuid(),
  family_name   text not null,
  email         text,
  pilot_code    text,
  good          text,
  annoying      text,
  missing       text,
  score         int check (score between 1 and 10),
  extra         text,
  created_at    timestamptz not null default now()
);

-- Minimale audit trail voor inzage in kindgegevens.
create table if not exists access_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references users(id) on delete set null,
  family_id   uuid references families(id) on delete cascade,
  action      text not null,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Row level security: alles hangt aan gezinslidmaatschap.
-- --------------------------------------------------------------------------
alter table families enable row level security;
alter table family_members enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table check_ins enable row level security;
alter table coach_messages enable row level security;

create or replace function is_family_member(target_family uuid) returns boolean as $$
  select exists (
    select 1
    from family_members m
    join users u on u.id = m.user_id
    where m.family_id = target_family
      and u.auth_id = auth.uid()
  );
$$ language sql security definer stable;

create policy families_read on families
  for select using (is_family_member(id));

create policy family_members_read on family_members
  for select using (is_family_member(family_id));

create policy tasks_rw on tasks
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));
