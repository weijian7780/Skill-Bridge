# ADR 0001: Licensed Job APIs For V1 Job Search

## Status

Accepted, amended

## Context

SkillBridge needs real job data for a coursework MVP. JobStreet, LinkedIn, and Glassdoor are attractive comparison targets, but their public job-search access is not suitable for a quick student MVP without partner approval or scraping risk.

Careerjet was tested as a second provider, but its API key/referer flow rejected the local project request with 403. Jooble's REST API accepts a server-side API key and keyword/location search request, so it is the stable provider for local demos.

## Decision

V1 uses a single licensed API provider:

- Supported mode: `JOB_PROVIDER=jooble`
- Removed provider: Careerjet

## Consequences

- The MVP can use real job listings without scraping.
- The implementation stays small enough for a university demo.
- The job-search path avoids Careerjet 403 failures and public-referer configuration.
- Adding another provider later must start as a separate tested integration, not as a silent fallback.
