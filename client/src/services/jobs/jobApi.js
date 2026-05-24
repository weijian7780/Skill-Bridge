import { apiRequest } from "../apiClient.js";
import { getRegionSearchValue } from "../career/regionOptions.js";

export function searchMarketJobs({ role, region }) {
  return apiRequest(buildMarketJobSearchPath({ role, region }));
}

export function buildMarketJobSearchPath({ role, region }) {
  const params = new URLSearchParams({
    role,
    location: getRegionSearchValue(region),
  });

  return `/jobs/search?${params.toString()}`;
}

export const searchCareerjetJobs = searchMarketJobs;
