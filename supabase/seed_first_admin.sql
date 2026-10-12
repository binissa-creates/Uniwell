-- One-time bootstrap for the first UniWell administrator.
-- Replace the email below with an existing, verified auth.users email before running.
-- Run from the Supabase SQL Editor after applying the unified-auth migration.
-- This script changes no passwords and contains no credentials.

do $$
declare
  target_email text := 'REPLACE_WITH_EXISTING_USER_EMAIL@example.edu';
  target_user_id uuid;
begin
  select u.id
    into target_user_id
    from auth.users as u
   where lower(u.email) = lower(target_email);

  if target_user_id is null then
    raise exception 'No auth.users row found for %', target_email;
  end if;

  if not exists (
    select 1 from public.profiles as p where p.id = target_user_id
  ) then
    raise exception 'The selected auth user has no profiles row; resolve the profile trigger before bootstrapping';
  end if;

  update public.profiles
     set role = 'admin',
         status = 'active',
         updated_at = now()
   where id = target_user_id;
end;
$$;