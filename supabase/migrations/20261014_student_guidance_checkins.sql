-- Track staff review and contact follow-up through the latest difficult mood entry.
begin;

create table if not exists public.student_guidance_checkins (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  reviewed_through_log_id bigint references public.mood_logs(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  contacted_through_log_id bigint references public.mood_logs(id) on delete set null,
  contacted_at timestamptz,
  contacted_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.student_guidance_checkins enable row level security;

drop policy if exists student_guidance_checkins_select on public.student_guidance_checkins;
create policy student_guidance_checkins_select
  on public.student_guidance_checkins
  for select
  to authenticated
  using (public.is_admin());

revoke all on table public.student_guidance_checkins from public, anon, authenticated;
grant select on public.student_guidance_checkins to authenticated;

create or replace function public.set_student_guidance_checkin(
  p_student_id uuid,
  p_stage text,
  p_completed boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_latest_log_id bigint;
  v_action text;
begin
  if v_actor_id is null or not public.is_admin() then
    raise exception 'Active guidance staff access is required';
  end if;

  if p_student_id is null
     or p_stage is null
     or p_stage not in ('reviewed', 'contacted')
     or p_completed is null then
    raise exception 'Invalid guidance check-in update';
  end if;

  if not exists (
    select 1
      from public.profiles p
     where p.id = p_student_id
       and p.role::text = 'student'
  ) then
    raise exception 'Student account was not found';
  end if;

  select ml.id
    into v_latest_log_id
    from public.mood_logs ml
   where ml.user_id = p_student_id
     and ml.mood_type::text in ('awful', 'bad', 'angry', 'burned_out', 'lonely', 'frustrated', 'nervous', 'confused')
   order by ml.logged_at desc, ml.id desc
   limit 1;

  if v_latest_log_id is null then
    raise exception 'No difficult mood entry is available to track';
  end if;

  insert into public.student_guidance_checkins (
    student_id,
    reviewed_through_log_id,
    reviewed_at,
    reviewed_by,
    contacted_through_log_id,
    contacted_at,
    contacted_by,
    updated_at
  )
  values (
    p_student_id,
    case when p_stage = 'reviewed' and p_completed then v_latest_log_id end,
    case when p_stage = 'reviewed' and p_completed then now() end,
    case when p_stage = 'reviewed' and p_completed then v_actor_id end,
    case when p_stage = 'contacted' and p_completed then v_latest_log_id end,
    case when p_stage = 'contacted' and p_completed then now() end,
    case when p_stage = 'contacted' and p_completed then v_actor_id end,
    now()
  )
  on conflict (student_id) do update
    set reviewed_through_log_id = case
          when p_stage = 'reviewed' then case when p_completed then v_latest_log_id end
          else student_guidance_checkins.reviewed_through_log_id
        end,
        reviewed_at = case
          when p_stage = 'reviewed' then case when p_completed then now() end
          else student_guidance_checkins.reviewed_at
        end,
        reviewed_by = case
          when p_stage = 'reviewed' then case when p_completed then v_actor_id end
          else student_guidance_checkins.reviewed_by
        end,
        contacted_through_log_id = case
          when p_stage = 'contacted' then case when p_completed then v_latest_log_id end
          else student_guidance_checkins.contacted_through_log_id
        end,
        contacted_at = case
          when p_stage = 'contacted' then case when p_completed then now() end
          else student_guidance_checkins.contacted_at
        end,
        contacted_by = case
          when p_stage = 'contacted' then case when p_completed then v_actor_id end
          else student_guidance_checkins.contacted_by
        end,
        updated_at = now();

  v_action := case
    when p_stage = 'reviewed' and p_completed then 'guidance_checkin.reviewed'
    when p_stage = 'contacted' and p_completed then 'guidance_checkin.contacted'
    when p_stage = 'reviewed' then 'guidance_checkin.review_reopened'
    else 'guidance_checkin.contact_reopened'
  end;

  insert into public.audit_log (actor_id, action, target_id, metadata)
  values (
    v_actor_id,
    v_action,
    p_student_id,
    jsonb_build_object('through_mood_log_id', v_latest_log_id)
  );
end;
$$;

revoke all on function public.set_student_guidance_checkin(uuid, text, boolean) from public, anon;
grant execute on function public.set_student_guidance_checkin(uuid, text, boolean) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
         from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'mood_logs'
     ) then
    alter publication supabase_realtime add table public.mood_logs;
  end if;

  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
         from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'student_guidance_checkins'
     ) then
    alter publication supabase_realtime add table public.student_guidance_checkins;
  end if;
end;
$$;

commit;
