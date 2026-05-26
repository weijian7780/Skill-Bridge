import { apiRequest } from "../apiClient.js";
import { getRegionSearchValue } from "../career/regionOptions.js";

export function searchMarketJobs({ role, region, forceRefresh = false }) {
  return apiRequest(buildMarketJobSearchPath({ role, region, forceRefresh }));
}

export function buildMarketJobSearchPath({ role, region, forceRefresh = false }) {
  const params = new URLSearchParams({
    role,
    location: getRegionSearchValue(region),
  });

  if (forceRefresh) {
    params.set("refresh", "true");
  }

  return `/jobs/search?${params.toString()}`;
}
