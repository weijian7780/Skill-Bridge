import { searchMarketJobs } from "./jobProvider.js";

export async function searchMarketJobsWithCache({
  searchContext,
  cache,
  searcher = searchMarketJobs,
  forceRefresh = false,
}) {
  const cachedResult = cache && !forceRefresh ? await cache.get(searchContext) : null;

  if (cachedResult?.hit && cachedResult.result) {
    return {
      ...cachedResult.result,
      cached: true,
      cacheStatus: "hit",
      cacheKey: cachedResult.cacheKey || "",
      cacheExpiresAt: cachedResult.expiresAt || "",
    };
  }

  const providerResult = await searcher(searchContext);
  const cacheMetadata = {
    cached: false,
    cacheStatus: forceRefresh ? "refresh" : cachedResult?.cacheKey ? "miss" : "disabled",
    cacheKey: cachedResult?.cacheKey || "",
    cacheExpiresAt: "",
  };

  if (!cache || !providerResult.configured) {
    return {
      ...providerResult,
      ...cacheMetadata,
    };
  }

  const writeResult = await cache.set(searchContext, providerResult);
  if (!writeResult?.ok) {
    return {
      ...providerResult,
      ...cacheMetadata,
      cacheStatus: writeResult?.reason
        ? forceRefresh
          ? "refresh_write_failed"
          : "write_failed"
        : cacheMetadata.cacheStatus,
      cacheReason: writeResult?.reason || "",
    };
  }

  return {
    ...providerResult,
    cached: false,
    cacheStatus: forceRefresh ? "refreshed" : "stored",
    cacheKey: writeResult.cacheKey || cacheMetadata.cacheKey,
    cacheExpiresAt: writeResult.expiresAt || "",
  };
}
