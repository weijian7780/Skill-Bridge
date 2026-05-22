import { searchCareerjetJobs } from "./careerjetClient.js";
import { searchJoobleJobs } from "./joobleClient.js";

const providerSearchers = {
  jooble: searchJoobleJobs,
  careerjet: searchCareerjetJobs,
};

export async function searchMarketJobs(searchContext) {
  const provider = normalizeProvider(process.env.JOB_PROVIDER);

  if (provider !== "auto") {
    return providerSearchers[provider](searchContext);
  }

  return searchWithFallback(searchContext);
}

function normalizeProvider(provider) {
  const value = String(provider || "auto").trim().toLowerCase();
  if (value === "jooble" || value === "careerjet") {
    return value;
  }

  return "auto";
}

async function searchWithFallback(searchContext) {
  const attempts = [];
  let firstConfiguredResult = null;
  let lastError = null;

  for (const search of [searchJoobleJobs, searchCareerjetJobs]) {
    try {
      const result = await search(searchContext);
      attempts.push(toAttempt(result));

      if (!result.configured) {
        continue;
      }

      firstConfiguredResult ??= result;

      if ((result.jobs ?? []).length > 0) {
        return { ...result, providerMode: "auto", attempts };
      }
    } catch (error) {
      lastError = error;
      attempts.push({
        source: search === searchJoobleJobs ? "Jooble" : "Careerjet",
        configured: true,
        message: error.message,
      });
    }
  }

  if (firstConfiguredResult) {
    return { ...firstConfiguredResult, providerMode: "auto", attempts };
  }

  if (lastError) {
    throw new Error(`No job provider returned usable jobs. Last error: ${lastError.message}`);
  }

  return {
    configured: false,
    source: "Job Provider",
    providerMode: "auto",
    message: "No job API configured. Add JOOBLE_API_KEY, or set JOB_PROVIDER=careerjet with CAREERJET_API_KEY.",
    attempts,
    jobs: [],
  };
}

function toAttempt(result) {
  return {
    source: result.source,
    configured: result.configured,
    total: result.total ?? 0,
    jobs: (result.jobs ?? []).length,
    message: result.message || "",
  };
}
