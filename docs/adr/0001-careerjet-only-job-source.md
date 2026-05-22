# ADR 0001: Licensed Job APIs For V1 Job Search

## Status

Accepted, amended

## Context

SkillBridge needs real job data for a coursework MVP. JobStreet, LinkedIn, and Glassdoor are attractive comparison targets, but their public job-search access is not suitable for a quick student MVP without partner approval or scraping risk.

Careerjet was the first implemented provider, but its current integration depends on a public registered website URL and referer. That is workable after deployment, but fragile for local development. Jooble's REST API accepts a server-side API key and keyword/location search request, so it is a better default for local demos.

## Decision

V1 uses a licensed API provider layer:

- Default mode: `JOB_PROVIDER=auto`
- Provider order: Jooble first, Careerjet fallback
- Force Jooble only: `JOB_PROVIDER=jooble`
- Force Careerjet only: `JOB_PROVIDER=careerjet`

The app does not merge both providers on every request. It uses Jooble first and only falls back when Jooble is missing, unavailable, or returns no usable jobs. This preserves quota and avoids duplicate market signals.

## Consequences

- The MVP can use real job listings without scraping.
- The implementation stays small enough for a university demo.
- Provider-specific details remain isolated behind the Job Search Provider layer.
- Local development works better with Jooble.
- Careerjet remains available after deployment or when the user wants to force it.
