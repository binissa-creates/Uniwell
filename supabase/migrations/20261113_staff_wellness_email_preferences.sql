begin;

alter table public.notification_preferences
  add column if not exists staff_wellness_email_enabled boolean not null default false,
  add column if not exists staff_wellness_email_timezone text not null default 'UTC',
  add column if not exists staff_wellness_email_hour smallint not null default 9
    check (staff_wellness_email_hour between 0 and 23),
  add column if not exists last_staff_wellness_email_local_date date;

grant insert (
  user_id,
  in_app_enabled,
  push_timezone,
  push_hour,
  updated_at,
  staff_wellness_email_enabled,
  staff_wellness_email_timezone,
  staff_wellness_email_hour
) on table public.notification_preferences to authenticated;

grant update (
  in_app_enabled,
  push_timezone,
  push_hour,
  updated_at,
  staff_wellness_email_enabled,
  staff_wellness_email_timezone,
  staff_wellness_email_hour
) on table public.notification_preferences to authenticated;

grant select, update on table public.notification_preferences to service_role;

commit;
