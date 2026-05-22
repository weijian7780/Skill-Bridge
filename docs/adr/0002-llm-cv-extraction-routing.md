# ADR 0002: LLM Routing For CV Skill Extraction

## Status

Accepted

## Context

The MVP needs real PDF/DOCX parsing and skill extraction. Pure rule-based extraction is cheap and stable, but weaker at interpreting CV language. LLM-based extraction is more intelligent, but API keys and quotas can fail.

## Decision

CV text extraction is deterministic for PDF/DOCX files. CV image uploads use Gemini vision OCR to produce text. Skill extraction uses this order:

1. Gemini 2.5 Flash
2. Local rule-based fallback

The response always reports which extractor produced the result.

## Consequences

- CV extraction can be real without requiring a paid provider on day one.
- The app degrades clearly if the Gemini key is missing or unavailable.
- The user can demo real upload and extraction while still seeing the source of the result.
