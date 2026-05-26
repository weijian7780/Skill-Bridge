export function buildMarketJobTargetKey({
  role,
  regionSearchValue,
}) {
  return [
    role,
    regionSearchValue,
  ].map((part) => String(part ?? "")).join("|");
}

export function buildMarketJobSearchKey({
  role,
  regionSearchValue,
  jobSearchAttempt = 0,
}) {
  return [
    buildMarketJobTargetKey({ role, regionSearchValue }),
    jobSearchAttempt,
  ].map((part) => String(part ?? "")).join("|");
}

export function buildMarketJobSearchTriggerKey({
  hasConfirmedCv,
  role,
  regionSearchValue,
  jobSearchAttempt = 0,
}) {
  if (!hasConfirmedCv) {
    return "";
  }

  return buildMarketJobSearchKey({
    role,
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
