import { stripHtml } from "./jobNormalizer.js";

// Generic words that carry no role identity. Stripped from the searched role so
// a target like "Senior Data Analyst" does not match every "Senior ..." posting,
// and a broad discover role like "graduate" collapses to zero tokens (see below).
const ROLE_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "for",
  "with",
  "of",
  "in",
  "to",
  "senior",
  "junior",
  "intern",
  "interns",
  "internship",
  "trainee",
  "graduate",
  "graduates",
  "entry",
  "level",
  "fresh",
  "experienced",
  "remote",
  "hybrid",
  "onsite",
  "fulltime",
  "parttime",
  "contract",
  "permanent",
]);

const MIN_ROLE_TOKEN_LENGTH = 3;

// Minimum token length before prefix/stem matching is allowed. "biotech" (7)
// may match "biotechnology"; "dev" or "data" (< 5) must match whole words only.
const MIN_STEM_PREFIX_LENGTH = 5;

// Everything a caller must know lives here: pass a job and the searched role,
// get a boolean. A job is relevant when the searched role appears as a phrase in
// its title, or when any significant role token appears in the title. When the
// role has no significant tokens (e.g. the broad "graduate" discover role), every
// job is considered relevant so discovery stays wide.
export function isRoleRelevantJob(job, role) {
  const tokens = roleTokens(role);
  if (tokens.length === 0) {
    return true;
  }

  const title = normalizeMatchText(job?.title || "");
  if (!title.trim()) {
    return false;
  }

  const rolePhrase = normalizeMatchText(role);
  if (rolePhrase.trim() && title.includes(rolePhrase)) {
    return true;
  }

  const titleWords = title.trim().split(" ").filter(Boolean);
  return tokens.some((token) => titleWords.some((word) => wordMatchesToken(word, token)));
}

// A title word matches a role token when they are the same word, or when one is a
// stem-prefix of the other (e.g. "biotech" <-> "biotechnology",
// "biotechnologist"). Prefix matching only applies for tokens of at least
// MIN_STEM_PREFIX_LENGTH so short tokens like "data" do not bleed into unrelated
// words such as "database"; "analyst" still stays distinct from "analytics"
// because neither is a prefix of the other.
function wordMatchesToken(word, token) {
  if (word === token) {
    return true;
  }

  if (token.length < MIN_STEM_PREFIX_LENGTH) {
    return false;
  }

  return word.startsWith(token) || token.startsWith(word);
}

export function filterJobsByRole(jobs = [], role) {
  const tokens = roleTokens(role);
  if (tokens.length === 0) {
    return Array.isArray(jobs) ? jobs : [];
  }

  return (Array.isArray(jobs) ? jobs : []).filter((job) => isRoleRelevantJob(job, role));
}

// Single source of truth for what relevance filtering did, so every consumer can
// distinguish "the provider returned nothing" from "the provider returned jobs
// but none matched the role". The latter is the case that must warn the user
// instead of silently showing an empty or mismatched list.
export function summarizeRoleRelevance(jobs = [], role) {
  const sourceJobs = Array.isArray(jobs) ? jobs : [];
  const relevantJobs = filterJobsByRole(sourceJobs, role);
  const noRelevantMatches = sourceJobs.length > 0 && relevantJobs.length === 0;
  const trimmedRole = String(role || "").trim();

  return {
    relevantJobs,
    totalBeforeRelevanceFilter: sourceJobs.length,
    noRelevantMatches,
    warning: noRelevantMatches ? buildNoRelevantMatchesWarning(trimmedRole) : "",
  };
}

function buildNoRelevantMatchesWarning(role) {
  const roleLabel = role || "this role";
  return `No job listings closely matched "${roleLabel}". Try a broader or different target role.`;
}

export function roleTokens(role) {
  return normalizeMatchText(role)
    .trim()
    .split(" ")
    .filter((token) => token.length >= MIN_ROLE_TOKEN_LENGTH && !ROLE_STOPWORDS.has(token));
}

// Pad with surrounding spaces so token containment checks behave like word
// boundaries: ` analyst ` matches "data analyst" but not "analytics".
function normalizeMatchText(value) {
  return ` ${stripHtml(String(value || ""))
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}
