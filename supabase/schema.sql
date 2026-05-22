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

create table if not exists public.job_search_cache (
  cache_key text primary key,
  provider text not null default 'auto',
  role text not null,
  location text not null,
  payload jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_search_cache_expires_at_idx
  on public.job_search_cache (expires_at);

alter table public.student_profile_snapshots enable row level security;
alter table public.job_search_cache enable row level security;

drop policy if exists "students can read own profile snapshot"
  on public.student_profile_snapshots;

create policy "students can read own profile snapshot"
  on public.student_profile_snapshots
  for select
  using (auth.uid()::text = user_id);

drop policy if exists "students can insert own profile snapshot"
  on public.student_profile_snapshots;

create policy "students can insert own profile snapshot"
  on public.student_profile_snapshots
  for insert
  with check (auth.uid()::text = user_id);

drop policy if exists "students can update own profile snapshot"
  on public.student_profile_snapshots;

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

drop trigger if exists set_job_search_cache_updated_at on public.job_search_cache;

create trigger set_job_search_cache_updated_at
before update on public.job_search_cache
for each row
execute function public.set_updated_at();
