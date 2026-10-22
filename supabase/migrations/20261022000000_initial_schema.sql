-- WhenYahType Production Schema Migration
-- Enables pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 25 and username ~ '^[A-Za-z0-9_-]+$'),
  display_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. RUN TICKETS (Anti-Cheat Server-Issued Single-Use Tickets)
create table if not exists public.run_tickets (
  ticket_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('classic', 'daily')),
  duration integer not null check (duration in (15, 30, 60, 120)),
  seed text not null,
  challenge_version integer not null default 1,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create index if not exists run_tickets_user_idx on public.run_tickets (user_id, expires_at desc);

-- 3. TYPING RUNS
create table if not exists public.typing_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  mode text not null check (mode in ('classic', 'daily')),
  duration integer not null check (duration in (15, 30, 60, 120)),
  seed text not null,
  challenge_version integer not null default 1,
  ticket_id uuid references public.run_tickets(ticket_id) on delete set null,
  typed_text text not null,
  typed_chars integer not null check (typed_chars >= 0),
  correct_chars integer not null check (correct_chars >= 0),
  error_chars integer not null check (error_chars >= 0),
  wpm integer not null check (wpm >= 0 and wpm <= 350),
  raw_wpm integer not null check (raw_wpm >= 0 and raw_wpm <= 400),
  accuracy numeric(5,2) not null check (accuracy >= 0 and accuracy <= 100),
  phrase_count integer not null check (phrase_count >= 0),
  elapsed_ms integer not null check (elapsed_ms >= 0),
  verified boolean not null default false,
  validation_status text not null default 'verified' check (validation_status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists typing_runs_board_idx on public.typing_runs (duration, verified, validation_status, wpm desc, accuracy desc, created_at asc);
create index if not exists typing_runs_daily_idx on public.typing_runs (seed, mode, verified, validation_status, wpm desc, accuracy desc);
create index if not exists typing_runs_weekly_idx on public.typing_runs (created_at desc, duration, verified, validation_status, wpm desc);
create index if not exists typing_runs_user_idx on public.typing_runs (user_id, created_at desc);
create index if not exists typing_runs_user_duration_idx on public.typing_runs (user_id, duration, wpm desc);

-- 4. DAILY CHALLENGES
create table if not exists public.daily_challenges (
  challenge_date date primary key,
  version integer not null default 1,
  duration integer not null default 60 check (duration in (15, 30, 60, 120)),
  seed text not null,
  target_phrase text not null default 'When Yah',
  created_at timestamptz not null default now()
);

-- 5. ACHIEVEMENTS
create table if not exists public.achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  badge_tier text not null default 'bronze' check (badge_tier in ('bronze', 'silver', 'gold', 'diamond', 'meme')),
  created_at timestamptz not null default now()
);

-- 6. USER ACHIEVEMENTS
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create index if not exists user_achievements_user_idx on public.user_achievements (user_id, unlocked_at desc);

-- 7. ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.run_tickets enable row level security;
alter table public.typing_runs enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- 8. POLICIES

-- Profiles: Public read, User update own, trigger/user insert own
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Run Tickets: Authenticated users can read their own active tickets
drop policy if exists "Users can read own run tickets" on public.run_tickets;
create policy "Users can read own run tickets" on public.run_tickets for select to authenticated
  using (auth.uid() = user_id);

-- Typing Runs: Public can view verified runs, users can view their own runs
drop policy if exists "Verified typing runs are publicly readable" on public.typing_runs;
create policy "Verified typing runs are publicly readable" on public.typing_runs for select
  using (verified = true and validation_status = 'verified');

drop policy if exists "Users can view all their own runs" on public.typing_runs;
create policy "Users can view all their own runs" on public.typing_runs for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own runs" on public.typing_runs;
create policy "Users can delete their own runs" on public.typing_runs for delete to authenticated
  using (auth.uid() = user_id);

-- Daily Challenges: Publicly readable
drop policy if exists "Daily challenges are publicly readable" on public.daily_challenges;
create policy "Daily challenges are publicly readable" on public.daily_challenges for select using (true);

-- Achievements: Publicly readable
drop policy if exists "Achievements are publicly readable" on public.achievements;
create policy "Achievements are publicly readable" on public.achievements for select using (true);

-- User Achievements: Publicly readable
drop policy if exists "User achievements are publicly readable" on public.user_achievements;
create policy "User achievements are publicly readable" on public.user_achievements for select using (true);

-- 9. LEADERBOARD VIEWS (Deterministic Ranking & Tie-breaking)

-- Global All-time Leaderboard: Best verified run per user and duration
create or replace view public.leaderboard
with (security_invoker = true) as
select distinct on (user_id, duration)
  id as run_id,
  user_id,
  username,
  duration,
  wpm,
  raw_wpm,
  accuracy,
  phrase_count,
  created_at
from public.typing_runs
where verified = true and validation_status = 'verified' and mode = 'classic'
order by user_id, duration, wpm desc, accuracy desc, created_at asc;

-- Daily Leaderboard: Best verified run per user for a daily challenge seed
create or replace view public.daily_leaderboard
with (security_invoker = true) as
select distinct on (user_id, seed)
  id as run_id,
  user_id,
  username,
  seed,
  duration,
  wpm,
  raw_wpm,
  accuracy,
  phrase_count,
  created_at
from public.typing_runs
where verified = true and validation_status = 'verified' and mode = 'daily'
order by user_id, seed, wpm desc, accuracy desc, created_at asc;

-- Weekly Leaderboard: Best verified classic run within the current UTC week
create or replace view public.weekly_leaderboard
with (security_invoker = true) as
select distinct on (user_id, duration)
  id as run_id,
  user_id,
  username,
  duration,
  wpm,
  raw_wpm,
  accuracy,
  phrase_count,
  created_at
from public.typing_runs
where verified = true 
  and validation_status = 'verified' 
  and mode = 'classic'
  and created_at >= date_trunc('week', now() at time zone 'utc')
order by user_id, duration, wpm desc, accuracy desc, created_at asc;

-- Grant SELECT permissions on views
grant select on public.typing_runs to anon, authenticated;
grant select on public.leaderboard to anon, authenticated;
grant select on public.daily_leaderboard to anon, authenticated;
grant select on public.weekly_leaderboard to anon, authenticated;
grant select on public.achievements to anon, authenticated;
grant select on public.user_achievements to anon, authenticated;
grant select on public.daily_challenges to anon, authenticated;
grant select on public.profiles to anon, authenticated;

-- 10. PROFILE AUTO-CREATION TRIGGER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  candidate_name text;
begin
  candidate_name := coalesce(
    new.raw_user_meta_data->>'username',
    'yah_' || substring(encode(gen_random_bytes(4), 'hex') from 1 for 6)
  );
  
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate_name,
    coalesce(new.raw_user_meta_data->>'display_name', candidate_name),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
