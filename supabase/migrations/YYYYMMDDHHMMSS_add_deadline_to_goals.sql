-- Add deadline column to goals table
alter table public.goals
add column if not exists deadline date null;

comment on column public.goals.deadline is 'Optional deadline for the goal (e.g., exam date).'; 