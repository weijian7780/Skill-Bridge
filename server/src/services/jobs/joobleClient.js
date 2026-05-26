import { normalizeJoobleJob, stripHtml } from "./jobNormalizer.js";
import { extractJobRequirementProfiles } from "./jobRequirementExtractor.js";

const joobleEndpoint = "https://jooble.org/api";
const FULL_DESCRIPTION_MIN_LENGTH = 280;
const FULL_DESCRIPTION_FETCH_TIMEOUT_MS = 6000;

export async function searchJoobleJobs({ role, location }) {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      source: "Jooble",
      message: "Jooble API key not configured. Add JOOBLE_API_KEY to server/.env.",
      jobs: [],
    };
  }

  const response = await fetch(`${joobleEndpoint}/${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keywords: buildRoleKeywords(role),
      location,
      page: "1",
      ResultOnPage: "10",
      companysearch: "false",
    }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Jooble rejected the request with 403. Check JOOBLE_API_KEY.");
    }

    throw new Error(`Jooble request failed with status ${response.status}`);
  }

  const data = await response.json();
  const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
  const enrichedJobs = await enrichJoobleJobsWithFullDescriptions(rawJobs);
  const requirementProfiles = await extractJobRequirementProfiles(enrichedJobs);

  return {
    configured: true,
    source: "Jooble",
    total: data.totalCount || 0,
    jobs: enrichedJobs.map((job, index) => normalizeJoobleJob(job, requirementProfiles[index])),
  };
}

function buildRoleKeywords(role) {
  return String(role || "Data Analyst").trim() || "Data Analyst";
}

async function enrichJoobleJobsWithFullDescriptions(jobs) {
  return Promise.all(jobs.map(enrichJoobleJobWithFullDescription));
}

async function enrichJoobleJobWithFullDescription(job) {
  if (!shouldFetchFullDescription(job)) {
    return job;
  }

  try {
    const pageText = await fetchJoobleJobPageText(job.link);
    if (!isUsefulFullDescription(job, pageText)) {
      return job;
    }

    return {
      ...job,
      fullDescription: pageText,
    };
  } catch {
    return job;
  }
}

function shouldFetchFullDescription(job) {
  if (String(process.env.JOOBLE_FETCH_FULL_DESCRIPTION || "true").toLowerCase() === "false") {
    return false;
  }

  if (hasFullDescription(job)) {
    return false;
  }

  return isJoobleDetailLink(job?.link);
}

function hasFullDescription(job) {
  return stripHtml(job?.fullDescription || job?.description || job?.jobDescription || "").length >= FULL_DESCRIPTION_MIN_LENGTH;
}

function isJoobleDetailLink(link) {
  try {
    const url = new URL(String(link || ""));
    return url.hostname === "jooble.org" || url.hostname.endsWith(".jooble.org")
      ? url.pathname.includes("/jdp/")
      : false;
  } catch {
    return false;
  }
}

async function fetchJoobleJobPageText(link) {
  const timeoutSignal = createFetchTimeoutSignal();
  const response = await fetch(link, {
    method: "GET",
    headers: {
      Accept: "text/html, text/plain;q=0.9, */*;q=0.8",
      "User-Agent": "SkillBridge/1.0 (+https://skillbridge.local)",
    },
    ...(timeoutSignal ? { signal: timeoutSignal } : {}),
  });

  if (!response.ok || !isTextLikeResponse(response)) {
    return "";
  }

  return stripHtml(await response.text());
}

function createFetchTimeoutSignal() {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(FULL_DESCRIPTION_FETCH_TIMEOUT_MS)
    : null;
}

function isTextLikeResponse(response) {
  const contentType = response.headers?.get?.("content-type") || "";
  return !contentType || contentType.includes("text/html") || contentType.includes("text/plain");
}

function isUsefulFullDescription(job, pageText) {
  const text = stripHtml(pageText);
  const snippet = stripHtml(job?.snippet || "");
  const existingDescription = stripHtml(job?.fullDescription || job?.description || job?.jobDescription || "");

  if (text.length < FULL_DESCRIPTION_MIN_LENGTH) {
    return false;
  }

  if (text.length <= Math.max(snippet.length, existingDescription.length) + 80) {
    return false;
  }

  return hasJobRequirementSignals(text);
}

function hasJobRequirementSignals(text) {
  return /\b(requirements?|skills?|experience|qualification|software|tools?|responsibilit(?:y|ies))\b/i.test(text);
}
