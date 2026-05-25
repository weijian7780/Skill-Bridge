# Supabase Data Model

## Decision

Use Supabase for user-owned SkillBridge state after login. V1 stores one profile snapshot per user in `student_profile_snapshots` so the app can persist the current career target, extracted skills, gap analysis, roadmap, and latest CV metadata without over-normalizing early.

The row is owned by the Supabase Auth user id. Client requests must include the student's JWT access token so Row Level Security can enforce ownership.

Use a separate backend-owned `job_search_cache` table for shared job-search results. This cache is not user-owned profile data; it is keyed by provider, extractor version, industry, role, and location so repeated searches can reuse the same Jooble response until expiry.

CV workflow:

```text
Upload latest CV -> extract profile -> review/edit extracted JSON -> confirm -> update one profile snapshot row
```

V1 does not keep CV history. A new confirmed CV replaces the previous `cv_document` and `skill_profile`.

## Store

| Data | Store | Reason |
| --- | --- | --- |
| User identity | Supabase Auth user id | Required for Row Level Security (RLS). |
| Student profile | `university`, `study_year`, `program` | Needed for profile screen and local university context. |
| Career target | `career_target` JSONB | Role, industry, and region. |
| Extracted skill profile | `skill_profile` JSONB | Technical skills, soft skills, education, certifications, extraction provider, confidence, warnings. |
| Skill gaps | `missing_skills` text array | Used by analysis, home, profile, and roadmap screens. |
| Roadmap | `roadmap_items` JSONB | Generated milestone titles, status, reason, resource. |
| CV document metadata | `cv_document` JSONB | File name, MIME type, file size, storage path if Supabase Storage is used. |
| Progress metrics | `readiness_score`, `roadmap_progress` | Dashboard and profile metrics. |
| Job search cache | `job_search_cache.payload` JSONB | Short-lived backend cache for normalized Jooble API results. |

## Job Cache

```text
Student A searches Data Analyst Intern in Sabah
-> Backend checks job_search_cache
-> Cache miss: call Jooble
-> Save provider result with expires_at
-> Student B searches the same role/location
-> Cache hit: use Supabase result without another job API call
```

The cache key is:

```text
provider|extractor version|normalized industry|normalized role|normalized location
```

Default TTL is 360 minutes through `JOB_CACHE_TTL_MINUTES`. Backend access requires `SUPABASE_SERVICE_ROLE_KEY`. Do not expose that key to the Vite client.

## Do Not Store By Default

| Data | Reason |
| --- | --- |
| Raw CV text | Sensitive personal data; keep only extracted structured output unless user explicitly agrees. |
| Raw LLM prompts/responses | Can contain CV content and personal details. |
| Jooble API key, Gemini API key | Secrets must stay in server `.env`, never client Supabase rows. |
| Long-term job listing archive | Job API results should stay short-lived cache entries unless the provider terms explicitly allow long-term storage. |

## Future Split

If the MVP grows, split the snapshot into normalized tables:

| Table | Purpose |
| --- | --- |
| `career_targets` | Multiple career targets per user. |
| `cv_documents` | Uploaded CV metadata and storage paths. |
| `skill_profiles` | Versioned CV extraction outputs. |
| `analysis_runs` | Historical gap-analysis results. |
| `roadmap_items` | Track task-level completion. |
| `saved_jobs` | User-saved job recommendations from the active job provider. |

Keep V1 as a snapshot until there is a real need for history, collaboration, or multi-CV support.
