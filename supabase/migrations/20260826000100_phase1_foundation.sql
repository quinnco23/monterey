create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null check (organization_type in ('travel_club','league','tournament_operator','training_facility')),
  logo_url text,
  city text,
  state text,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','coach','team_manager','scorekeeper','viewer')),
  status text not null default 'active' check (status in ('invited','active','suspended','removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  age_group text not null,
  classification text,
  season_year integer not null,
  city text,
  state text,
  logo_url text,
  status text not null default 'active' check (status in ('draft','active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.teams enable row level security;

create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert with check (auth.uid() = id);

create policy "organizations_member_select" on public.organizations for select using (
  exists (
    select 1 from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "organization_members_self_select" on public.organization_members for select using (
  user_id = auth.uid()
  or exists (
    select 1 from public.organization_members om
    where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  )
);

create policy "teams_public_select" on public.teams for select using (status = 'active');
