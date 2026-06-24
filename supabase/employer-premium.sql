-- =============================================================================
-- SkillBridge - Employer premium features
-- Adds: student discoverability fields, employer subscriptions, and the RLS
-- policy that lets subscribed employers read discoverable student profiles.
-- Depends on: schema.sql (student_profile_snapshots, set_updated_at) and
--             employer-tables.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Make student profiles employer-searchable (identity + location + consent)
-- ---------------------------------------------------------------------------
alter table public.student_profile_snapshots
  add column if not exists display_name text not null default '';

alter table public.student_profile_snapshots
  add column if not exists location text not null default '';

alter table public.student_profile_snapshots
  add column if not exists discoverable boolean not null default false;

create index if not exists student_profile_snapshots_discoverable_idx
  on public.student_profile_snapshots (discoverable, location);

-- Subscribed employers may read student profiles that opted in to discovery.
-- (Server candidate-search routes use the service role and also filter on
-- discoverable = true; this policy is defense-in-depth for direct REST access.)
drop policy if exists "employers can read discoverable student profiles"
  on public.student_profile_snapshots;

create policy "employers can read discoverable student profiles"
  on public.student_profile_snapshots
  for select
  using (
    discoverable = true
    and coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'employer'
  );

-- ---------------------------------------------------------------------------
-- 2. employer_subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.employer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  plan text not null default 'professional',
  status text not null default 'inactive' check (status in ('active', 'inactive', 'cancelled')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employer_subscriptions enable row level security;

drop policy if exists "employers manage their own subscription"
  on public.employer_subscriptions;

create policy "employers manage their own subscription"
  on public.employer_subscriptions
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

drop trigger if exists set_employer_subscriptions_updated_at on public.employer_subscriptions;

create trigger set_employer_subscriptions_updated_at
before update on public.employer_subscriptions
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. employer_job_post_credits (pay-per-post tier)
-- One row == the right to publish one job listing. Bought for RM50, consumed
-- when the credit is spent on a job post. No expiry. This is the alternative
-- to the recurring 'professional' subscription for employers who post rarely.
-- ---------------------------------------------------------------------------
create table if not exists public.employer_job_post_credits (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  status text not null default 'available' check (status in ('available', 'consumed')),
  amount integer not null default 50,
  job_post_id uuid,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists employer_job_post_credits_user_status_idx
  on public.employer_job_post_credits (user_id, status);

alter table public.employer_job_post_credits enable row level security;

drop policy if exists "employers manage their own job post credits"
  on public.employer_job_post_credits;

create policy "employers manage their own job post credits"
  on public.employer_job_post_credits
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
