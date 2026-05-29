-- =============================================================================
-- SkillBridge – Employer & Job-Post tables
-- Depends on: supabase/schema.sql (for set_updated_at() trigger function)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. employer_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  company_name text not null,
  company_logo_storage_path text,
  industry text,
  company_size text check (company_size in ('startup', 'small', 'medium', 'large', 'enterprise')),
  website text,
  description text,
  contact_email text,
  contact_phone text,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. job_posts
-- ---------------------------------------------------------------------------
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  employer_id text not null,
  title text not null,
  category text,
  employment_type text check (employment_type in ('full-time', 'part-time', 'contract')),
  job_type text check (job_type in ('internship', 'full-time')),
  salary_min integer,
  salary_max integer,
  location text,
  work_mode text check (work_mode in ('remote', 'on-site', 'hybrid')),
  required_skills text[] not null default '{}',
  description text,
  responsibilities text,
  requirements text,
  deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  student_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'shortlisted', 'interview', 'rejected', 'hired')),
  cover_letter text,
  resume_storage_path text,
  portfolio_url text,
  github_url text,
  notes text,                           -- employer-only private notes
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);

-- ---------------------------------------------------------------------------
-- 4. interviews
-- ---------------------------------------------------------------------------
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  location text,
  meeting_link text,
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists job_posts_employer_id_idx
  on public.job_posts (employer_id);

create index if not exists job_posts_status_idx
  on public.job_posts (status);

create index if not exists applications_job_id_idx
  on public.applications (job_id);

create index if not exists applications_student_id_idx
  on public.applications (student_id);

create index if not exists interviews_application_id_idx
  on public.interviews (application_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.employer_profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.applications enable row level security;
alter table public.interviews enable row level security;

-- ---------------------------------------------------------------------------
-- employer_profiles policies
-- ---------------------------------------------------------------------------
drop policy if exists "employers can read own profile"
  on public.employer_profiles;

create policy "employers can read own profile"
  on public.employer_profiles
  for select
  using (auth.uid()::text = user_id);

drop policy if exists "employers can insert own profile"
  on public.employer_profiles;

create policy "employers can insert own profile"
  on public.employer_profiles
  for insert
  with check (auth.uid()::text = user_id);

drop policy if exists "employers can update own profile"
  on public.employer_profiles;

create policy "employers can update own profile"
  on public.employer_profiles
  for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- ---------------------------------------------------------------------------
-- job_posts policies
-- ---------------------------------------------------------------------------

-- Employers manage their own posts (select / insert / update / delete)
drop policy if exists "employers can read own job posts"
  on public.job_posts;

create policy "employers can read own job posts"
  on public.job_posts
  for select
  using (auth.uid()::text = employer_id);

drop policy if exists "employers can insert own job posts"
  on public.job_posts;

create policy "employers can insert own job posts"
  on public.job_posts
  for insert
  with check (auth.uid()::text = employer_id);

drop policy if exists "employers can update own job posts"
  on public.job_posts;

create policy "employers can update own job posts"
  on public.job_posts
  for update
  using (auth.uid()::text = employer_id)
  with check (auth.uid()::text = employer_id);

drop policy if exists "employers can delete own job posts"
  on public.job_posts;

create policy "employers can delete own job posts"
  on public.job_posts
  for delete
  using (auth.uid()::text = employer_id);

-- Students can browse active posts
drop policy if exists "students can read active job posts"
  on public.job_posts;

create policy "students can read active job posts"
  on public.job_posts
  for select
  using (
    status = 'active'
    and coalesce(auth.jwt()->'user_metadata'->>'role', 'student') = 'student'
  );

-- ---------------------------------------------------------------------------
-- applications policies
-- ---------------------------------------------------------------------------

-- Students insert their own applications
drop policy if exists "students can insert own applications"
  on public.applications;

create policy "students can insert own applications"
  on public.applications
  for insert
  with check (auth.uid()::text = student_id);

-- Students read their own applications
drop policy if exists "students can read own applications"
  on public.applications;

create policy "students can read own applications"
  on public.applications
  for select
  using (auth.uid()::text = student_id);

-- Employers read applications for their job posts
drop policy if exists "employers can read applications for own jobs"
  on public.applications;

create policy "employers can read applications for own jobs"
  on public.applications
  for select
  using (
    job_id in (
      select id from public.job_posts
      where employer_id = auth.uid()::text
    )
  );

-- Employers update status/notes on applications for their job posts
drop policy if exists "employers can update applications for own jobs"
  on public.applications;

create policy "employers can update applications for own jobs"
  on public.applications
  for update
  using (
    job_id in (
      select id from public.job_posts
      where employer_id = auth.uid()::text
    )
  )
  with check (
    job_id in (
      select id from public.job_posts
      where employer_id = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- interviews policies
-- ---------------------------------------------------------------------------

-- Employers insert interviews for their own job-post applications
drop policy if exists "employers can insert interviews for own jobs"
  on public.interviews;

create policy "employers can insert interviews for own jobs"
  on public.interviews
  for insert
  with check (
    application_id in (
      select a.id from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
    )
  );

-- Employers read interviews for their own job-post applications
drop policy if exists "employers can read interviews for own jobs"
  on public.interviews;

create policy "employers can read interviews for own jobs"
  on public.interviews
  for select
  using (
    application_id in (
      select a.id from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
    )
  );

-- Employers update interviews for their own job-post applications
drop policy if exists "employers can update interviews for own jobs"
  on public.interviews;

create policy "employers can update interviews for own jobs"
  on public.interviews
  for update
  using (
    application_id in (
      select a.id from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
    )
  )
  with check (
    application_id in (
      select a.id from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
    )
  );

-- Students read their own interviews (via their application)
drop policy if exists "students can read own interviews"
  on public.interviews;

create policy "students can read own interviews"
  on public.interviews
  for select
  using (
    application_id in (
      select id from public.applications
      where student_id = auth.uid()::text
    )
  );

-- ===========================================================================
-- Triggers – reuse existing set_updated_at() function from schema.sql
-- ===========================================================================
drop trigger if exists set_employer_profiles_updated_at on public.employer_profiles;

create trigger set_employer_profiles_updated_at
before update on public.employer_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_job_posts_updated_at on public.job_posts;

create trigger set_job_posts_updated_at
before update on public.job_posts
for each row
execute function public.set_updated_at();

drop trigger if exists set_applications_updated_at on public.applications;

create trigger set_applications_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

drop trigger if exists set_interviews_updated_at on public.interviews;

create trigger set_interviews_updated_at
before update on public.interviews
for each row
execute function public.set_updated_at();
