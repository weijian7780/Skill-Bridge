import { apiRequest } from "../apiClient.js";

export function searchMarketJobs({ role, region }) {
  const params = new URLSearchParams({
    role,
    location: region,
  });

  return apiRequest(`/jobs/search?${params.toString()}`);
}

export const searchCareerjetJobs = searchMarketJobs;
