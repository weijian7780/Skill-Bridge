/**
 * Supabase REST API service for saved jobs.
 *
 * Follows the same direct-fetch pattern used in internalJobPostsApi.js.
 */

const SAVED_JOBS_PATH = "/rest/v1/saved_jobs?order=created_at.desc";

function buildSupabaseHeaders({ publishableKey, accessToken }) {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken || publishableKey}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch all saved jobs for the authenticated user.
 *
 * @param {Object} opts
 * @param {Object} opts.config       – { url, publishableKey }
 * @param {string} opts.accessToken  – Supabase auth JWT
 * @returns {Promise<Array>} array of saved job records
 */
export async function fetchSavedJobs({ config, accessToken }) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Supabase not configured");
  }

  const response = await fetch(new URL(SAVED_JOBS_PATH, config.url).toString(), {
    headers: buildSupabaseHeaders({
      publishableKey: config.publishableKey,
      accessToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Save a job for the authenticated user.
 *
 * @param {Object} opts
 * @param {Object} opts.config       – { url, publishableKey }
 * @param {string} opts.accessToken  – Supabase auth JWT
 * @param {string} opts.jobId        – unique job identifier
 * @param {string} opts.jobSource    – "skillbridge" | "market"
 * @param {Object} opts.jobData      – full job payload to persist
 * @returns {Promise<Object>} the created saved_jobs record
 */
export async function saveJob({ config, accessToken, jobId, jobSource, jobData }) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Supabase not configured");
  }

  const response = await fetch(new URL("/rest/v1/saved_jobs", config.url).toString(), {
    method: "POST",
    headers: {
      ...buildSupabaseHeaders({
        publishableKey: config.publishableKey,
        accessToken,
      }),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      job_id: jobId,
      job_source: jobSource,
      job_data: jobData,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Remove a saved job for the authenticated user.
 *
 * @param {Object} opts
 * @param {Object} opts.config       – { url, publishableKey }
 * @param {string} opts.accessToken  – Supabase auth JWT
 * @param {string} opts.jobId        – unique job identifier
 * @param {string} opts.jobSource    – "skillbridge" | "market"
 * @returns {Promise<void>}
 */
export async function unsaveJob({ config, accessToken, jobId, jobSource }) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Supabase not configured");
  }

  const url = new URL("/rest/v1/saved_jobs", config.url);
  url.searchParams.set("job_id", `eq.${jobId}`);
  url.searchParams.set("job_source", `eq.${jobSource}`);

  const response = await fetch(url.toString(), {
    method: "DELETE",
    headers: buildSupabaseHeaders({
      publishableKey: config.publishableKey,
      accessToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error: ${response.status}`);
  }
}

/**
 * Pure function: check whether a job is in the saved list.
 *
 * @param {Array}  savedJobs – array of saved job records
 * @param {string} jobId     – unique job identifier
 * @param {string} jobSource – "skillbridge" | "market"
 * @returns {boolean}
 */
export function isJobSaved(savedJobs, jobId, jobSource) {
  if (!Array.isArray(savedJobs)) {
    return false;
  }

  return savedJobs.some(
    (saved) => saved.job_id === jobId && saved.job_source === jobSource,
  );
}
