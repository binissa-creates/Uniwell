begin;

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

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant all on public.audit_log to service_role;

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
  v_profile jsonb;
begin
  if v_actor_id is not null then
    select to_jsonb(p)
      into v_profile
      from public.profiles as p
     where p.id = v_actor_id;
  end if;

  if v_actor_id is null
     or v_profile ->> 'role' <> 'admin'
     or coalesce(v_profile ->> 'status', 'active') <> 'active' then
    raise exception 'Active administrator access is required';
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

commit;
