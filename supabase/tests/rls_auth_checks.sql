-- Manual RLS checks for a development Supabase project.
-- Replace both UUID placeholders with existing student profile IDs before running.
-- Run the whole script in the SQL Editor; the final ROLLBACK keeps it read-only.

begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_STUDENT_UUID', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"REPLACE_WITH_STUDENT_UUID","role":"authenticated"}',
  true
);

-- Expected: true. The authenticated student can see their own profile.
select exists (
  select 1 from public.profiles where id = 'REPLACE_WITH_STUDENT_UUID'
) as can_read_own_profile;

-- Expected: false. The authenticated student cannot see another student's profile.
select exists (
  select 1 from public.profiles where id = 'REPLACE_WITH_OTHER_STUDENT_UUID'
) as can_read_other_profile;

-- Expected: false for each query.
select exists (select 1 from public.staff_invites) as can_read_staff_invites;
select exists (select 1 from public.audit_log) as can_read_audit_log;

-- Expected: this block succeeds only when the role change is rejected.
do $$
declare
  change_was_blocked boolean := false;
begin
  begin
    update public.profiles
       set role = 'admin'
     where id = 'REPLACE_WITH_STUDENT_UUID';
  exception
    when insufficient_privilege or raise_exception then
      change_was_blocked := true;
  end;

  if not change_was_blocked then
    raise exception 'RLS CHECK FAILED: student was able to update their own role';
  end if;
end;
$$;

rollback;