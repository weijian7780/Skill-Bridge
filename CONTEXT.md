# SkillBridge Context

## Domain Terms

### SkillBridge
Career-readiness application for Malaysian undergraduates. The first MVP focuses on UMS students preparing for entry-level Data Analyst roles.

### Career Target
The role, industry, and region selected by the user. It drives job search, skill-gap analysis, and roadmap generation.

### CV Document
The PDF, DOCX, JPG, PNG, or WebP uploaded by the user. The server extracts readable text from the document or image before any skill extraction runs.

### Latest CV
The single current CV used for SkillBridge analysis. A new upload replaces the previous CV metadata and Extracted Skill Profile in the Profile Snapshot.

### Extracted Skill Profile
Structured skills and profile facts derived from a CV Document. V1 uses Gemini first and a local rule-based extractor as the fallback for text CVs.

### Job Search Provider
The source used to retrieve job postings. V1 uses Jooble only. LinkedIn, JobStreet, Glassdoor, and Careerjet are excluded from the runtime provider path.

### Job Requirement Profile
Structured requirements extracted from job posting text. V1 separates hard skills, tools, and soft skills. Skill-gap scoring uses hard skills and tools only; soft skills are supporting evidence and certifications are excluded from V1 gap scoring.

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

### Target Market
The geographic job market used for company requirement comparison. SkillBridge focuses on Malaysia first, including all Malaysia and Malaysian state or federal territory options.

### Company Requirement
A hard skill or tool detected from a job posting for the student's Career Target. Soft skills and certifications are not Company Requirements for V1 scoring.

### Company Requirement Match
A comparison between one job posting's Company Requirements and the student's confirmed resume skills.

### Relevant Job Posting
A job posting that matches the student's Career Target role and has at least one detected Company Requirement. Provider results for unrelated roles are excluded before skill-gap calculation, even if they contain skills that appear in the student's resume.

### Matched Skill
A Company Requirement that is also found in the student's confirmed resume skills.

### Missing Skill
A Company Requirement that is not found in the student's confirmed resume skills.

### Partial Requirement Evidence
A job posting whose requirements were extracted from a short provider snippet instead of a fuller job description. It can be included in Analysis, but its match score must be labelled as partial.

### Market Match Score
The percentage of a job posting's detected Company Requirements that are Matched Skills.

### Analysis
The skill-gap view that compares the student's confirmed resume skills against individual Relevant Job Postings. Analysis shows job-specific Matched Skills and Missing Skills.

### Roadmap Priority Gap
A Missing Skill selected for future learning recommendations by combining patterns across top Company Requirement Matches.

## Approved Scope

- Build a real full-stack web app, not a static Stitch export.
- Use `client/` for React and `server/` for Express.
- Use real PDF/DOCX parsing and Gemini vision OCR for CV image uploads.
- Use Gemini as the primary CV skill extractor and roadmap generator.
- Use Gemini as the primary job requirement extractor when Jooble provides job text.
- Use local rule-based extraction as the fallback if Gemini is missing or unavailable for text CVs.
- Use Jooble for job data in V1.
- Add Supabase after screens and core flow work.
- Use Supabase Auth for real email/password login, Google OAuth redirect, and RLS-backed profile persistence.
- Use latest-CV only for V1. CV History is excluded until the app needs document versioning.

## Excluded From V1

- JobStreet, LinkedIn, or Glassdoor scraping.
- Fake CV extraction as the main flow.
- Scraping or merging unlicensed job-board data from multiple protected platforms.
- CV history and raw CV file storage.
