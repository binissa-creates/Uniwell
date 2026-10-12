-- Unified role and invitation foundation.
-- This migration intentionally does not rewrite existing wellness-data RLS
-- policies. Review the counselor access proposal before changing those rules.

begin;

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists status text not null default 'active',
  add column if not exists updated_at timestamptz not null default now();

update public.profiles as p
   set full_name = coalesce(
         nullif(btrim(p.full_name), ''),
         nullif(btrim(p.name), ''),
         nullif(split_part(coalesce(u.email, p.email, ''), '@', 1), ''),
         'UniWell User'
       ),
       email = coalesce(p.email, u.email),
       updated_at = coalesce(p.updated_at, p.created_at, now())
  from auth.users as u
 where u.id = p.id;

alter table public.profiles
  alter column full_name set not null,
  alter column role drop default,
  alter column role type text using role::text,
  alter column role set default 'student';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_role_allowed_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_allowed_check
      check (role in ('student', 'counselor', 'admin'));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and conname = 'profiles_status_allowed_check'
  ) then
    alter table public.profiles
      add constraint profiles_status_allowed_check
      check (status in ('active', 'invited', 'disabled'));
  end if;
end;
$$;

create index if not exists profiles_status_role_idx
  on public.profiles (status, role);

create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('counselor', 'admin')),
  full_name text not null,
  invited_by uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists staff_invites_one_pending_per_email_idx
  on public.staff_invites (lower(email))
  where status = 'pending';

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx
  on public.audit_log (created_at desc);
create index if not exists audit_log_actor_id_idx
  on public.audit_log (actor_id, created_at desc);

alter table public.staff_invites enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
    from public.profiles as p
   where p.id = (select auth.uid())
   limit 1;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.profiles as p
     where p.id = (select auth.uid())
       and p.status = 'active'
  );
$$;

revoke all on function public.current_role() from public, anon;
revoke all on function public.is_active_user() from public, anon;
grant execute on function public.current_role() to authenticated;
grant execute on function public.is_active_user() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (
      public.is_active_user()
      and public.current_role() in ('admin', 'counselor')
    )
  );

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and public.is_active_user())
  with check (id = (select auth.uid()) and public.is_active_user());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_active_user() and public.current_role() = 'admin')
  with check (public.is_active_user() and public.current_role() = 'admin');

create policy staff_invites_select_admin on public.staff_invites
  for select to authenticated
  using (public.is_active_user() and public.current_role() = 'admin');

create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using (public.is_active_user() and public.current_role() = 'admin');

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, role, status) on public.profiles to authenticated;

revoke all on public.staff_invites from anon, authenticated;
grant select on public.staff_invites to authenticated;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

grant all on public.profiles, public.staff_invites, public.audit_log to service_role;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other_active_admins integer;
begin
  -- Trusted SQL and Edge Function service-role writes remain available.
  if (select auth.uid()) is null
     or coalesce((select auth.role()), '') = 'service_role' then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.student_id is distinct from old.student_id
     or new.course is distinct from old.course
     or new.year_level is distinct from old.year_level
     or new.created_at is distinct from old.created_at then
    raise exception 'Only full_name may be changed on a personal profile';
  end if;

  if new.email is distinct from old.email and not exists (
    select 1 from auth.users as u
     where u.id = old.id and u.email is not distinct from new.email
  ) then
    raise exception 'Profile email is managed by Supabase Auth';
  end if;

  if new.name is distinct from old.name
     and not (
       new.full_name is distinct from old.full_name
       and new.name is not distinct from new.full_name
     ) then
    raise exception 'Legacy profile name is managed through full_name';
  end if;

  if new.full_name is distinct from old.full_name then
    if old.id <> (select auth.uid())
       and not (
         public.is_active_user()
         and public.current_role() = 'admin'
       ) then
      raise exception 'Users may update only their own full_name';
    end if;
    new.name := new.full_name;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status then
    if not (public.is_active_user() and public.current_role() = 'admin')
       and not (
         current_setting('uniwell.accept_staff_invite', true) = 'on'
         and old.id = (select auth.uid())
         and old.status = 'invited'
         and new.status = 'active'
         and new.role = old.role
         and old.role in ('counselor', 'admin')
       ) then
      raise exception 'Only active admins may change profile role or status';
    end if;
  end if;

  if old.role = 'admin' and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active') then
    perform pg_advisory_xact_lock(hashtext('uniwell_active_admin_status'));

    if old.id = (select auth.uid()) then
      raise exception 'Admins cannot deactivate or demote themselves';
    end if;

    select count(*) into v_other_active_admins
      from public.profiles as p
     where p.id <> old.id
       and p.role = 'admin'
       and p.status = 'active';

    if v_other_active_admins = 0 then
      raise exception 'The last active admin cannot be deactivated or demoted';
    end if;
  end if;

  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null then
    insert into public.audit_log (actor_id, action, target_id, metadata)
    values (
      (select auth.uid()),
      'profile.access_updated',
      old.id,
      jsonb_build_object(
        'previous_role', old.role,
        'role', new.role,
        'previous_status', old.status,
        'status', new.status
      )
    );
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite_role text;
  v_invite_name text;
  v_full_name text;
  v_student_id text;
  v_course text;
  v_year_level smallint;
begin
  if new.email is not null then
    select si.role, si.full_name
      into v_invite_role, v_invite_name
      from public.staff_invites as si
     where lower(si.email) = lower(new.email)
       and si.status = 'pending'
     order by si.created_at desc
     limit 1
     for update;
  end if;

  v_full_name := left(
    coalesce(
      nullif(btrim(v_invite_name), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'UniWell User'
    ),
    150
  );
  v_student_id := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'student_id'), ''), new.id::text),
    50
  );
  v_course := left(
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'course'), ''), 'Unspecified'),
    100
  );
  v_year_level := case
    when coalesce(new.raw_user_meta_data ->> 'year_level', '') ~ '^[1-4]$'
      then (new.raw_user_meta_data ->> 'year_level')::smallint
    else 1
  end;

  insert into public.profiles (
    id, full_name, email, name, student_id, course, year_level, role, status
  ) values (
    new.id,
    v_full_name,
    new.email,
    v_full_name,
    v_student_id,
    v_course,
    v_year_level,
    coalesce(v_invite_role, 'student'),
    case when v_invite_role is null then 'active' else 'invited' end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
       set email = new.email
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

create or replace function public.accept_staff_invite(p_full_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email text;
  v_invite_id uuid;
  v_full_name text := btrim(coalesce(p_full_name, ''));
begin
  if v_user_id is null then
    raise exception 'A signed-in user is required';
  end if;
  if length(v_full_name) < 2 or length(v_full_name) > 150 then
    raise exception 'Full name must be between 2 and 150 characters';
  end if;

  select u.email into v_email
    from auth.users as u
   where u.id = v_user_id;

  select si.id into v_invite_id
    from public.staff_invites as si
    join public.profiles as p
      on p.id = v_user_id
     and lower(p.email) = lower(si.email)
     and p.role = si.role
     and p.status = 'invited'
   where lower(si.email) = lower(v_email)
     and si.status = 'pending'
     and si.role in ('counselor', 'admin')
   limit 1
   for update of si, p;

  if v_invite_id is null then
    raise exception 'No valid pending staff invitation was found for this account';
  end if;

  perform set_config('uniwell.accept_staff_invite', 'on', true);

  update public.profiles
     set full_name = v_full_name,
         name = v_full_name,
         status = 'active',
         updated_at = now()
   where id = v_user_id;

  update public.staff_invites
     set status = 'accepted',
         accepted_at = now()
   where id = v_invite_id and status = 'pending';

  insert into public.audit_log (actor_id, action, target_id, metadata)
  values (
    v_user_id,
    'staff.invite.accepted',
    v_user_id,
    jsonb_build_object('invite_id', v_invite_id)
  );
end;
$$;

revoke all on function public.accept_staff_invite(text) from public, anon;
grant execute on function public.accept_staff_invite(text) to authenticated;

-- Existing wellness-data policies are intentionally unchanged pending review.

commit;