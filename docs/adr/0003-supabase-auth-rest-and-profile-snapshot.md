# ADR 0003: Supabase Auth REST and Profile Snapshot

## Status

Accepted

## Context

SkillBridge must move beyond prototype navigation. A real implementation needs authenticated users and user-owned persistence. The project currently avoids adding more npm dependencies unless necessary, and the existing Supabase database layer already uses the generated REST API.

Supabase Auth issues JWT access tokens. Supabase REST requests can use those tokens with Row Level Security to restrict profile rows to the signed-in user.

## Decision

Use Supabase Auth REST endpoints directly for V1:

- `POST /auth/v1/signup` for email/password signup.
- `POST /auth/v1/token?grant_type=password` for email/password login.
- `GET /auth/v1/authorize?provider=google` for Google OAuth redirect.
- `GET /auth/v1/user` to resolve the Authenticated Student after callback/session bootstrap.
- `POST /auth/v1/logout` for sign out.

Persist one `student_profile_snapshots` row per Authenticated Student. The client loads the snapshot after login and saves state changes through the Supabase REST API using the student's access token.

## Consequences

- No Supabase SDK package is required for the current CRUD/Auth path.
- The implementation must manually handle session storage, expiry checks, refresh, and callback parsing.
- Google OAuth requires Supabase Dashboard provider setup and allowed redirect URLs.
- The SDK can still be adopted later if Auth/session complexity grows.
