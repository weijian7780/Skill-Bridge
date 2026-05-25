import { apiRequest } from "../apiClient.js";
import { getRegionSearchValue } from "../career/regionOptions.js";
import { getIndustrySearchValue } from "../career/industryOptions.js";

export function searchMarketJobs({ role, region, industry }) {
  return apiRequest(buildMarketJobSearchPath({ role, region, industry }));
}

export function buildMarketJobSearchPath({ role, region, industry }) {
  const params = new URLSearchParams({
    role,
    location: getRegionSearchValue(region),
  });

  if (industry) {
    params.set("industry", getIndustrySearchValue(industry));
  }

  return `/jobs/search?${params.toString()}`;
}
