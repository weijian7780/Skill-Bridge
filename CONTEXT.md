# SkillBridge Context

## Domain Terms

### SkillBridge
Career-readiness application for Malaysian undergraduates. The first MVP focuses on UMS students preparing for entry-level Data Analyst roles.

### Career Target
The role, industry, region, and company preference selected by the user. It drives job search, skill-gap analysis, and roadmap generation.

### CV Document
The PDF, DOCX, JPG, PNG, or WebP uploaded by the user. The server extracts readable text from the document or image before any skill extraction runs.

### Latest CV
The single current CV used for SkillBridge analysis. A new upload replaces the previous CV metadata and Extracted Skill Profile in the Profile Snapshot.

### Extracted Skill Profile
Structured skills and profile facts derived from a CV Document. V1 uses Gemini 2.5 Flash first and a local rule-based extractor as the fallback.

### Job Search Provider
The source used to retrieve job postings. V1 uses Jooble first with Careerjet as an optional fallback. LinkedIn, JobStreet, and Glassdoor scraping are excluded.

### Job Requirement Profile
Skills and requirements extracted from job posting text. It is compared with the Extracted Skill Profile.

### Skill Gap
A missing or weak skill required by the Career Target or Job Requirement Profile.

### Roadmap
A learning sequence generated from Skill Gaps. V1 uses deterministic roadmap rules so the output remains stable for coursework demos.

### Authenticated Student
The signed-in Supabase Auth user. SkillBridge uses this user's access token to make Row Level Security (RLS) protected Supabase REST requests.

### Profile Snapshot
The current persisted student state in Supabase. It stores Career Target, Extracted Skill Profile, Skill Gaps, Roadmap items, CV metadata, and progress metrics for one Authenticated Student.

### CV Review
The checkpoint after CV extraction where the student reviews and edits extracted education, technical skills, soft skills, and certifications before confirming the Latest CV.

### Data Sync
The process of loading a Profile Snapshot after login and saving app-state changes back to Supabase.

## Approved Scope

- Build a real full-stack web app, not a static Stitch export.
- Use `client/` for React and `server/` for Express.
- Use real PDF/DOCX parsing and Gemini vision OCR for CV image uploads.
- Use Gemini 2.5 Flash as the primary LLM extractor.
- Use local rule-based extraction as the fallback if Gemini is missing or unavailable.
- Use Jooble first for job data in V1, with Careerjet retained as a fallback provider.
- Add Supabase after screens and core flow work.
- Use Supabase Auth for real email/password login, Google OAuth redirect, and RLS-backed profile persistence.
- Use latest-CV only for V1. CV History is excluded until the app needs document versioning.

## Excluded From V1

- JobStreet, LinkedIn, or Glassdoor scraping.
- Fake CV extraction as the main flow.
- Scraping or merging unlicensed job-board data from multiple protected platforms.
- CV history and raw CV file storage.
