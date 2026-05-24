export const DEFAULT_COMPANY_MATCH_LIMIT = 5;

export function getVisibleCompanyMatches(
  jobMatches = [],
  { showAll = false, limit = DEFAULT_COMPANY_MATCH_LIMIT } = {},
) {
  return showAll ? jobMatches : jobMatches.slice(0, limit);
}

export function shouldShowCompanyMatchToggle(
  jobMatches = [],
  limit = DEFAULT_COMPANY_MATCH_LIMIT,
) {
  return jobMatches.length > limit;
}

export function getCompanyMatchToggleLabel(showAll) {
  return showAll ? "Show less" : "Show more";
}
