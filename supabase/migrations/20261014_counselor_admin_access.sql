-- Give active counselors the same administration tools and data access as admins.
-- Journal access remains limited to entries explicitly shared with guidance.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.profiles p
     where p.id = (select auth.uid())
       and p.status = 'active'
       and p.role::text in ('admin', 'counselor')
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists mood_logs_select on public.mood_logs;
create policy mood_logs_select on public.mood_logs
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists mood_triggers_select on public.mood_triggers;
create policy mood_triggers_select on public.mood_triggers
  for select to authenticated
  using (
    exists (
      select 1
        from public.mood_logs ml
       where ml.id = mood_triggers.log_id
         and (ml.user_id = (select auth.uid()) or public.is_admin())
    )
  );

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'journal_entries'
       and column_name = 'shared_with_guidance'
  ) then
    execute 'drop policy if exists journal_select_own on public.journal_entries';
    execute $policy$
      create policy journal_select_own on public.journal_entries
        for select to authenticated
        using (
          user_id = (select auth.uid())
          or (shared_with_guidance = true and public.is_admin())
        )
    $policy$;
  end if;
end;
$$;

drop policy if exists coping_select on public.coping_strategies;
create policy coping_select on public.coping_strategies
  for select to authenticated
  using (
    status = 'approved'
    or submitter_id = (select auth.uid())
    or public.is_admin()
  );

drop policy if exists coping_update_admin on public.coping_strategies;
create policy coping_update_admin on public.coping_strategies
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.moderate_coping_strategy(
  p_strategy_id bigint,
  p_status public.coping_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'Active guidance staff access is required';
  end if;

  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid moderation status';
  end if;

  update public.coping_strategies
     set status = p_status
   where id = p_strategy_id
     and (
       (p_status = 'pending' and status in ('approved', 'rejected'))
       or (p_status in ('approved', 'rejected') and status = 'pending')
     );

  if not found then
    raise exception 'Coping strategy was not found or is not in a state that can be changed';
  end if;

  insert into public.audit_log (actor_id, action, metadata)
  values (
    v_actor_id,
    case p_status
      when 'approved' then 'coping_strategy.approved'
      when 'rejected' then 'coping_strategy.rejected'
      else 'coping_strategy.restored'
    end,
    jsonb_build_object('strategy_id', p_strategy_id)
  );
end;
$$;

revoke all on function public.moderate_coping_strategy(bigint, public.coping_status) from public, anon;
grant execute on function public.moderate_coping_strategy(bigint, public.coping_status) to authenticated;

create or replace function public.admin_set_staff_status(
  p_actor_id uuid,
  p_target_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_actor_status text;
  v_target_role text;
  v_target_status text;
  v_active_admins integer;
begin
  if p_actor_id is null or p_target_id is null
     or p_status is null or p_status not in ('active', 'disabled') then
    raise exception 'Invalid staff status request';
  end if;

  perform pg_advisory_xact_lock(hashtext('uniwell_active_admin_status'));

  select p.role::text, p.status
    into v_actor_role, v_actor_status
    from public.profiles p
   where p.id = p_actor_id
   for share;
  if coalesce(v_actor_role, '') not in ('admin', 'counselor')
     or coalesce(v_actor_status, '') <> 'active' then
    raise exception 'Active guidance staff access is required';
  end if;

  select p.role::text, p.status
    into v_target_role, v_target_status
    from public.profiles p
   where p.id = p_target_id
     and p.role in ('counselor', 'admin')
   for update;
  if not found then
    raise exception 'Staff account was not found';
  end if;

  if p_status = 'disabled' then
    if p_actor_id = p_target_id then
      raise exception 'Staff cannot deactivate themselves';
    end if;

    if v_target_role = 'admin' and v_target_status = 'active' then
      select count(*) into v_active_admins
        from public.profiles p
       where p.role = 'admin'
         and p.status = 'active';
      if v_active_admins <= 1 then
        raise exception 'The last active admin cannot be deactivated';
      end if;
    end if;
  end if;

  if v_target_status is distinct from p_status then
    update public.profiles
       set status = p_status,
           updated_at = now()
     where id = p_target_id;

    insert into public.audit_log (actor_id, action, target_id, metadata)
    values (
      p_actor_id,
      case when p_status = 'disabled'
        then 'staff.account.deactivated'
        else 'staff.account.reactivated'
      end,
      p_target_id,
      jsonb_build_object('role', v_target_role)
    );
  end if;
end;
$$;

revoke all on function public.admin_set_staff_status(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_staff_status(uuid, uuid, text) to service_role;

commit;
