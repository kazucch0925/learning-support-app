-- Add columns to users table for tracking first challenge streak
alter table public.users
add column if not exists last_first_challenge_date date null,
add column if not exists first_challenge_streak_count integer not null default 0;

comment on column public.users.last_first_challenge_date is 'Date when the user last completed the first challenge of the day.';
comment on column public.users.first_challenge_streak_count is 'Current streak count for completing the first challenge daily.';

-- Create a new table to log daily challenge completions
create table if not exists public.daily_challenge_completions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    completion_date date not null default current_date,
    challenge_type text not null,
    points_earned integer not null default 0,
    created_at timestamp with time zone not null default now(),
    
    -- Ensure a user can complete a specific type of challenge only once per day
    constraint unique_user_challenge_per_day unique (user_id, completion_date, challenge_type) 
);

-- Add indexes for faster lookups
create index if not exists idx_daily_challenge_completions_user_date 
on public.daily_challenge_completions (user_id, completion_date);

-- Enable Row Level Security (RLS) for the new table
alter table public.daily_challenge_completions enable row level security;

-- Grant permissions to authenticated users
-- Users should be able to select their own completion records
create policy "Allow authenticated users to select own completions"
on public.daily_challenge_completions for select
using (auth.uid() = user_id);

-- Users should be able to insert their own completion records (function will handle validation)
create policy "Allow authenticated users to insert own completions"
on public.daily_challenge_completions for insert
with check (auth.uid() = user_id);

comment on table public.daily_challenge_completions is 'Logs completed challenges for each user on a daily basis.';
comment on column public.daily_challenge_completions.challenge_type is 'Identifier for the type of challenge completed (e.g., ''first_challenge'').';
comment on column public.daily_challenge_completions.points_earned is 'Number of points awarded for completing this challenge.'; 