import { searchJoobleJobs } from "./joobleClient.js";

export async function searchMarketJobs(searchContext) {
  const result = await searchJoobleJobs(searchContext);
  return {
    ...result,
    providerMode: "jooble",
    attempts: [
      {
        source: result.source,
        configured: result.configured,
        total: result.total ?? 0,
        jobs: (result.jobs ?? []).length,
        message: result.message || "",
      },
    ],
  };
}
