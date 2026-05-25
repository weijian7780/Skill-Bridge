export function buildMarketJobTargetKey({
  role,
  industry,
  regionSearchValue,
}) {
  return [
    role,
    industry,
    regionSearchValue,
  ].map((part) => String(part ?? "")).join("|");
}

export function buildMarketJobSearchKey({
  role,
  industry,
  regionSearchValue,
  jobSearchAttempt = 0,
}) {
  return [
    buildMarketJobTargetKey({ role, industry, regionSearchValue }),
    jobSearchAttempt,
  ].map((part) => String(part ?? "")).join("|");
}

export function buildMarketJobSearchTriggerKey({
  hasConfirmedCv,
  role,
  industry,
  regionSearchValue,
  jobSearchAttempt = 0,
}) {
  if (!hasConfirmedCv) {
    return "";
  }

  return buildMarketJobSearchKey({
    role,
    industry,
    regionSearchValue,
    jobSearchAttempt,
  });
}

export function shouldReuseLoadedMarketJobs({
  jobSearchAttempt = 0,
  jobs = [],
  loadedJobTargetKey = "",
  currentJobTargetKey = "",
  analysisStatus = "",
}) {
  if (jobSearchAttempt !== 0) {
    return false;
  }

  return (
    jobs.length > 0 &&
    loadedJobTargetKey &&
    loadedJobTargetKey === currentJobTargetKey &&
    analysisStatus === "ready"
  );
}
