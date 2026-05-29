# Supabase Storage Buckets – Setup Guide

SkillBridge uses two **private** Supabase Storage buckets for file uploads.
Private buckets require a valid JWT for every request; no anonymous access is possible.

---

## 1. Create the Buckets

### Via Supabase Dashboard

1. Go to **Storage → New bucket**
2. Create **`resumes`** – set **Public** to **OFF** (private)
3. Create **`company-logos`** – set **Public** to **OFF** (private)

### Via SQL (run in the SQL Editor)

```sql
insert into storage.buckets (id, name, public)
values
  ('resumes',       'resumes',       false),
  ('company-logos', 'company-logos', false)
on conflict (id) do nothing;
```

---

## 2. Recommended Folder Convention

| Bucket          | Path pattern                           | Example                                              |
| --------------- | -------------------------------------- | ---------------------------------------------------- |
| `resumes`       | `{student_user_id}/{filename}`         | `abc123/resume_2026.pdf`                             |
| `company-logos` | `{employer_user_id}/{filename}`        | `emp456/logo.png`                                    |

Store the **relative path** (e.g. `abc123/resume_2026.pdf`) in the database columns
`applications.resume_storage_path` and `employer_profiles.company_logo_storage_path`.

At runtime, generate a signed URL with the Supabase client:

```ts
const { data } = await supabase.storage
  .from('resumes')
  .createSignedUrl(resume_storage_path, 60 * 60); // 1 hour
```

---

## 3. Storage RLS Policies

Supabase Storage uses the `storage.objects` table.
Policies reference `auth.uid()::text` and the object's `bucket_id` / `name` (path).

> **Important:** Enable RLS on `storage.objects` if not already enabled:
>
> ```sql
> alter table storage.objects enable row level security;
> ```

### 3a. `resumes` bucket policies

```sql
-- Students can upload their own resumes
create policy "students can upload own resumes"
  on storage.objects
  for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can read their own resumes
create policy "students can read own resumes"
  on storage.objects
  for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can update (overwrite) their own resumes
create policy "students can update own resumes"
  on storage.objects
  for update
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Students can delete their own resumes
create policy "students can delete own resumes"
  on storage.objects
  for delete
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Employers can read resumes attached to applications for their job posts
create policy "employers can read applicant resumes"
  on storage.objects
  for select
  using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.employer_id = auth.uid()::text
        and a.resume_storage_path = name
    )
  );
```

### 3b. `company-logos` bucket policies

```sql
-- Employers can upload their own company logo
create policy "employers can upload own logo"
  on storage.objects
  for insert
  with check (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Employers can read their own logo
create policy "employers can read own logo"
  on storage.objects
  for select
  using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Employers can update (overwrite) their own logo
create policy "employers can update own logo"
  on storage.objects
  for update
  using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Employers can delete their own logo
create policy "employers can delete own logo"
  on storage.objects
  for delete
  using (
    bucket_id = 'company-logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- All authenticated users can view any company logo (for job listings)
create policy "authenticated users can view company logos"
  on storage.objects
  for select
  using (
    bucket_id = 'company-logos'
    and auth.role() = 'authenticated'
  );
```

---

## 4. File Size & MIME-Type Limits (optional)

Set these in the **Dashboard → Storage → bucket settings**, or pass them when creating the bucket via the client SDK.

| Bucket          | Max file size | Allowed MIME types                            |
| --------------- | ------------- | --------------------------------------------- |
| `resumes`       | 5 MB          | `application/pdf`                             |
| `company-logos` | 2 MB          | `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` |

---

## 5. Quick Test (JavaScript)

```ts
// Upload a resume
const { error } = await supabase.storage
  .from('resumes')
  .upload(`${userId}/resume.pdf`, file, {
    contentType: 'application/pdf',
    upsert: true,
  });

// Upload a company logo
const { error } = await supabase.storage
  .from('company-logos')
  .upload(`${userId}/logo.png`, file, {
    contentType: 'image/png',
    upsert: true,
  });
```
