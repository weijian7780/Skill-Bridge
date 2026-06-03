-- SkillBridge — Certificates feature (Phase 1)
-- Students upload certificate files as proof of their skills.
-- Files live in a PRIVATE `certificates` storage bucket; metadata lives here.

-- 1. Table -------------------------------------------------------------------
create table if not exists public.student_certificates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null default '',
  skill_tags   text[] not null default '{}',   -- filled in Phase 2 (AI), empty for now
  storage_path text not null,                   -- e.g. "<user_id>/cert-169..._aws.pdf"
  file_name    text not null default '',
  mime_type    text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists student_certificates_user_id_idx
  on public.student_certificates (user_id);

-- 2. Row Level Security ------------------------------------------------------
alter table public.student_certificates enable row level security;

-- Students manage only their own certificate rows.
create policy "students manage own certificates"
  on public.student_certificates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- (The server uses the service-role key, which bypasses RLS. These policies
--  protect any future direct client access.)

-- 3. Storage bucket ----------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- 4. Storage RLS policies (mirror the `resumes` bucket) ----------------------
-- Path convention: "<student_user_id>/<filename>"

create policy "students can upload own certificates"
  on storage.objects for insert
  with check (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "students can read own certificates"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "students can delete own certificates"
  on storage.objects for delete
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Employers read a candidate's certificates only when that candidate applied
-- to one of the employer's job posts.
create policy "employers can read applicant certificates"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and exists (
      select 1
      from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
        and a.student_id::text = (storage.foldername(name))[1]
    )
  );
