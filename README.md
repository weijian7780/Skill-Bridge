# SkillBridge App

Real full-stack implementation for the SkillBridge AI Career Navigator MVP.

## Stack

- Client: React + Vite
- Server: Express
- CV parsing: PDF, DOCX, JPG, PNG, and WebP on the server
- Skill extraction: Gemini primary, local rule fallback
- Job data: Jooble first, Careerjet fallback
- Supabase: direct REST API support for profile snapshots

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
GEMINI_MODEL=gemini-2.5-flash
JOB_PROVIDER=auto
JOOBLE_API_KEY=
CAREERJET_AFFID=
CAREERJET_API_KEY=
CAREERJET_LOCALE=en_MY
CLIENT_PUBLIC_URL=https://your-skillbridge-site.vercel.app
```

`JOB_PROVIDER=auto` is the recommended setting. It tries Jooble first, then falls back to Careerjet if Jooble is missing, unavailable, or returns no usable jobs.

Use `JOB_PROVIDER=jooble` to force Jooble only, or `JOB_PROVIDER=careerjet` to force Careerjet only.

`JOOBLE_API_KEY` is the preferred job API key for local development because Jooble does not require a public website referer in the app's request flow. `CAREERJET_API_KEY` is still supported. `CAREERJET_AFFID` remains accepted only as a backward-compatible fallback variable name.

Without `JOOBLE_API_KEY` or `CAREERJET_API_KEY`, the app still runs, but the job-search section reports that no job API is configured.

## Supabase

The client uses Supabase Auth and Supabase REST API directly, so no Supabase SDK package is required for the V1 Auth/CRUD path.

Set these in the root `.env` file. Vite is configured with `envDir: ".."`, so the client reads `VITE_` variables from the project root while the server reads its own keys from the same file.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

`VITE_SUPABASE_ANON_KEY` is also accepted for older Supabase projects.

Run the SQL in `supabase/schema.sql` inside Supabase SQL Editor before saving profile snapshots. The table uses Row Level Security, so real user-specific writes require Supabase Auth and the user's access token. Until Auth is wired, the app can still run without Supabase configured.

Data storage notes are in `docs/supabase-data-model.md`.

Auth setup required in Supabase Dashboard:

- Enable Email provider for email/password login.
- Enable Google provider only if you want the Google button to work.
- Add the deployed URL to allowed redirect URLs, for example `https://your-skillbridge-site.vercel.app/home`.
- For local development, add `http://127.0.0.1:5173/home` if testing OAuth locally.

Without Supabase env values, protected app routes will redirect to the login screen and show the missing configuration reason.
