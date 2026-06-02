-- Saved roadmaps: full history of generated roadmaps, many per user.
-- Each "Save roadmap" action on the Roadmap page inserts one new row, so a
-- student can refer back to every roadmap they generated for past targets.
create table if not exists public.saved_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_role text not null default '',
  target_region text not null default '',
  missing_skills text[] not null default '{}',
  companies text[] not null default '{}',
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  roadmap_items jsonb not null default '[]'::jsonb,
  generation_basis jsonb not null default '{}'::jsonb,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_roadmaps_user_created_idx
  on public.saved_roadmaps (user_id, created_at desc);

alter table public.saved_roadmaps enable row level security;

drop policy if exists "Students manage their own saved roadmaps" on public.saved_roadmaps;

create policy "Students manage their own saved roadmaps"
  on public.saved_roadmaps
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_saved_roadmaps_updated_at on public.saved_roadmaps;

create trigger set_saved_roadmaps_updated_at
before update on public.saved_roadmaps
for each row
execute function public.set_updated_at();
