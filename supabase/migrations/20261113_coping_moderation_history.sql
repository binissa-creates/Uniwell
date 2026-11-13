begin;

create or replace function public.get_coping_strategy_moderation_history(
  p_strategy_ids bigint[]
)
returns table (
  strategy_id bigint,
  actor_name text,
  actor_role text,
  action text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (a.metadata ->> 'strategy_id')::bigint,
    coalesce(p.name, 'Former staff member'),
    p.role::text,
    a.action,
    a.created_at
  from public.audit_log as a
  left join public.profiles as p on p.id = a.actor_id
  where public.is_admin()
    and a.action in (
      'coping_strategy.approved',
      'coping_strategy.rejected',
      'coping_strategy.restored'
    )
    and a.metadata ->> 'strategy_id' = any (
      select selected_id::text
      from unnest(coalesce(p_strategy_ids, '{}'::bigint[])) as selected_ids(selected_id)
    )
  order by a.created_at desc;
$$;

revoke all on function public.get_coping_strategy_moderation_history(bigint[]) from public, anon;
grant execute on function public.get_coping_strategy_moderation_history(bigint[]) to authenticated;

commit;
