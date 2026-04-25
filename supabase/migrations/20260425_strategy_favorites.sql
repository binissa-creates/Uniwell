-- Strategy Favorites table
-- Allows students to bookmark/save coping strategies they like.

create table if not exists public.strategy_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  strategy_id  uuid not null references public.coping_strategies(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(user_id, strategy_id)
);

-- RLS
alter table public.strategy_favorites enable row level security;

-- Students can read, insert, and delete only their own favorites
create policy "Users manage own favorites"
  on public.strategy_favorites
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
