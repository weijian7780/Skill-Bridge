# Job Description Truncation - Diagnostic Logging Guide

## Problem
Job descriptions in the detail panel show truncated text with "..." at the beginning and end.

## Root Cause
The system falls back to Jooble API's short `snippet` field when full descriptions cannot be fetched from job detail pages.

## Diagnostic Logging Added

I've added tagged debug logs (`[DEBUG-desc]`) to track exactly why full descriptions fail:

### Log Locations
- `server/src/services/jobs/joobleClient.js`

### What Gets Logged

1. **Enrichment start**: Total jobs to process
2. **Skip reasons**: Why fetch was skipped for each job
   - `JOOBLE_FETCH_FULL_DESCRIPTION=false` - Disabled via env var
   - `already has full description (N chars)` - Job already has ≥280 char description
   - `not a Jooble detail page (URL)` - Link is not a Jooble `/jdp/` URL
3. **Fetch attempts**: When actually fetching from a URL
4. **Validation failures**: Why fetched content was rejected
   - `too short (N < 280 chars)` - Fetched content below minimum
   - `not significantly longer than existing (N vs M + 80)` - Not enough improvement
   - `missing requirement keywords` - No job requirement signals found
5. **Fetch errors**: Network/timeout errors with error message
6. **Success**: Successful fetches with character count
7. **Summary**: Total succeeded vs failed/skipped

## How to Use

### Step 1: Set up environment

Create `server/.env` from `server/.env.example`:

```bash
cd server
cp .env.example .env
```

Add your Jooble API key to `server/.env`:

```
JOOBLE_API_KEY=your_key_here
```

### Step 2: Start the dev server

```bash
npm run dev:server
```

### Step 3: Trigger a job search

From the client app, search for jobs (e.g., "AI Engineer"). Watch the server console output.

### Step 4: Analyze the logs

Look for patterns:

**Example 1: External job boards (not Jooble detail pages)**
```
[DEBUG-desc] Skipping fetch for "Software Engineer" - reason: not a Jooble detail page (https://external-site.com/job/123)
```
→ **Solution**: These jobs will always use snippets. Consider showing "View full description" link.

**Example 2: Validation failures**
```
[DEBUG-desc] Validation failed for "Data Analyst" - reason: missing requirement keywords
```
→ **Solution**: Relax validation criteria or improve keyword detection.

**Example 3: Network timeouts**
```
[DEBUG-desc] Fetch error for "ML Engineer": AbortError: The operation was aborted due to timeout
```
→ **Solution**: Increase `FULL_DESCRIPTION_FETCH_TIMEOUT_MS` (currently 6000ms).

**Example 4: Too short**
```
[DEBUG-desc] Validation failed for "QA Tester" - reason: too short (150 < 280 chars)
```
→ **Solution**: Lower `FULL_DESCRIPTION_MIN_LENGTH` or accept shorter descriptions.

## Next Steps Based on Findings

### If most jobs skip due to "not a Jooble detail page"
→ Jooble is returning external job board links. Options:
- Display snippet with "View full description" external link
- Accept snippets as-is and remove "..." truncation indicators
- Use a different job API that provides full descriptions

### If most jobs fail validation
→ Validation criteria too strict. Options:
- Lower `FULL_DESCRIPTION_MIN_LENGTH` from 280 to 150
- Remove requirement keyword check
- Accept any content longer than snippet

### If most jobs timeout
→ Network/performance issue. Options:
- Increase timeout from 6s to 10s or 15s
- Add retry logic (1-2 retries)
- Fetch descriptions in background after initial response

### If most jobs succeed
→ The issue is intermittent or environment-specific. Check:
- Network connectivity
- Jooble API rate limits
- Server resources (memory, CPU)

## Cleanup

After diagnosis, remove the debug logs:

```bash
cd server/src/services/jobs
grep -n "\[DEBUG-desc\]" joobleClient.js
```

Then remove all lines containing `[DEBUG-desc]` and the helper functions `getSkipReason()` and `getValidationFailureReason()`.

## Quick Fixes (Without Diagnosis)

If you want to fix immediately without diagnosis:

### Option A: Show snippet with external link
In `JobDetailPanel.jsx` line 335, add a link when description is truncated:

```jsx
{originalJob?.description?.includes('...') && url && (
  <a href={url} target="_blank" rel="noreferrer" className="text-primary">
    View full description →
  </a>
)}
```

### Option B: Disable validation
In `server/.env`, add:
```
JOOBLE_FETCH_FULL_DESCRIPTION=false
```
Then improve snippet display (remove "..." or show it's partial).

### Option C: Relax validation
In `joobleClient.js`, change line 6:
```js
const FULL_DESCRIPTION_MIN_LENGTH = 150; // was 280
```

And comment out line 157 (requirement keyword check):
```js
// return hasJobRequirementSignals(text);
return true;
```
