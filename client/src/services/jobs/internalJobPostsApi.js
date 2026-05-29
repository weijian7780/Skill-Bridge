import { attachEmployerProfilesToJobPosts } from "./combinedJobsFeed.js";

const ACTIVE_JOB_POSTS_PATH = "/rest/v1/job_posts?status=eq.active&order=created_at.desc";
const EMPLOYER_PROFILE_SELECT =
  "user_id,company_name,company_logo_storage_path";

function buildSupabaseHeaders({ publishableKey, accessToken }) {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken || publishableKey}`,
    "Content-Type": "application/json",
  };
}

export async function fetchActiveJobPosts({ config, accessToken }) {
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Supabase not configured");
  }

  const response = await fetch(new URL(ACTIVE_JOB_POSTS_PATH, config.url).toString(), {
    headers: buildSupabaseHeaders({
      publishableKey: config.publishableKey,
      accessToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Error: ${response.status}`);
  }

  const jobPosts = await response.json();
  const jobsList = Array.isArray(jobPosts) ? jobPosts : [];

  if (jobsList.length === 0) {
    return [];
  }

  const employerIds = [...new Set(jobsList.map((job) => job.employer_id).filter(Boolean))];
  if (employerIds.length === 0) {
    return jobsList;
  }

  const profilesUrl = new URL("/rest/v1/employer_profiles", config.url);
  profilesUrl.searchParams.set("user_id", `in.(${employerIds.join(",")})`);
  profilesUrl.searchParams.set("select", EMPLOYER_PROFILE_SELECT);

  const profilesResponse = await fetch(profilesUrl.toString(), {
    headers: buildSupabaseHeaders({
      publishableKey: config.publishableKey,
      accessToken,
    }),
  });

  if (!profilesResponse.ok) {
    return jobsList;
  }

  const profiles = await profilesResponse.json();
  return attachEmployerProfilesToJobPosts(
    jobsList,
    Array.isArray(profiles) ? profiles : [],
  );
}
