-- Server-verified audit functions for staff sign-ins and admin moderation.
-- Apply after schema.sql and the unified-auth migration.

begin;

create or replace function public.log_staff_sign_in()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_role text;
  v_status text;
begin
  if v_actor_id is null then
    raise exception 'A signed-in user is required';
  end if;

  select p.role, p.status
    into v_role, v_status
    from public.profiles as p
   where p.id = v_actor_id;

    if coalesce(v_status, '') <> 'active'
      or coalesce(v_role, '') not in ('counselor', 'admin') then
    raise exception 'An active staff account is required';
  end if;

  insert into public.audit_log (actor_id, action, target_id, metadata)
  values (v_actor_id, 'staff.sign_in', v_actor_id, jsonb_build_object('role', v_role));
end;
$$;

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
  if v_actor_id is null
     or not public.is_active_user()
     or public.current_role() <> 'admin' then
    raise exception 'Active administrator access is required';
  end if;

  if p_status not in ('approved', 'rejected') then
    raise exception 'Moderation status must be approved or rejected';
  end if;

  update public.coping_strategies
     set status = p_status
   where id = p_strategy_id;

  if not found then
    raise exception 'Coping strategy was not found';
  end if;

  insert into public.audit_log (actor_id, action, metadata)
  values (
    v_actor_id,
    case when p_status = 'approved'
      then 'coping_strategy.approved'
      else 'coping_strategy.rejected'
    end,
    jsonb_build_object('strategy_id', p_strategy_id)
  );
end;
$$;

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

  select p.role, p.status
    into v_actor_role, v_actor_status
    from public.profiles as p
   where p.id = p_actor_id
   for share;
  if v_actor_role <> 'admin' or v_actor_status <> 'active' then
    raise exception 'Active administrator access is required';
  end if;

  select p.role, p.status
    into v_target_role, v_target_status
    from public.profiles as p
   where p.id = p_target_id
     and p.role in ('counselor', 'admin')
   for update;
  if not found then
    raise exception 'Staff account was not found';
  end if;

  if p_status = 'disabled' then
    if p_actor_id = p_target_id then
      raise exception 'Admins cannot deactivate themselves';
    end if;

    if v_target_role = 'admin' and v_target_status = 'active' then
      select count(*) into v_active_admins
        from public.profiles as p
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

revoke all on function public.log_staff_sign_in() from public, anon;
revoke all on function public.moderate_coping_strategy(bigint, public.coping_status) from public, anon;
revoke all on function public.admin_set_staff_status(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.log_staff_sign_in() to authenticated;
grant execute on function public.moderate_coping_strategy(bigint, public.coping_status) to authenticated;
grant execute on function public.admin_set_staff_status(uuid, uuid, text) to service_role;

commit;