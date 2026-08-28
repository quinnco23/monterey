-- Phase 1 auth + organization onboarding

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, first_name, last_name)
select
  id,
  nullif(raw_user_meta_data ->> 'first_name', ''),
  nullif(raw_user_meta_data ->> 'last_name', '')
from auth.users
on conflict (id) do nothing;

create or replace function public.create_organization_with_owner(
  p_name text,
  p_slug text,
  p_organization_type text,
  p_city text default null,
  p_state text default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(p_name)) < 2 then
    raise exception 'Organization name must be at least 2 characters';
  end if;

  if p_organization_type not in ('travel_club','league','tournament_operator','training_facility') then
    raise exception 'Invalid organization type';
  end if;

  insert into public.organizations (
    name,
    slug,
    organization_type,
    city,
    state,
    created_by_user_id
  )
  values (
    trim(p_name),
    lower(trim(p_slug)),
    p_organization_type,
    nullif(trim(p_city), ''),
    nullif(trim(p_state), ''),
    v_user_id
  )
  returning * into v_org;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  values (
    v_org.id,
    v_user_id,
    'owner',
    'active',
    now()
  );

  update public.profiles
  set onboarding_completed = true,
      updated_at = now()
  where id = v_user_id;

  return v_org;
end;
$$;

grant execute on function public.create_organization_with_owner(text, text, text, text, text) to authenticated;

-- Owners/admins can update organizations they belong to.
drop policy if exists "organizations_member_update" on public.organizations;
create policy "organizations_member_update"
on public.organizations
for update
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role in ('owner', 'admin')
  )
);

-- Members may read their own memberships. This avoids recursive policy checks.
drop policy if exists "organization_members_self_select" on public.organization_members;
create policy "organization_members_self_select"
on public.organization_members
for select
using (user_id = auth.uid());

-- Authenticated users may read organizations when they hold an active membership.
-- This policy uses a security-definer helper to avoid RLS recursion.
create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = p_organization_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

grant execute on function public.is_organization_member(uuid) to authenticated;

drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select"
on public.organizations
for select
using (public.is_organization_member(id));
