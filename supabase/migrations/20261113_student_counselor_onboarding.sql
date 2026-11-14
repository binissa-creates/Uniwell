begin;

alter table public.profiles
  add column if not exists onboarding_completed boolean;

update public.profiles
   set onboarding_completed = true
 where onboarding_completed is null;

alter table public.profiles
  alter column onboarding_completed set default false,
  alter column onboarding_completed set not null;

grant update (onboarding_completed) on public.profiles to authenticated;

commit;
