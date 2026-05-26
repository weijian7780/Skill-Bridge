import { normalizeJoobleJob } from "./jobNormalizer.js";
import { extractJobRequirementProfiles } from "./jobRequirementExtractor.js";

const joobleEndpoint = "https://jooble.org/api";

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
  const requirementProfiles = await extractJobRequirementProfiles(rawJobs);

  return {
    configured: true,
    source: "Jooble",
    total: data.totalCount || 0,
    jobs: rawJobs.map((job, index) => normalizeJoobleJob(job, requirementProfiles[index])),
  };
}

function buildRoleKeywords(role) {
  return String(role || "Data Analyst").trim() || "Data Analyst";
}
