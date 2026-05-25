import { apiRequest } from "../apiClient.js";
import { getRegionSearchValue } from "../career/regionOptions.js";
import { getIndustrySearchValue } from "../career/industryOptions.js";

export function searchMarketJobs({ role, region, industry, forceRefresh = false }) {
  return apiRequest(buildMarketJobSearchPath({ role, region, industry, forceRefresh }));
}

export function buildMarketJobSearchPath({ role, region, industry, forceRefresh = false }) {
  const params = new URLSearchParams({
    role,
    location: getRegionSearchValue(region),
  });

  if (industry) {
    params.set("industry", getIndustrySearchValue(industry));
  }

  if (forceRefresh) {
    params.set("refresh", "true");
  }

  return `/jobs/search?${params.toString()}`;
}
