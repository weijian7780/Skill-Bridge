# SkillBridge App

Real full-stack implementation for the SkillBridge AI Career Navigator MVP.

## Stack

- Client: React + Vite
- Server: Express
- CV parsing: PDF, DOCX, JPG, PNG, and WebP on the server
- Skill extraction: Gemini primary, local rule fallback for text CVs
- Job data: Jooble API
- Supabase: direct REST API support for profile snapshots and job-search cache

## Setup

PowerShell blocks `npm.ps1` on this machine, so use the `.cmd` shim:

```powershell
npm.cmd install
npm.cmd run dev
```

Client: `http://127.0.0.1:5173`

Server: `http://127.0.0.1:4000`

Production client build:

```powershell
npm.cmd run build
```

## Environment

Copy `.env.example` to `server/.env` and fill keys when available.

```env
GEMINI_API_KEY=
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.5-flash-lite
JOB_PROVIDER=jooble
JOOBLE_API_KEY=
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_server_only_service_role_key
JOB_CACHE_ENABLED=true
JOB_CACHE_TTL_MINUTES=360
```

`JOB_PROVIDER=jooble` is the supported job-search setting. Careerjet was removed from the runtime path because its API key/referer flow rejected the local project request.

`GEMINI_MODEL` handles CV skill extraction, roadmap JSON generation, and image CV OCR for JPG, PNG, and WebP uploads. `GEMINI_FALLBACK_MODELS` is a comma-separated list used only when the primary Gemini chat model returns a transient 429, 500, 502, 503, or 504 error.

`JOOBLE_API_KEY` is required for live job-market data. Jooble does not require a public website referer in the app's request flow, so it is the stable provider for local demos.

Without `JOOBLE_API_KEY`, the app still runs, but the job-search section reports that no job API is configured.

Job searches are cached server-side in Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. The cache key is based on provider, role, and location, so a second student searching the same role/location can reuse the saved result instead of spending another Jooble request. Default cache TTL is 360 minutes.

## Supabase

The client uses Supabase Auth and Supabase REST API directly, so no Supabase SDK package is required for the V1 Auth/CRUD path.

Set these in the root `.env` file. Vite is configured with `envDir: ".."`, so the client reads `VITE_` variables from the project root while the server reads its own keys from the same file.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`VITE_SUPABASE_ANON_KEY` is also accepted for older Supabase projects.

Run the SQL in `supabase/schema.sql` inside Supabase SQL Editor before saving profile snapshots. The table uses Row Level Security, so real user-specific writes require Supabase Auth and the user's access token. Until Auth is wired, the app can still run without Supabase configured.

The `job_search_cache` table is also created by `supabase/schema.sql`. It is intended for backend access through `SUPABASE_SERVICE_ROLE_KEY`; do not expose the service role key to the Vite client or Vercel frontend env variables.

Data storage notes are in `docs/supabase-data-model.md`.

Auth setup required in Supabase Dashboard:

- Enable Email provider for email/password login.
- Enable Google provider only if you want the Google button to work.
- Add the deployed URL to allowed redirect URLs, for example `https://your-skillbridge-site.vercel.app/home`.
- For local development, add `http://127.0.0.1:5173/home` if testing OAuth locally.

Without Supabase env values, protected app routes will redirect to the login screen and show the missing configuration reason.
