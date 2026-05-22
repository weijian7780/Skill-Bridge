create extension if not exists pgcrypto;

create table if not exists public.student_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  university text not null default 'UMS',
  study_year text not null default 'Year 3',
  program text not null default 'Computer Science',
  career_target jsonb not null default '{}'::jsonb,
  skill_profile jsonb not null default '{}'::jsonb,
  missing_skills text[] not null default '{}',
  roadmap_items jsonb not null default '[]'::jsonb,
  cv_document jsonb,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  roadmap_progress integer not null default 0 check (roadmap_progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profile_snapshots enable row level security;

create policy "students can read own profile snapshot"
  on public.student_profile_snapshots
  for select
  using (auth.uid()::text = user_id);

create policy "students can insert own profile snapshot"
  on public.student_profile_snapshots
  for insert
  with check (auth.uid()::text = user_id);

create policy "students can update own profile snapshot"
  on public.student_profile_snapshots
  for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_student_profile_snapshots_updated_at on public.student_profile_snapshots;

create trigger set_student_profile_snapshots_updated_at
before update on public.student_profile_snapshots
for each row
execute function public.set_updated_at();
